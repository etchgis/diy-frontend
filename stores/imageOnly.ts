import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ImageOnlySlideData {
  image: string | null;
  imageObjectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  backgroundColor: string;
  fullScreen: boolean;
  imageWidth: number;
  imageHeight: number;
}

interface SlideStore {
  slides: Record<string, ImageOnlySlideData>;
  setImage: (slideId: string, image: string | null) => void;
  setImageObjectFit: (slideId: string, objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down') => void;
  setBackgroundColor: (slideId: string, color: string) => void;
  setFullScreen: (slideId: string, fullScreen: boolean) => void;
  setImageWidth: (slideId: string, width: number) => void;
  setImageHeight: (slideId: string, height: number) => void;
}

export const useImageOnlyStore = create<SlideStore>()(
  persist(
    (set) => ({
      slides: {},

      setImage: (slideId, image) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              image,
            },
          },
        })),

      setImageObjectFit: (slideId, objectFit) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              imageObjectFit: objectFit,
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

      setFullScreen: (slideId, fullScreen) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              fullScreen,
            },
          },
        })),

      setImageWidth: (slideId, width) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              imageWidth: width,
            },
          },
        })),

      setImageHeight: (slideId, height) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              imageHeight: height,
            },
          },
        })),
    }),
    {
      name: 'image-only-store',
    }
  )
);
