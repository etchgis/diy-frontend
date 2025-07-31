import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface QRSlideData {
  text: string;
  url: string;
  qrSize: number;
  backgroundColor?: string;
}

interface SlideStore {
  slides: Record<string, QRSlideData>;
  setText: (slideId: string, name: string) => void;
  setUrl: (slideId: string, name: string) => void;
  setQRSize: (slideId: string, size: number) => void;
  setBackgroundColor: (slideId: string, name: string) => void;
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
    }),
    {
      name: 'qr-slides-storage', 
    }
  )
);