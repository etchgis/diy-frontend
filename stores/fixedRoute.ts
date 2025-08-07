import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StateStorage, PersistOptions } from 'zustand/middleware';

interface FixedRouteSlideData {
  stopName: string;
  description: string;
  backgroundColor: string;
  titleColor: string;
  tableColor: string;
  tableTextColor: string;
  bgImage: string;
  selectedStop?: any;
}

interface SlideStore {
  slides: Record<string, FixedRouteSlideData>;
  setStopName: (slideId: string, name: string) => void;
  setDescription: (slideId: string, description: string) => void;
  setBackgroundColor: (slideId: string, color: string) => void;
  setTitleColor: (slideId: string, color: string) => void;
  setTableColor: (slideId: string, color: string) => void;
  setTableTextColor: (slideId: string, color: string) => void;
  setBgImage: (slideId: string, bgImage: string) => void;
  setSelectedStop: (slideId: string, stop: any) => void;
}

export const useFixedRouteStore = create<SlideStore>()(
  persist<SlideStore>(
    (set, get) => ({
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

      setBgImage: (slideId, image) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              bgImage: image
            },
          },
        })),
        
      setSelectedStop: (slideId, stop) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), selectedStop: stop },
          },
        })),
    }),
    {
      name: 'fixed-route-storage'
    }
  )
);