import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { arrivalsAreStale } from '@/lib/arrivalsFreshness';
import { useArrivalsFreshnessStore } from '@/stores/arrivalsFreshness';

const CHECK_EVERY_MS = 15 * 1000;

// True when this slide has had no good arrivals response for three minutes. Only the
// published screen fetches on a timer, so any editor page never shows the unavailable line.
export function useArrivalsUnavailable(slideId: string): boolean {
  const enabled = !(usePathname() || '').includes('/editor');
  const lastFreshAt = useArrivalsFreshnessStore((s) => s.lastFreshAt[slideId]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    useArrivalsFreshnessStore.getState().startTracking(slideId);
    const timer = setInterval(() => setNow(Date.now()), CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, [slideId, enabled]);

  if (!enabled || lastFreshAt === undefined) return false;
  return arrivalsAreStale(lastFreshAt, now);
}
