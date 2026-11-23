import { create } from 'zustand';

// When each slide last got a good response from the feed. Kept in memory only, so a
// reloaded screen starts its three minutes from the load, not from an old session.
interface ArrivalsFreshnessStore {
  lastFreshAt: Record<string, number>;
  // Start the clock for a slide the first time it is shown. Does nothing if already started.
  startTracking: (slideId: string) => void;
  markFresh: (slideId: string) => void;
}

export const useArrivalsFreshnessStore = create<ArrivalsFreshnessStore>((set) => ({
  lastFreshAt: {},
  startTracking: (slideId) =>
    set((s) =>
      s.lastFreshAt[slideId] === undefined
        ? { lastFreshAt: { ...s.lastFreshAt, [slideId]: Date.now() } }
        : s
    ),
  markFresh: (slideId) =>
    set((s) => ({ lastFreshAt: { ...s.lastFreshAt, [slideId]: Date.now() } })),
}));
