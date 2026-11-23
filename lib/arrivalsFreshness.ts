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

// One arrival the screen can draw: it needs the arrival and scheduled times as numbers.
export function isArrivalEntry(entry: unknown): boolean {
  if (!entry || typeof entry !== 'object') return false;
  const e = entry as any;
  return Number.isFinite(e.arrive) && Number.isFinite(e.arriveScheduled);
}

// A timetable body is good when it has a stops list. An empty list is good.
export function isTimetableBody(body: unknown): boolean {
  return !!body && typeof body === 'object' && Array.isArray((body as any).stops);
}

// An OTP trip answer is good when it has a plan with an itineraries list (possibly empty)
// or the specific "no trip found" error. Any other error object is a failure.
export function isOtpPlanBody(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const b = body as any;
  if (Array.isArray(b.plan?.itineraries)) return true;
  const err = b.error;
  return !!err && typeof err === 'object' && (err.id === 404 || /no trip/i.test(String(err.msg ?? '')));
}

// A stop feed body is good when it carries an arrivals list. An empty list is good: it
// means no service right now, which is different from the feed being down.
export function isArrivalsBody(body: unknown): body is { arrivals: unknown[] } {
  return !!body && typeof body === 'object' && Array.isArray((body as any).arrivals);
}

// The strict check for the published screen: an arrivals list whose entries can all be drawn.
export function isDrawableArrivalsBody(body: unknown): boolean {
  return isArrivalsBody(body) && body.arrivals.every(isArrivalEntry);
}
