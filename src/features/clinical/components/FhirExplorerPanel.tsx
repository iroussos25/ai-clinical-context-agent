import { useState } from "react";

import { Card } from "@/components/ui/Card";
import { FhirMode, FhirResource } from "@/features/clinical/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function firstCodingDisplay(value: unknown) {
  const coding = asArray<Record<string, unknown>>(asRecord(value).coding);
  const first = coding[0] ?? {};
  return {
    display: typeof first.display === "string" ? first.display : null,
    code: typeof first.code === "string" ? first.code : null,
  };
}

function firstHumanName(value: unknown) {
  const names = asArray<Record<string, unknown>>(value);
  const first = names[0] ?? {};
  const text = typeof first.text === "string" ? first.text : null;
  if (text) return text;

  const given = asArray<string>(first.given)
    .filter((part) => typeof part === "string")
    .join(" ");
  const family = typeof first.family === "string" ? first.family : "";
  const built = `${given} ${family}`.trim();
  return built || null;
}

function formatIsoDate(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function referenceLabel(value: unknown) {
  const record = asRecord(value);
  const reference = typeof record.reference === "string" ? record.reference : null;
  if (!reference) return null;
  return reference;
}

function displayValue(resource: FhirResource) {
  const quantity = asRecord(resource.valueQuantity);
  if (typeof quantity.value === "number") {
    const unit = typeof quantity.unit === "string" ? ` ${quantity.unit}` : "";
    return `${quantity.value}${unit}`;
  }

  if (typeof resource.valueString === "string") return resource.valueString;
  if (typeof resource.valueBoolean === "boolean") return resource.valueBoolean ? "Yes" : "No";
  if (typeof resource.valueInteger === "number") return String(resource.valueInteger);

  const codeableConcept = asRecord(resource.valueCodeableConcept);
  const coded = firstCodingDisplay(codeableConcept);
  return coded.display ?? coded.code;
}

function summaryTitle(resource: FhirResource) {
  if (resource.resourceType === "Observation") {
    const code = firstCodingDisplay(resource.code);
    return code.display ?? code.code ?? "Observation";
  }

  if (resource.resourceType === "Condition") {
    const code = firstCodingDisplay(resource.code);
    return code.display ?? code.code ?? "Condition";
  }

  if (resource.resourceType === "Patient") {
    return firstHumanName(resource.name) ?? "Patient";
  }

  return resource.resourceType ?? "FHIR Resource";
}

function ClinicianSummary({ resource }: { resource: FhirResource }) {
  if (resource.resourceType === "Observation") {
    const value = displayValue(resource);
    const status = typeof resource.status === "string" ? resource.status : null;
    const observedAt = formatIsoDate(resource.effectiveDateTime);
    const category = firstCodingDisplay(asArray(resource.category)[0]).display;
    const subject = referenceLabel(resource.subject);
    const encounter = referenceLabel(resource.encounter);

    return (
      <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Result:</span> {value ?? "Not provided"}</p>
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Status:</span> {status ?? "Not provided"}</p>
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Category:</span> {category ?? "Not provided"}</p>
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Observed:</span> {observedAt ?? "Not provided"}</p>
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Patient:</span> {subject ?? "Not provided"}</p>
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Encounter:</span> {encounter ?? "Not provided"}</p>
      </div>
    );
  }

  if (resource.resourceType === "Condition") {
    const clinicalStatus = firstCodingDisplay(asRecord(resource.clinicalStatus)).display;
    const verificationStatus = firstCodingDisplay(asRecord(resource.verificationStatus)).display;
    const onset = formatIsoDate(resource.onsetDateTime);
    const recorded = formatIsoDate(resource.recordedDate);
    const subject = referenceLabel(resource.subject);

    return (
      <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Clinical status:</span> {clinicalStatus ?? "Not provided"}</p>
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Verification:</span> {verificationStatus ?? "Not provided"}</p>
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Onset:</span> {onset ?? "Not provided"}</p>
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Recorded:</span> {recorded ?? "Not provided"}</p>
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Patient:</span> {subject ?? "Not provided"}</p>
      </div>
    );
  }

  if (resource.resourceType === "Patient") {
    const name = firstHumanName(resource.name);
    const gender = typeof resource.gender === "string" ? resource.gender : null;
    const birthDate = formatIsoDate(resource.birthDate);
    const identifiers = asArray<Record<string, unknown>>(resource.identifier)
      .map((item) => typeof item.value === "string" ? item.value : null)
      .filter((value): value is string => Boolean(value))
      .slice(0, 3)
      .join(", ");

    return (
      <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Name:</span> {name ?? "Not provided"}</p>
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Gender:</span> {gender ?? "Not provided"}</p>
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Date of birth:</span> {birthDate ?? "Not provided"}</p>
        <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Identifiers:</span> {identifiers || "Not provided"}</p>
      </div>
    );
  }

  const status = typeof resource.status === "string" ? resource.status : null;
  const updated = formatIsoDate(asRecord(resource.meta).lastUpdated);

  return (
    <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
      <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Type:</span> {resource.resourceType ?? "Unknown"}</p>
      <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Status:</span> {status ?? "Not provided"}</p>
      <p><span className="font-medium text-zinc-900 dark:text-zinc-100">Last updated:</span> {updated ?? "Not provided"}</p>
    </div>
  );
}

type FhirExplorerPanelProps = {
  fhirServer: string;
  setFhirServer: (value: string) => void;
  fhirMode: FhirMode;
  setFhirMode: (value: FhirMode) => void;
  fhirQuery: string;
  setFhirQuery: (value: string) => void;
  fhirLoading: boolean;
  fhirError: string | null;
  fhirResults: FhirResource[];
  fhirCount: number;
  fhirLastRequestUrl: string | null;
  onSearch: (e: React.FormEvent) => Promise<void>;
  onClearResults: () => void;
  onSendResourceToWorkbench: (resource: FhirResource) => void;
};

export function FhirExplorerPanel({
  fhirServer,
  setFhirServer,
  fhirMode,
  setFhirMode,
  fhirQuery,
  setFhirQuery,
  fhirLoading,
  fhirError,
  fhirResults,
  fhirCount,
  fhirLastRequestUrl,
  onSearch,
  onClearResults,
  onSendResourceToWorkbench,
}: FhirExplorerPanelProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [clearStatus, setClearStatus] = useState<string | null>(null);

  async function handleCopyCurl() {
    if (!fhirLastRequestUrl) return;

    const curlCommand = `curl -sS -H "Accept: application/fhir+json, application/json" "${fhirLastRequestUrl}"`;

    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopyStatus("Copied cURL command");
      setTimeout(() => setCopyStatus(null), 2200);
    } catch {
      setCopyStatus("Clipboard unavailable");
      setTimeout(() => setCopyStatus(null), 2200);
    }
  }

  function handleClearResults() {
    if (fhirResults.length === 0 && !fhirLastRequestUrl && !fhirError) {
      return;
    }

    const confirmed = window.confirm("Clear FHIR results and last request details?");
    if (!confirmed) return;

    onClearResults();
    setClearStatus("FHIR results cleared");
    setTimeout(() => setClearStatus(null), 2200);
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          FHIR Sandbox Explorer
        </h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
          Query a FHIR server for Patient, Observation, and Condition resources.
        </p>

        <form onSubmit={onSearch} className="space-y-3">
          <input
            value={fhirServer}
            onChange={(e) => setFhirServer(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder-zinc-600"
            placeholder="FHIR base URL"
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={fhirMode}
              onChange={(e) => setFhirMode(e.target.value as FhirMode)}
              className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm text-zinc-900 focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
            >
              <option value="Patient">Patient</option>
              <option value="Observation">Observation</option>
              <option value="Condition">Condition</option>
            </select>

            <input
              value={fhirQuery}
              onChange={(e) => setFhirQuery(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder-zinc-600"
              placeholder="Search term"
            />

            <button
              type="submit"
              disabled={fhirLoading || !fhirQuery.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {fhirLoading ? "Searching..." : "Search"}
            </button>

            <button
              type="button"
              disabled={!fhirLastRequestUrl}
              onClick={() => void handleCopyCurl()}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Copy Last cURL
            </button>

            <button
              type="button"
              disabled={fhirResults.length === 0 && !fhirLastRequestUrl && !fhirError}
              onClick={handleClearResults}
              className="rounded-xl border border-rose-300 px-4 py-3 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30"
            >
              Clear Results
            </button>
          </div>
        </form>

        {fhirError && <p className="mt-3 text-xs text-red-500">Error: {fhirError}</p>}
        {copyStatus && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{copyStatus}</p>}
        {clearStatus && (
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{clearStatus}</p>
        )}
        {fhirLastRequestUrl && (
          <p className="mt-2 break-all text-[11px] text-zinc-500 dark:text-zinc-400">
            Last request: {fhirLastRequestUrl}
          </p>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Results ({fhirCount})
        </h3>

        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Clinician view: key fields are summarized first. Raw FHIR JSON remains available per item.
        </p>

        <div className="mt-3 max-h-130 space-y-2 overflow-y-auto">
          {fhirResults.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No resources loaded yet.</p>
          )}

          {fhirResults.map((resource) => (
            <div
              key={`${resource.resourceType}-${resource.id}`}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {summaryTitle(resource)}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {resource.resourceType ?? "Resource"}
                    {resource.id ? ` | ${resource.id}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSendResourceToWorkbench(resource)}
                  className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-100 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-300 dark:hover:bg-cyan-950/50"
                >
                  Send to Workbench
                </button>
              </div>

              <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                <ClinicianSummary resource={resource} />
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-zinc-500 dark:text-zinc-400">
                  View raw FHIR JSON
                </summary>
                <pre className="mt-2 overflow-x-auto text-xs text-zinc-700 dark:text-zinc-300">
                  {JSON.stringify(resource, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
