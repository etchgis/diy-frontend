import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Template1SlideData {
  text: string;
  title: string;
  image: string | null;
}

interface SlideStore {
  slides: Record<string, Template1SlideData>;
  setText: (slideId: string, name: string) => void;
  setTitle: (slideId: string, name: string) => void;
  setImage: (slideId: string, name: string) => void;
}

export const useTemplate1Store = create<SlideStore>()(
  persist(
    (set) => ({
      slides: {},
      setText: (slideId, name) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              text: name,
            },
          },
        })),
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
      name: 'template1-store',
    }
  )
);