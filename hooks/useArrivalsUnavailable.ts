import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { arrivalsAreStale } from '@/lib/arrivalsFreshness';
import { useArrivalsFreshnessStore } from '@/stores/arrivalsFreshness';

// How often the on-screen slide checks the clock. Short, so the line shows within a few
// seconds of the three minute mark.
const CHECK_EVERY_MS = 2 * 1000;

// For each key (the slide id, or slide id plus row), true when it has had no good response
// for three minutes. Only the published screen fetches on a timer, so any editor page
// never shows the line, and only the slide on screen runs a timer.
export function useStaleKeys(slideId: string, keys: string[]): boolean[] {
  const enabled = !(usePathname() || '').includes('/editor');
  const visibleId = useArrivalsFreshnessStore((s) => s.visibleSlideId);
  const active = enabled && (visibleId === 'all' || visibleId === slideId);
  const lastFresh = useArrivalsFreshnessStore((s) => s.lastFreshAt);
  const [now, setNow] = useState(() => Date.now());
  const keyList = keys.join('|');

  useEffect(() => {
    if (!active) return;
    keyList.split('|').filter(Boolean).forEach((k) => useArrivalsFreshnessStore.getState().startTracking(k));
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, [active, keyList]);

  return keys.map((k) => active && lastFresh[k] !== undefined && arrivalsAreStale(lastFresh[k], now));
}

// The same check for a slide with one fetch.
export function useArrivalsUnavailable(slideId: string): boolean {
  return useStaleKeys(slideId, [slideId])[0];
}
