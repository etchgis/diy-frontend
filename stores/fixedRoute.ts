import { create } from 'zustand';

interface FixedRouteSlideData {
  stopName: string;
}

interface SlideStore {
  slides: Record<string, FixedRouteSlideData>;
  setStopName: (slideId: string, name: string) => void;
  getStopName: (slideId: string) => string;
}

export const useFixedRouteStore = create<SlideStore>((set, get) => ({
  slides: {},

  setStopName: (slideId, name) =>
    set((state) => ({
      slides: {
        ...state.slides,
        [slideId]: {
          ...(state.slides[slideId] || {}),
          stopName: name,
        },
      },
    })),

  getStopName: (slideId) => get().slides[slideId]?.stopName || '',
}));