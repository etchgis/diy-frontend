import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TrafficCongestionSlideData {
  title: string;
  showTitle: boolean;
  backgroundColor: string;
  bgImage: string;
  logoImage: string;
  titleColor: string;
  textColor: string;
  mapCenter?: [number, number];
  mapZoom?: number;
  mapImageUrl?: string;
  titleTextSize: number;
  contentTextSize: number;
}

interface TrafficCongestionStore {
  slides: Record<string, TrafficCongestionSlideData>;
  setTitle: (slideId: string, title: string) => void;
  setShowTitle: (slideId: string, show: boolean) => void;
  setBackgroundColor: (slideId: string, color: string) => void;
  setBgImage: (slideId: string, url: string) => void;
  setLogoImage: (slideId: string, url: string) => void;
  setTitleColor: (slideId: string, color: string) => void;
  setTextColor: (slideId: string, color: string) => void;
  setMapCenter: (slideId: string, center: [number, number] | undefined) => void;
  setMapZoom: (slideId: string, zoom: number) => void;
  setMapImageUrl: (slideId: string, url: string) => void;
  setTitleTextSize: (slideId: string, size: number) => void;
  setContentTextSize: (slideId: string, size: number) => void;
}

const setter =
  <K extends keyof TrafficCongestionSlideData>(key: K) =>
  (slideId: string, value: TrafficCongestionSlideData[K]) =>
  (state: { slides: Record<string, TrafficCongestionSlideData> }) => ({
    slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), [key]: value } },
  });

export const useTrafficCongestionStore = create<TrafficCongestionStore>()(
  persist(
    (set) => ({
      slides: {},
      setTitle: (id, v) => set(setter('title')(id, v)),
      setShowTitle: (id, v) => set(setter('showTitle')(id, v)),
      setBackgroundColor: (id, v) => set(setter('backgroundColor')(id, v)),
      setBgImage: (id, v) => set(setter('bgImage')(id, v)),
      setLogoImage: (id, v) => set(setter('logoImage')(id, v)),
      setTitleColor: (id, v) => set(setter('titleColor')(id, v)),
      setTextColor: (id, v) => set(setter('textColor')(id, v)),
      setMapCenter: (id, v) => set(setter('mapCenter')(id, v)),
      setMapZoom: (id, v) => set(setter('mapZoom')(id, v)),
      setMapImageUrl: (id, v) => set(setter('mapImageUrl')(id, v)),
      setTitleTextSize: (id, v) => set(setter('titleTextSize')(id, v)),
      setContentTextSize: (id, v) => set(setter('contentTextSize')(id, v)),
    }),
    { name: 'traffic-congestion-store' }
  )
);
