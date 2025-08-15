import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_color: string;
  route_text_color: string;
  agency_name?: string;
  services: Array<{
    organization_guid: string;
    service_guid: string;
    agency_name: string;
  }>;
}

interface RouteScheduleData {
  trip_id: string;
  stops: {
    stop_id: string;
    stop_name: string;
    arrival_time: string | null;
    departure_time: string | null;
    stop_sequence: number;
    stop_lat?: number;
    stop_lon?: number;
  }[];
}

interface RouteTimesSlide {
  routeName: string;
  selectedRoute: Route | undefined;
  description: string;
  viewMode: 'map' | 'timetable';
  backgroundColor: string;
  titleColor: string;
  tableColor: string;
  tableTextColor: string;
  bgImage: string;
  routeData: RouteScheduleData[];
  patternData?: any;
  isLoading: boolean;
}

interface RouteTimesStore {
  slides: {
    [slideId: string]: RouteTimesSlide;
  };
  setRouteName: (slideId: string, name: string) => void;
  setSelectedRoute: (slideId: string, route: Route) => void;
  setDescription: (slideId: string, description: string) => void;
  setViewMode: (slideId: string, mode: 'map' | 'timetable') => void;
  setBackgroundColor: (slideId: string, color: string) => void;
  setTitleColor: (slideId: string, color: string) => void;
  setTableColor: (slideId: string, color: string) => void;
  setTableTextColor: (slideId: string, color: string) => void;
  setBgImage: (slideId: string, image: string) => void;
  setRouteData: (slideId: string, data: RouteScheduleData[]) => void;
  setPatternData: (slideId: string, data: any) => void;
  setIsLoading: (slideId: string, loading: boolean) => void;
  clearSlide: (slideId: string) => void;
}

const getDefaultSlide = (): RouteTimesSlide => ({
  routeName: '',
  selectedRoute: undefined,
  description: '',
  viewMode: 'map',
  backgroundColor: '#192F51',
  titleColor: '#FFFFFF',
  tableColor: '#FFFFFF',
  tableTextColor: '#000000',
  bgImage: '',
  routeData: [],
  patternData: undefined,
  isLoading: false,
});

export const useRouteTimesStore = create<RouteTimesStore>()(
  persist(
    (set) => ({
      slides: {},

      setRouteName: (slideId, name) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...getDefaultSlide(),
              ...state.slides[slideId],
              routeName: name,
            },
          },
        })),

      setSelectedRoute: (slideId, route) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...getDefaultSlide(),
              ...state.slides[slideId],
              selectedRoute: route,
              // Auto-select view mode based on stop count when route is selected
              viewMode: state.slides[slideId]?.viewMode || 'map',
            },
          },
        })),

      setDescription: (slideId, description) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...getDefaultSlide(),
              ...state.slides[slideId],
              description,
            },
          },
        })),

      setViewMode: (slideId, mode) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...getDefaultSlide(),
              ...state.slides[slideId],
              viewMode: mode,
            },
          },
        })),

      setBackgroundColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...getDefaultSlide(),
              ...state.slides[slideId],
              backgroundColor: color,
            },
          },
        })),

      setTitleColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...getDefaultSlide(),
              ...state.slides[slideId],
              titleColor: color,
            },
          },
        })),

      setTableColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...getDefaultSlide(),
              ...state.slides[slideId],
              tableColor: color,
            },
          },
        })),

      setTableTextColor: (slideId, color) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...getDefaultSlide(),
              ...state.slides[slideId],
              tableTextColor: color,
            },
          },
        })),

      setBgImage: (slideId, image) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...getDefaultSlide(),
              ...state.slides[slideId],
              bgImage: image,
            },
          },
        })),

      setRouteData: (slideId, data) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...getDefaultSlide(),
              ...state.slides[slideId],
              routeData: data,
            },
          },
        })),

      setPatternData: (slideId, data) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...getDefaultSlide(),
              ...state.slides[slideId],
              patternData: data,
            },
          },
        })),

      setIsLoading: (slideId, loading) =>
        set((state) => ({
          slides: {
            ...state.slides,
            [slideId]: {
              ...getDefaultSlide(),
              ...state.slides[slideId],
              isLoading: loading,
            },
          },
        })),

      clearSlide: (slideId) =>
        set((state) => {
          const { [slideId]: _, ...remainingSlides } = state.slides;
          return { slides: remainingSlides };
        }),
    }),
    {
      name: 'route-times-store',
    }
  )
);
