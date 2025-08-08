import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TransitRouteSlideData {
  destination: string;
  location: string;
  routes: any;
  isLoading: boolean;
  mapRef: mapboxgl.Map | null;
  errorMessage: string;
}

interface SlideStore {
  slides: Record<string, TransitRouteSlideData>;
  setDestination: (slideId: string, destination: string) => void;
  setLocation: (slideId: string, location: string) => void;
  setMapRef: (slideId: string, ref: mapboxgl.Map) => void;
  setRoutes: (slideId: string, routes: any) => void;
  setIsLoading: (slideId: string, isLoading: boolean) => void;
  setErrorMessage: (slideId: string, errorMessage: string) => void;
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
      setRoutes: (slideId, routes) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || []),
              routes,
            },
          },
        })),
      setIsLoading: (slideId, isLoading) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              isLoading,
            },
          },
        })),
      setErrorMessage: (slideId, errorMessage) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              errorMessage,
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
              routes: data.routes,
              // mapRef is excluded here
            },
          ])
        ),
      }),
    }
  )
);