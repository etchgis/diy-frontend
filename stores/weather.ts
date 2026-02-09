import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WeatherCurrent {
  temp: number;
  condition: string;
  code: number;
  humidity: number;
  windSpeed: number;
  date: string;
}

interface WeatherDaily {
  date: string;
  dayName: string;
  high: number;
  low: number;
  condition: string;
  code: number;
}

interface WeatherData {
  current: WeatherCurrent;
  daily: WeatherDaily[];
}

interface WeatherSlideData {
  title: string;
  backgroundColor: string;
  contentBackgroundColor: string;
  bgImage: string;
  titleColor: string;
  textColor: string;
  logoImage: string;
  weatherData: WeatherData | null;
  dataError: boolean;
  titleTextSize?: number;
  contentTextSize?: number;
}

interface WeatherStore {
  slides: Record<string, WeatherSlideData>;
  setTitle: (slideId: string, title: string) => void;
  setBackgroundColor: (slideId: string, color: string) => void;
  setContentBackgroundColor: (slideId: string, color: string) => void;
  setBgImage: (slideId: string, bgImage: string) => void;
  setTitleColor: (slideId: string, color: string) => void;
  setTextColor: (slideId: string, color: string) => void;
  setLogoImage: (slideId: string, logoImage: string) => void;
  setWeatherData: (slideId: string, data: WeatherData | null) => void;
  setDataError: (slideId: string, error: boolean) => void;
  setTitleTextSize: (slideId: string, size: number) => void;
  setContentTextSize: (slideId: string, size: number) => void;
}

export const useWeatherStore = create<WeatherStore>()(
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

      setContentBackgroundColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), contentBackgroundColor: color },
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

      setWeatherData: (slideId, data) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), weatherData: data },
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
      name: 'weather-store',
    }
  )
);
