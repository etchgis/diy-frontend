import { create } from 'zustand';

interface QRSlideData {
  text: string;
}

interface SlideStore {
  slides: Record<string, QRSlideData>;
  setText: (slideId: string, name: string) => void;
  getText: (slideId: string) => string;
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

  getText: (slideId) => get().slides[slideId]?.text || '',
}));