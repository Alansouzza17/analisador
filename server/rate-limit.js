export function createRateLimiter({ windowMs, max, key = (req) => req.user?.id || req.ip }) {
  const buckets = new Map();
  return function rateLimit(req, res, next) {
    const now = Date.now();
    const bucketKey = String(key(req) || "anonymous");
    const current = buckets.get(bucketKey);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    bucket.count += 1;
    buckets.set(bucketKey, bucket);
    if (bucket.count > max) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return res.status(429).json({ error: "Muitas solicitações. Aguarde um momento e tente novamente." });
    }
    return next();
  };
}
