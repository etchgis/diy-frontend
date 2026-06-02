import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WebEmbedSlideData {
  url: string;
  zoom: number; // 0.25–2.0, default 1.0
  scrollX: number; // horizontal scroll offset in pixels
  scrollY: number; // vertical scroll offset in pixels
  refreshInterval: number; // minutes between auto-reloads, 0 = never
}

interface SlideStore {
  slides: Record<string, WebEmbedSlideData>;
  setUrl: (slideId: string, url: string) => void;
  setZoom: (slideId: string, zoom: number) => void;
  setScrollX: (slideId: string, scrollX: number) => void;
  setScrollY: (slideId: string, scrollY: number) => void;
  setRefreshInterval: (slideId: string, minutes: number) => void;
}

export const useWebEmbedStore = create<SlideStore>()(
  persist(
    (set) => ({
      slides: {},

      setUrl: (slideId, url) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), url },
          },
        })),

      setZoom: (slideId, zoom) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), zoom },
          },
        })),

      setScrollX: (slideId, scrollX) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), scrollX },
          },
        })),

      setScrollY: (slideId, scrollY) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), scrollY },
          },
        })),

      setRefreshInterval: (slideId, refreshInterval) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), refreshInterval },
          },
        })),
    }),
    { name: 'web-embed-store' }
  )
);
