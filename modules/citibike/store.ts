import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VehicleType = 'bike' | 'scooter' | 'car' | 'other';

export interface GbfsProvider {
  id: string;
  name: string;
  vehicleType: VehicleType;
}

export const KNOWN_PROVIDERS: GbfsProvider[] = [
  { id: 'citibike-nyc',   name: 'Citi Bike NYC',        vehicleType: 'bike'    },
  { id: 'citibike-jc',    name: 'Citi Bike Jersey City', vehicleType: 'bike'    },
  { id: 'bird-new-york',  name: 'Bird New York',         vehicleType: 'scooter' },
  { id: 'lime-new-york',  name: 'Lime New York',         vehicleType: 'scooter' },
  { id: 'veo-bronx',      name: 'Veo Bronx',             vehicleType: 'scooter' },
  { id: 'veo-queens',     name: 'Veo Queens',            vehicleType: 'scooter' },
];

export interface RentalStation {
  stationId: string;
  name: string;
  lat: number;
  lon: number;
  bikesAvailable: number;
  ebikesAvailable: number;
  docksAvailable: number;
  distance: number;
  vehiclesAvailable?: number;
  currentRangeMeters?: number;
}

/** @deprecated use RentalStation */
export type CitibikeStation = RentalStation;

interface CitibikeSlideData {
  title: string;
  showTitle?: boolean;
  backgroundColor: string;
  bgImage: string;
  titleColor: string;
  textColor: string;
  logoImage: string;
  searchRadius: number;
  stationData: RentalStation[];
  dataError: boolean;
  dataLoaded: boolean;
  titleTextSize?: number;
  contentTextSize?: number;
  selectedProvider: GbfsProvider;
  vehicleMarkerColor: string;
}

interface CitibikeStore {
  slides: Record<string, CitibikeSlideData>;
  setTitle: (slideId: string, title: string) => void;
  setShowTitle: (slideId: string, show: boolean) => void;
  setBackgroundColor: (slideId: string, color: string) => void;
  setBgImage: (slideId: string, bgImage: string) => void;
  setTitleColor: (slideId: string, color: string) => void;
  setTextColor: (slideId: string, color: string) => void;
  setLogoImage: (slideId: string, logoImage: string) => void;
  setSearchRadius: (slideId: string, radius: number) => void;
  setStationData: (slideId: string, data: RentalStation[]) => void;
  setDataError: (slideId: string, error: boolean) => void;
  setDataLoaded: (slideId: string, loaded: boolean) => void;
  setTitleTextSize: (slideId: string, size: number) => void;
  setContentTextSize: (slideId: string, size: number) => void;
  setSelectedProvider: (slideId: string, provider: GbfsProvider) => void;
  setVehicleMarkerColor: (slideId: string, color: string) => void;
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

      setShowTitle: (slideId, show) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), showTitle: show },
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

      setSelectedProvider: (slideId, provider) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), selectedProvider: provider, stationData: [], dataLoaded: false },
          },
        })),

      setDataLoaded: (slideId, loaded) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), dataLoaded: loaded },
          },
        })),

      setVehicleMarkerColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), vehicleMarkerColor: color },
          },
        })),
    }),
    {
      name: 'citibike-store',
    }
  )
);
