const EMBEDDING_MODEL = "models/gemini-embedding-001";
const EMBEDDING_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";
const EMBEDDING_DIMENSION = 768;
const EMBEDDING_TIMEOUT_MS = 30_000;

type EmbedResponse = {
  embedding?: {
    values?: number[];
  };
};

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  }

  let response: Response;
  try {
    response = await fetch(`${EMBEDDING_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        outputDimensionality: EMBEDDING_DIMENSION,
        content: {
          parts: [{ text }],
        },
      }),
      signal: AbortSignal.timeout(EMBEDDING_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("Embedding request timed out. Please retry.");
    }
    throw error;
  }

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(msg || `Embedding request failed (${response.status})`);
  }

  const data = (await response.json()) as EmbedResponse;
  const values = data.embedding?.values;

  if (!values || values.length === 0) {
    throw new Error("Embedding response did not include vector values.");
  }

  if (values.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding dimension mismatch. Expected ${EMBEDDING_DIMENSION}, received ${values.length}.`
    );
  }

  return values;
}
