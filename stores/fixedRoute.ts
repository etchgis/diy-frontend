import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StateStorage, PersistOptions } from 'zustand/middleware';

// Route info from gtfs-stops API (expanded format)
export interface RouteInfo {
  id: string;
  shortName: string;
  longName?: string;
  color?: string;
  textColor?: string;
  headsigns?: string[];
}

// Direction option for a stop (e.g., "Northbound", "All Directions")
export interface DirectionOption {
  stopId: string;       // The actual stop id to query (e.g., "901N", "901S", "901")
  label: string;         // Display label (e.g., "Northbound", "Platform 1", "All Directions")
  isAllDirections: boolean;
  headsignFilter?: string;  // If set, filter arrivals to only show this headsign (e.g., "Jamaica", "Hempstead")
}

// Service selection state for multi-select UI
export interface ServiceSelection {
  serviceId: string;
  agencyName: string;
  routes?: RouteInfo[];
  enabled: boolean;
  selectedStopId: string;           // The stop id to query for this service
  selectedHeadsignFilters?: string[];  // Filter arrivals by headsigns (multi-select, exact match)
  directionOptions: DirectionOption[];  // Available direction choices for this service
  enabledRouteIds?: string[];       // Which routes are enabled (undefined = all enabled)
}

interface FixedRouteSlideData {
  stopName: string;
  showTitle?: boolean;
  description: string;
  backgroundColor: string;
  titleColor: string;
  tableColor: string;
  tableTextColor: string;
  bgImage: string;
  logoImage: string;
  selectedStop: any;
  serviceSelections?: ServiceSelection[];
  dataError: boolean;
  scheduleData?: any;
  isLoading: boolean;
  titleTextSize?: number;
  contentTextSize?: number;
}

interface SlideStore {
  slides: Record<string, FixedRouteSlideData>;
  setStopName: (slideId: string, name: string) => void;
  setShowTitle: (slideId: string, show: boolean) => void;
  setDescription: (slideId: string, description: string) => void;
  setBackgroundColor: (slideId: string, color: string) => void;
  setTitleColor: (slideId: string, color: string) => void;
  setTableColor: (slideId: string, color: string) => void;
  setTableTextColor: (slideId: string, color: string) => void;
  setBgImage: (slideId: string, bgImage: string) => void;
  setLogoImage: (slideId: string, bgImage: string) => void;
  setSelectedStop: (slideId: string, stop: any) => void;
  setServiceSelections: (slideId: string, selections: ServiceSelection[]) => void;
  setScheduleData: (slideId: string, scheduleData: any) => void;
  setIsLoading: (slideId: string, isLoading: boolean) => void;
  setDataError: (slideId: string, error: boolean) => void;
  setTitleTextSize: (slideId: string, size: number) => void;
  setContentTextSize: (slideId: string, size: number) => void;
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

      setShowTitle: (slideId, show) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...(state.slides[slideId] || {}),
              showTitle: show,
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

        setLogoImage: (slideId, image) =>
          set((state) => ({
            slides: {
              ...state.slides,
              [slideId]: {
                ...(state.slides[slideId] || {}),
                logoImage: image
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

      setServiceSelections: (slideId, selections) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), serviceSelections: selections },
          },
        })),

      setScheduleData: (slideId, scheduleData) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), scheduleData },
          },
        })),

      setIsLoading: (slideId, isLoading) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: { ...(state.slides[slideId] || {}), isLoading },
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
      name: 'fixed-route-storage'
    }
  )
);
