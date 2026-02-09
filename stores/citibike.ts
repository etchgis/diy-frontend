import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CitibikeStation {
  stationId: string;
  name: string;
  lat: number;
  lon: number;
  bikesAvailable: number;
  ebikesAvailable: number;
  docksAvailable: number;
  distance: number;
}

interface CitibikeSlideData {
  title: string;
  backgroundColor: string;
  bgImage: string;
  titleColor: string;
  textColor: string;
  logoImage: string;
  searchRadius: number;
  stationData: CitibikeStation[];
  dataError: boolean;
  titleTextSize?: number;
  contentTextSize?: number;
}

interface CitibikeStore {
  slides: Record<string, CitibikeSlideData>;
  setTitle: (slideId: string, title: string) => void;
  setBackgroundColor: (slideId: string, color: string) => void;
  setBgImage: (slideId: string, bgImage: string) => void;
  setTitleColor: (slideId: string, color: string) => void;
  setTextColor: (slideId: string, color: string) => void;
  setLogoImage: (slideId: string, logoImage: string) => void;
  setSearchRadius: (slideId: string, radius: number) => void;
  setStationData: (slideId: string, data: CitibikeStation[]) => void;
  setDataError: (slideId: string, error: boolean) => void;
  setTitleTextSize: (slideId: string, size: number) => void;
  setContentTextSize: (slideId: string, size: number) => void;
}

export const useCitibikeStore = create<CitibikeStore>()(
  persist(
    (set) => ({
      slides: {},

      setTitle: (slideId, title) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), title },
          },
        })),

      setBackgroundColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), backgroundColor: color },
          },
        })),

      setBgImage: (slideId, bgImage) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), bgImage },
          },
        })),

      setTitleColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), titleColor: color },
          },
        })),

      setTextColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), textColor: color },
          },
        })),

      setLogoImage: (slideId, logoImage) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), logoImage },
          },
        })),

      setSearchRadius: (slideId, radius) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), searchRadius: radius },
          },
        })),

      setStationData: (slideId, data) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), stationData: data },
          },
        })),

      setDataError: (slideId, error) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), dataError: error },
          },
        })),

      setTitleTextSize: (slideId, size) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), titleTextSize: size },
          },
        })),

      setContentTextSize: (slideId, size) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), contentTextSize: size },
          },
        })),
    }),
    {
      name: 'citibike-store',
    }
  )
);
