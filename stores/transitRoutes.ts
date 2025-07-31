import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TransitRouteSlideData {
  destination: string;
  location: string;
}

interface SlideStore {
  slides: Record<string, TransitRouteSlideData>;
  setDestination: (slideId: string, destination: string) => void;
  setLocation: (slideId: string, location: string) => void;
}

export const useTransitRouteStore = create<SlideStore>()(
  persist(
    (set, get) => ({
      slides: {},

      setDestination: (slideId, destination) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              destination,
            },
          },
        })),

      setLocation: (slideId, location) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              location,
            },
          },
        })),
    }),
    {
      name: 'transit-route-store',
    }
  )
);