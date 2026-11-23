import { create } from 'zustand';

// When each slide (or slide row) last got a good response from the feed. Kept in memory
// only, so a reloaded screen starts its three minutes from the load, not from an old session.
interface ArrivalsFreshnessStore {
  lastFreshAt: Record<string, number>;
  // The slide on screen now, 'all' when every slide shows at once, or null when not known.
  // Only visible slides run a timer.
  visibleSlideId: string | 'all' | null;
  // Start the clock for a key the first time it is shown. Does nothing if already started.
  startTracking: (key: string) => void;
  markFresh: (key: string) => void;
  setVisibleSlideId: (slideId: string | 'all' | null) => void;
}

export const useArrivalsFreshnessStore = create<ArrivalsFreshnessStore>((set) => ({
  lastFreshAt: {},
  visibleSlideId: null,
  startTracking: (key) =>
    set((s) =>
      s.lastFreshAt[key] === undefined
        ? { lastFreshAt: { ...s.lastFreshAt, [key]: Date.now() } }
        : s
    ),
  markFresh: (key) =>
    set((s) => ({ lastFreshAt: { ...s.lastFreshAt, [key]: Date.now() } })),
  setVisibleSlideId: (slideId) => set({ visibleSlideId: slideId }),
}));
