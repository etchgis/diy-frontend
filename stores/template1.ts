import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Template1SlideData {
  text: string;
  title: string;
  image: string | null;
  bgImage?: string;
  backgroundColor?: string;
  leftContentSize: string;
  rightContentSize: string;
}

interface SlideStore {
  slides: Record<string, Template1SlideData>;
  setText: (slideId: string, name: string) => void;
  setTitle: (slideId: string, name: string) => void;
  setImage: (slideId: string, name: string) => void;
  setBgImage: (slideId: string, bgImage: string) => void;
  setBackgroundColor: (slideId: string, color: string) => void;
  setLeftContentSize: (slideId: string, size: string) => void;
  setRightContentSize: (slideId: string, size: string) => void;
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

      setLeftContentSize: (slideId, size) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              leftContentSize: size,
            },
          },
        })),

      setRightContentSize: (slideId, size) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              rightContentSize: size,
            },
          },
        })),
    }),
    {
      name: 'template1-store',
    }
  )
);