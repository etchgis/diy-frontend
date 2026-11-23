// How long a screen may go without a good arrivals response before it stops showing times.
export const ARRIVALS_STALE_AFTER_MS = 3 * 60 * 1000;

export const ARRIVALS_UNAVAILABLE_TEXT = 'Arrivals are not available right now';

// True when the last good response is older than the limit. Times from an old response
// are out of date, so the screen shows the unavailable line instead of them.
export function arrivalsAreStale(
  lastFreshAt: number,
  now: number,
  staleAfterMs: number = ARRIVALS_STALE_AFTER_MS
): boolean {
  return now - lastFreshAt >= staleAfterMs;
}

// A stop feed body is good when it carries an arrivals list. An empty list is good: it
// means no service right now, which is different from the feed being down.
export function isArrivalsBody(body: unknown): body is { arrivals: unknown[] } {
  return !!body && typeof body === 'object' && Array.isArray((body as any).arrivals);
}
