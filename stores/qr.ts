import { create } from 'zustand';

interface QRSlideData {
  text: string;
  url: string;
  backgroundColor?: string;
}

interface SlideStore {
  slides: Record<string, QRSlideData>;
  setText: (slideId: string, name: string) => void;
  setUrl: (slideId: string, name: string) => void;
  setBackgroundColor: (slideId: string, name: string) => void;
}

export const useQRStore = create<SlideStore>((set, get) => ({
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

  setUrl: (slideId, url) =>
    set((state) => ({
      slides: {
        ...state.slides,
        [slideId]: {
          ...(state.slides[slideId] || {}),
          url: url,
        },
      },
    })),

  setBackgroundColor: (slideId, backgroundColor) =>
    set((state) => ({
      slides: {
        ...state.slides,
        [slideId]: {
          ...(state.slides[slideId] || {}),
          backgroundColor: backgroundColor,
        },
      },
    })),
}));