import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Template3SlideData {
  title: string;
  image: string | null;
  bgImage: string;
  backgroundColor: string;
}

interface SlideStore {
  slides: Record<string, Template3SlideData>;
  setTitle: (slideId: string, name: string) => void;
  setImage: (slideId: string, name: string) => void;
  setBgImage: (slideId: string, bgImage: string) => void;
  setBackgroundColor: (slideId: string, color: string) => void;
}

export const useTemplate3Store = create<SlideStore>()(
  persist(
    (set, get) => ({
      slides: {},

      setTitle: (slideId, title) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              title,
            },
          },
        })),

      setImage: (slideId, name) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              image: name,
            },
          },
        })),

      setBgImage: (slideId, bgImage) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              bgImage
            },
          },
        })),

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
    }),
    {
      name: 'template3-store'
    }
  )
);