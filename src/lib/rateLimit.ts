/**
 * Lightweight client-side rate limiter.
 * NOTE: This is best-effort UX protection only — it lives in localStorage and
 * can be bypassed by a determined attacker. True rate limiting must be added
 * at the edge once backend primitives exist. Login lockout is already enforced
 * server-side via the `login_attempts` table + `loginGuard.ts`.
 */

type Bucket = { count: number; resetAt: number };

const KEY_PREFIX = "rl:";

function read(key: string): Bucket | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    if (!raw) return null;
    const b = JSON.parse(raw) as Bucket;
    if (Date.now() > b.resetAt) {
      localStorage.removeItem(KEY_PREFIX + key);
      return null;
    }
    return b;
  } catch {
    return null;
  }
}

function write(key: string, b: Bucket) {
  try {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(b));
  } catch {
    /* ignore quota */
  }
}

/**
 * Check + increment. Returns { allowed, retryInSec, remaining }.
 * @param key   unique action id (e.g. `contribute:${userId}`)
 * @param max   max actions allowed in window
 * @param windowMs  window length in ms
 */
export function checkRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const existing = read(key);
  if (!existing) {
    write(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryInSec: 0, remaining: max - 1 };
  }
  if (existing.count >= max) {
    return {
      allowed: false,
      retryInSec: Math.ceil((existing.resetAt - now) / 1000),
      remaining: 0,
    };
  }
  existing.count += 1;
  write(key, existing);
  return { allowed: true, retryInSec: 0, remaining: max - existing.count };
}

export function resetRateLimit(key: string) {
  try {
    localStorage.removeItem(KEY_PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** Common presets used across the app. */
export const RATE_LIMITS = {
  contribution: { max: 5, windowMs: 60_000 },       // 5 / min
  loanApply:    { max: 3, windowMs: 5 * 60_000 },   // 3 / 5min
  loanRepay:    { max: 5, windowMs: 60_000 },       // 5 / min
  withdraw:     { max: 3, windowMs: 60_000 },       // 3 / min
  pinAttempt:   { max: 10, windowMs: 5 * 60_000 },  // 10 / 5min (server also enforces)
  otpRequest:   { max: 3, windowMs: 60_000 },       // 3 / min
} as const;
