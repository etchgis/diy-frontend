import { create } from 'zustand';

interface FixedRouteSlideData {
  stopName: string;
  description: string;
}

interface SlideStore {
  slides: Record<string, FixedRouteSlideData>;
  setStopName: (slideId: string, name: string) => void;
  setDescription?: (slideId: string, description: string) => void;
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

  setDescription: (slideId, description) =>
    set((state) => ({
      slides: {
        ...state.slides,
        [slideId]: { ...(state.slides[slideId] || {}), description },
      },
    }))
}));