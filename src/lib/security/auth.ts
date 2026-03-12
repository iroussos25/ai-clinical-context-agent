export function validateApiKey(request: Request) {
  const requiredKey = process.env.APP_API_KEY;

  if (!requiredKey) {
    // If no key is configured, keep local dev ergonomics.
    return {
      ok: true,
      reason: "APP_API_KEY not configured",
      bypassed: true,
    };
  }

  const provided = request.headers.get("X-App-Api-Key") ?? "";

  if (provided !== requiredKey) {
    return {
      ok: false,
      reason: "Missing or invalid API key",
      bypassed: false,
    };
  }

  return {
    ok: true,
    reason: "authenticated",
    bypassed: false,
  };
}
