// In-memory limiter: fine for one instance. Swap for Redis when scaling out.
const hits = new Map<string, number[]>();
export function limited(key: string, max = 5, windowMs = 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  recent.push(now); hits.set(key, recent);
  return recent.length > max;
}
