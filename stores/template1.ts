import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Template1SlideData {
  text: string;
  title: string;
  image: string | null;
  bgImage?: string;
  backgroundColor?: string;
  textColor?: string;
  titleColor?: string;
  logoImage?: string;
  leftContentSize: string;
  rightContentSize: string;
  imageWidth?: number;
  imageHeight?: number;
  imageObjectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  titleTextSize?: number;
  contentTextSize?: number;
}

interface SlideStore {
  slides: Record<string, Template1SlideData>;
  setText: (slideId: string, name: string) => void;
  setTitle: (slideId: string, name: string) => void;
  setImage: (slideId: string, name: string) => void;
  setBgImage: (slideId: string, bgImage: string) => void;
  setBackgroundColor: (slideId: string, color: string) => void;
  setTextColor: (slideId: string, color: string) => void;
  setTitleColor: (slideId: string, color: string) => void;
  setLogoImage: (slideId: string, logoImage: string) => void;
  setLeftContentSize: (slideId: string, size: string) => void;
  setRightContentSize: (slideId: string, size: string) => void;
  setImageWidth: (slideId: string, width: number) => void;
  setImageHeight: (slideId: string, height: number) => void;
  setImageObjectFit: (slideId: string, objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down') => void;
  setTitleTextSize: (slideId: string, size: number) => void;
  setContentTextSize: (slideId: string, size: number) => void;
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

      setTextColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              textColor: color,
            },
          },
        })),

      setTitleColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              titleColor: color,
            },
          },
        })),

      setLogoImage: (slideId, logoImage) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              logoImage,
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

      setTitleTextSize: (slideId, size) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              titleTextSize: size,
            },
          },
        })),

      setContentTextSize: (slideId, size) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              contentTextSize: size,
            },
          },
        })),
    }),
    {
      name: 'template1-store',
    }
  )
);