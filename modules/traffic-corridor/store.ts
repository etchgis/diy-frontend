import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Corridor {
  name: string;
  time: string;
  apiLabel?: string; 
}

export interface TransitAlternative {
  route: string | null;
  travel: string | null;
  legs?: any[];
}

export interface DestinationTable {
  destination: string;
  corridors: Corridor[];
  coordinates?: [number, number];
  showTransitAlternative?: boolean;
  transitAlternative?: TransitAlternative | null;
}

export type TableLayout = 'single' | 'dual' | 'triple' | 'quad';

interface TrafficCorridorSlideData {
  title: string;
  showTitle: boolean;
  backgroundColor: string;
  bgImage: string;
  logoImage: string;
  titleColor: string;
  textColor: string;
  tableHeaderColor: string;
  rowColor: string;
  tables: DestinationTable[];
  showSecondTable: boolean;
  tableLayout?: TableLayout;
  origin?: [number, number];
  titleTextSize: number;
  contentTextSize: number;
}

interface TrafficCorridorStore {
  slides: Record<string, TrafficCorridorSlideData>;
  setTitle: (slideId: string, title: string) => void;
  setShowTitle: (slideId: string, show: boolean) => void;
  setBackgroundColor: (slideId: string, color: string) => void;
  setBgImage: (slideId: string, bgImage: string) => void;
  setLogoImage: (slideId: string, logoImage: string) => void;
  setTitleColor: (slideId: string, color: string) => void;
  setTextColor: (slideId: string, color: string) => void;
  setTableHeaderColor: (slideId: string, color: string) => void;
  setRowColor: (slideId: string, color: string) => void;
  setTables: (slideId: string, tables: DestinationTable[]) => void;
  setShowSecondTable: (slideId: string, show: boolean) => void;
  setTableLayout: (slideId: string, layout: TableLayout) => void;
  setOrigin: (slideId: string, origin: [number, number] | undefined) => void;
  setTitleTextSize: (slideId: string, size: number) => void;
  setContentTextSize: (slideId: string, size: number) => void;
}

export const useTrafficCorridorStore = create<TrafficCorridorStore>()(
  persist(
    (set) => ({
      slides: {},

      setTitle: (slideId, title) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), title } },
        })),

      setShowTitle: (slideId, show) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), showTitle: show } },
        })),

      setBackgroundColor: (slideId, color) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), backgroundColor: color } },
        })),

      setBgImage: (slideId, bgImage) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), bgImage } },
        })),

      setLogoImage: (slideId, logoImage) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), logoImage } },
        })),

      setTitleColor: (slideId, color) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), titleColor: color } },
        })),

      setTextColor: (slideId, color) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), textColor: color } },
        })),

      setTableHeaderColor: (slideId, color) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), tableHeaderColor: color } },
        })),

      setRowColor: (slideId, color) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), rowColor: color } },
        })),

      setTables: (slideId, tables) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), tables } },
        })),

      setShowSecondTable: (slideId, show) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), showSecondTable: show } },
        })),

      setTableLayout: (slideId, layout) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), tableLayout: layout } },
        })),

      setOrigin: (slideId, origin) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), origin } },
        })),

      setTitleTextSize: (slideId, size) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), titleTextSize: size } },
        })),

      setContentTextSize: (slideId, size) =>
        set((state) => ({
          slides: { ...state.slides, [slideId]: { ...(state.slides[slideId] || {}), contentTextSize: size } },
        })),
    }),
    { name: 'traffic-corridor-store' }
  )
);
