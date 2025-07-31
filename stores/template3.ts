import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Template3SlideData {
  title: string;
  image: string | null;
}

interface SlideStore {
  slides: Record<string, Template3SlideData>;
  setTitle: (slideId: string, name: string) => void;
  setImage: (slideId: string, name: string) => void;
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
    }),
    {
      name: 'template3-store'
    }
  )
);