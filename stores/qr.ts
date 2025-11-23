import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface QRSlideData {
  text: string;
  url: string;
  qrSize: number;
  bgImage?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface SlideStore {
  slides: Record<string, QRSlideData>;
  setText: (slideId: string, name: string) => void;
  setUrl: (slideId: string, name: string) => void;
  setQRSize: (slideId: string, size: number) => void;
  setBackgroundColor: (slideId: string, name: string) => void;
  setTextColor: (slideId: string, color: string) => void;
  setBgImage: (slideId: string, bgImage: string) => void;
}

export const useQRStore = create<SlideStore>()(
  persist(
    (set, get) => ({
      slides: {},

      setQRSize: (slideId, size) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              qrSize: size,
            },
          },
        })),

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

      setUrl: (slideId, url) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              url,
            },
          },
        })),

      setBackgroundColor: (slideId, backgroundColor) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              backgroundColor,
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

      setBgImage: (slideId, bgImage) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              bgImage,
            },
          },
        })),
    }),
    {
      name: 'qr-slides-storage',
    }
  )
);