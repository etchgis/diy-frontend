import { create } from 'zustand';

interface TransitRouteSlideData {
  destination: string;
  location: string;
}

interface SlideStore {
  slides: Record<string, TransitRouteSlideData>;
  setDestination: (slideId: string, description: string) => void;
  setLocation: (slideId: string, location: string) => void;

}

export const useTransitRouteStore = create<SlideStore>((set, get) => ({
  slides: {},

  setDestination: (slideId, description) =>
    set((state) => ({
      slides: {
        ...state.slides,
        [slideId]: { ...(state.slides[slideId] || {}), description },
      },
    })),

  setLocation: (slideId, location) =>
    set((state) => ({
      slides: {
        ...state.slides,
        [slideId]: { ...(state.slides[slideId] || {}), location },
      },
    }))
}));