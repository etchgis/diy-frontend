import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TransitRouteSlideData {
  destination: string;
  location: string;
  mapRef: mapboxgl.Map | null;
}

interface SlideStore {
  slides: Record<string, TransitRouteSlideData>;
  setDestination: (slideId: string, destination: string) => void;
  setLocation: (slideId: string, location: string) => void;
  setMapRef: (slideId: string, ref: mapboxgl.Map) => void;
  getMapRef: (slideId: string) => mapboxgl.Map | null;
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

      setMapRef: (slideId, ref) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              mapRef: ref,
            },
          },
        })),
        getMapRef: (slideId) => get().slides[slideId]?.mapRef ?? null,
    }),
    {
      name: 'transit-route-store',
      partialize: (state) => ({
        // Exclude mapRef from persisted state
        slides: Object.fromEntries(
          Object.entries(state.slides).map(([slideId, data]) => [
            slideId,
            {
              destination: data.destination,
              location: data.location,
              // mapRef is excluded here
            },
          ])
        ),
      }),
    }
  )
);