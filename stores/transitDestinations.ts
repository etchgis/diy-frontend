import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TransitionDestinationsSlideData {
  backgroundColor: string;
  rowColor: string;
  alternateRowColor: string;
  tableHeaderTextColor: string;
  tableTextColor: string;
  destinations: any[];
  suggestions?: any[];
  selectedFeature: any | null;
  locationError: boolean;
  displayName: string;
  errorMessage?: string;
  query: string;
}

interface SlideStore {
  slides: Record<string, TransitionDestinationsSlideData>;
  setBackgroundColor: (slideId: string, color: string) => void;
  setRowColor: (slideId: string, color: string) => void;
  setAlternateRowColor: (slideId: string, color: string) => void;
  setTableHeaderTextColor: (slideId: string, color: string) => void;
  setTableTextColor: (slideId: string, color: string) => void;
  setDestinations: (slideId: string, destinations: any[]) => void;
  setSuggestions: (slideId: string, suggestions: any[]) => void;
  setSelectedFeature: (slideId: string, feature: any) => void;
  setLocationError: (slideId: string, error: boolean) => void;
  setDisplayName: (slideId: string, name: string) => void;
  setQuery: (slideId: string, query: string) => void;
  setErrorMessage: (slideId: string, message: string) => void;
}

export const useTransitDestinationsStore = create<SlideStore>()(
  persist(
    (set, get) => ({
      slides: {},

      setBackgroundColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              backgroundColor: color,
            },
          },
        })),

      setRowColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              rowColor: color,
            },
          },
        })),

      setAlternateRowColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              alternateRowColor: color,
            },
          },
        })),

      setTableHeaderTextColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              tableHeaderTextColor: color,
            },
          },
        })),

      setTableTextColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              tableTextColor: color,
            },
          },
        })),

      setDestinations: (slideId, destinations) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              destinations: destinations,
            },
          },
        })),

      setSuggestions: (slideId, suggestions) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              suggestions: suggestions,
            },
          },
        })),

      setSelectedFeature: (slideId, feature) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              selectedFeature: feature,
            },
          },
        })),
      setLocationError: (slideId, error) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              locationError: error,
            },
          },
        })),
      setDisplayName: (slideId, name) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              displayName: name,
            },
          },
        })),

      setQuery: (slideId, query) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              query: query,
            },
          },
        })),

      setErrorMessage: (slideId, message) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              errorMessage: message,
            },
          },
        })),


    }),
    {
      name: 'transit-destinations-storage',
    }
  )
);