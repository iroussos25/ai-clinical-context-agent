type LimitBucket = {
  count: number;
  resetAt: number;
};

const inMemoryBuckets = new Map<string, LimitBucket>();

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function enforceRateLimit(params: {
  key: string;
  maxRequests: number;
  windowMs: number;
}) {
  const now = Date.now();
  const existing = inMemoryBuckets.get(params.key);

  if (!existing || existing.resetAt <= now) {
    inMemoryBuckets.set(params.key, {
      count: 1,
      resetAt: now + params.windowMs,
    });

    return {
      allowed: true,
      remaining: params.maxRequests - 1,
      resetAt: now + params.windowMs,
    };
  }

  if (existing.count >= params.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  inMemoryBuckets.set(params.key, existing);

  return {
    allowed: true,
    remaining: params.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}
