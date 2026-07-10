interface Bucket {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private ipBuckets = new Map<string, Bucket>();

  constructor(
    private readonly maxPerWindow: number,
    private readonly windowMs: number
  ) {}

  check(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
    const now = Date.now();
    const bucket = this.ipBuckets.get(ip) ?? { count: 0, resetAt: now + this.windowMs };
    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + this.windowMs;
    }
    if (bucket.count >= this.maxPerWindow) {
      return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
    }
    bucket.count += 1;
    this.ipBuckets.set(ip, bucket);
    return { ok: true };
  }
}
