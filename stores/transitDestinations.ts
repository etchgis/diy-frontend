import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TransitionDestinationsSlideData {
  backgroundColor: string;
  rowColor: string;
  alternateRowColor: string;
  tableHeaderTextColor: string;
  tableTextColor: string;
}

interface SlideStore {
  slides: Record<string, TransitionDestinationsSlideData>;
  setBackgroundColor: (slideId: string, color: string) => void;
  setRowColor: (slideId: string, color: string) => void;
  setAlternateRowColor: (slideId: string, color: string) => void;
  setTableHeaderTextColor: (slideId: string, color: string) => void;
  setTableTextColor: (slideId: string, color: string) => void;
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
    }),
    {
      name: 'transit-destinations-storage',
    }
  )
);