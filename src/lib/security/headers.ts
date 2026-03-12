const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

function getAllowedOrigins() {
  const configured = process.env.CORS_ALLOWED_ORIGINS?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return configured && configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;
}

export function resolveAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  return getAllowedOrigins().includes(origin) ? origin : null;
}

export function createCorsHeaders(request: Request) {
  const allowedOrigin = resolveAllowedOrigin(request);

  return {
    "Access-Control-Allow-Origin": allowedOrigin ?? "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-App-Api-Key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  } as Record<string, string>;
}

export function createSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-DNS-Prefetch-Control": "off",
    "X-Permitted-Cross-Domain-Policies": "none",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
  } as Record<string, string>;
}
