import { ExternalLiteratureEvidence } from "@/features/clinical/types";

const PUBMED_REQUEST_TIMEOUT_MS = 25_000;

const TOPIC_PATTERNS: Array<{ pattern: RegExp; terms: string[] }> = [
  {
    pattern: /(sepsis|septic shock|lactate|vasopressor|hypotension|map|infection|cultures?)/i,
    terms: ["sepsis", "septic shock"],
  },
  {
    pattern: /(ards|acute respiratory distress|peep|fio2|ventilator|intubat|hypoxemia|trach)/i,
    terms: ["acute respiratory distress syndrome", "mechanical ventilation"],
  },
  {
    pattern: /(aki|acute kidney injury|creatinine|crrt|dialysis|oliguria|bun)/i,
    terms: ["acute kidney injury", "renal replacement therapy"],
  },
  {
    pattern: /(cardiogenic shock|ecmo|va-ecmo|iabp|dobutamine|milrinone|low output)/i,
    terms: ["cardiogenic shock", "extracorporeal membrane oxygenation"],
  },
  {
    pattern: /(delirium|encephalopathy|stroke|neurologic|cognitive)/i,
    terms: ["ICU delirium", "critical illness encephalopathy"],
  },
  {
    pattern: /(gi bleed|melena|erosive gastritis|transfusion|ischemic colitis)/i,
    terms: ["gastrointestinal bleeding", "critical illness"],
  },
];

function decodeXmlEntities(input: string) {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripXmlTags(input: string) {
  return decodeXmlEntities(input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function buildIntentTerms(prompt: string) {
  const lowered = prompt.toLowerCase();
  if (/(diagnos|concern|indicat|suggest)/.test(lowered)) {
    return ["diagnosis", "differential", "review"];
  }

  if (/(next step|management|consider|treatment|workup|evaluate)/.test(lowered)) {
    return ["guideline", "management", "review"];
  }

  return ["guideline", "review"];
}

export function buildLiteratureQuery(prompt: string, context: string) {
  const sourceText = `${prompt}\n${context.slice(0, 6000)}`;
  const topicTerms = new Set<string>();

  for (const entry of TOPIC_PATTERNS) {
    if (entry.pattern.test(sourceText)) {
      entry.terms.forEach((term) => topicTerms.add(term));
    }
  }

  if (topicTerms.size === 0) {
    topicTerms.add("critical care");
    topicTerms.add("intensive care");
  }

  const intentTerms = buildIntentTerms(prompt);
  const topicQuery = Array.from(topicTerms)
    .map((term) => `"${term}"`)
    .join(" OR ");
  const intentQuery = intentTerms.map((term) => `"${term}"`).join(" OR ");

  return `(${topicQuery}) AND (${intentQuery})`;
}

type ESearchResponse = {
  esearchresult?: {
    idlist?: string[];
  };
};

type ESummaryRecord = {
  uid?: string;
  title?: string;
  fulljournalname?: string;
  pubdate?: string;
  articleids?: Array<{ idtype?: string; value?: string }>;
};

type ESummaryResponse = {
  result?: Record<string, ESummaryRecord | string[] | undefined> & {
    uids?: string[];
  };
};

async function fetchPubMedAbstracts(pmids: string[]) {
  const response = await fetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=xml`,
    {
      signal: AbortSignal.timeout(PUBMED_REQUEST_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    throw new Error(`PubMed abstract fetch failed (${response.status})`);
  }

  const xml = await response.text();
  const articles = xml.split("<PubmedArticle>").slice(1);
  const abstracts = new Map<string, string>();

  for (const article of articles) {
    const pmidMatch = article.match(/<PMID[^>]*>(.*?)<\/PMID>/);
    const pmid = pmidMatch ? stripXmlTags(pmidMatch[1]) : "";
    if (!pmid) continue;

    const abstractParts = Array.from(article.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g))
      .map((match) => stripXmlTags(match[1]))
      .filter(Boolean);

    if (abstractParts.length > 0) {
      abstracts.set(pmid, abstractParts.join(" "));
    }
  }

  return abstracts;
}

export async function searchPubMedLiterature(
  prompt: string,
  context: string,
  maxResults = 4
): Promise<{ query: string; evidence: ExternalLiteratureEvidence[] }> {
  const query = buildLiteratureQuery(prompt, context);
  const esearchUrl =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${maxResults}&term=${encodeURIComponent(
      query
    )}`;

  const searchResponse = await fetch(esearchUrl, {
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(PUBMED_REQUEST_TIMEOUT_MS),
  });

  if (!searchResponse.ok) {
    throw new Error(`PubMed search failed (${searchResponse.status})`);
  }

  const searchData = (await searchResponse.json()) as ESearchResponse;
  const pmids = searchData.esearchresult?.idlist?.filter(Boolean) ?? [];

  if (pmids.length === 0) {
    return { query, evidence: [] };
  }

  const summaryResponse = await fetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmids.join(",")}`,
    {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(PUBMED_REQUEST_TIMEOUT_MS),
    }
  );

  if (!summaryResponse.ok) {
    throw new Error(`PubMed summary fetch failed (${summaryResponse.status})`);
  }

  const summaryData = (await summaryResponse.json()) as ESummaryResponse;
  const abstracts = await fetchPubMedAbstracts(pmids);

  const evidence = pmids
    .map<ExternalLiteratureEvidence | null>((pmid) => {
      const summary = summaryData.result?.[pmid] as ESummaryRecord | undefined;
      const abstractSnippet = abstracts.get(pmid);
      if (!summary?.title || !abstractSnippet) {
        return null;
      }

      const pmcId = summary.articleids?.find((entry) => entry.idtype === "pmc")?.value;

      return {
        id: pmid,
        title: summary.title,
        abstractSnippet: abstractSnippet.slice(0, 1800),
        journal: summary.fulljournalname,
        publishedAt: summary.pubdate,
        sourceLabel: "PubMed",
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        pmcUrl: pmcId ? `https://pmc.ncbi.nlm.nih.gov/articles/${pmcId}/` : undefined,
      };
    })
    .filter((item): item is ExternalLiteratureEvidence => item !== null);

  return {
    query,
    evidence,
  };
}
