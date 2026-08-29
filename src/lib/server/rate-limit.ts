const windows = new Map<string, { count: number; resetAt: number }>();
const MAX_KEYS = 5_000;

function removeExpired(now: number) {
  for (const [key, value] of windows) {
    if (value.resetAt <= now) windows.delete(key);
  }
}

/**
 * Fixed-window rate limit with a hard key-cardinality cap. Returns false
 * (fail closed) when a new key would exceed `MAX_KEYS`.
 */
export function allowRequest(
  key: string,
  limit = 30,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  if (windows.size >= MAX_KEYS) {
    removeExpired(now);
    // Fail closed when attacker-controlled cardinality still exceeds the cap.
    if (windows.size >= MAX_KEYS && !windows.has(key)) return false;
  }
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

/**
 * Allowance for one identity.
 *
 * Rate limits are keyed by identity and client address. In demo mode every
 * visitor authenticates as the same synthetic identity, so a production-tight
 * per-identity limit would throttle the whole shared demo the moment two
 * people opened it. Real identities keep the strict production limit.
 */
export function limitFor(synthetic: boolean, productionLimit: number): number {
  return synthetic ? productionLimit * 6 : productionLimit;
}

export function clearRateLimitsForTesting() {
  windows.clear();
}
