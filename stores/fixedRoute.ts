import { create } from 'zustand';

interface FixedRouteSlideData {
  stopName: string;
  description: string;
  backgroundColor: string;
  titleColor: string;
  tableColor: string;
  tableTextColor: string;
}

interface SlideStore {
  slides: Record<string, FixedRouteSlideData>;
  setStopName: (slideId: string, name: string) => void;
  setDescription: (slideId: string, description: string) => void;
  setBackgroundColor: (slideId: string, color: string) => void;
  setTitleColor: (slideId: string, color: string) => void;
  setTableColor: (slideId: string, color: string) => void;
  setTableTextColor: (slideId: string, color: string) => void;
}

export const useFixedRouteStore = create<SlideStore>((set, get) => ({
  slides: {},

  setStopName: (slideId, name) =>
    set((state) => ({
      slides: {
        ...state.slides,
        [slideId]: {
          ...(state.slides[slideId] || {}),
          stopName: name,
        },
      },
    })),

  setDescription: (slideId, description) =>
    set((state) => ({
      slides: {
        ...state.slides,
        [slideId]: { ...(state.slides[slideId] || {}), description },
      },
    })),

  setBackgroundColor: (slideId, color) =>
    set((state) => ({
      slides: {
        ...state.slides,
        [slideId]: { ...(state.slides[slideId] || {}), backgroundColor: color },
      },
    })),

  setTitleColor: (slideId, color) =>
    set((state) => ({
      slides: {
        ...state.slides,
        [slideId]: { ...(state.slides[slideId] || {}), titleColor: color },
      },
    })),

  setTableColor: (slideId, color) =>
    set((state) => ({
      slides: {
        ...state.slides,
        [slideId]: { ...(state.slides[slideId] || {}), tableColor: color },
      },
    })),

  setTableTextColor: (slideId, color) =>
    set((state) => ({
      slides: {
        ...state.slides,
        [slideId]: { ...(state.slides[slideId] || {}), tableTextColor: color },
      },
    })),


}));
