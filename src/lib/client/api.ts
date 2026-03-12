export function getClientApiHeaders(extra?: HeadersInit) {
  const apiKey = process.env.NEXT_PUBLIC_APP_API_KEY;

  const base: Record<string, string> = {
    ...(apiKey ? { "X-App-Api-Key": apiKey } : {}),
  };

  if (!extra) return base;

  if (extra instanceof Headers) {
    extra.forEach((value, key) => {
      base[key] = value;
    });
    return base;
  }

  if (Array.isArray(extra)) {
    for (const [key, value] of extra) {
      base[key] = value;
    }
    return base;
  }

  return {
    ...base,
    ...extra,
  };
}

export async function readApiErrorMessage(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const data = (await response.json()) as { error?: string; requestId?: string };
      if (data.error) {
        return data.requestId ? `${data.error} (request ${data.requestId})` : data.error;
      }
    }

    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}
