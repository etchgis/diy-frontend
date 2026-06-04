import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { applyThemeColorToAllSlides } from '@/services/applyThemeToSlides';

interface Theme {
  primaryBackground: string;
  secondaryAccent: string;
  titleText: string;
  bodyText: string;
}

export interface SlideSchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface OrgSlideOverride {
  hidden?: boolean;
  duration?: number;
  label?: string;
  schedule?: SlideSchedule;
}

interface Slide {
  id: string;
  type: string;
  hidden?: boolean;
  showFooter?: boolean;
  schedule?: SlideSchedule;
  label?: string;
  duration?: number; 
  data?: any;
}

interface Store {
  template?: string;
  slides: Slide[];
  address?: string;
  url?: string;
  location?: string;
  shortcode?: string;
  currentOrgId?: string;
  customSlideOrder?: string[];
  orgSlideOverrides?: Record<string, OrgSlideOverride>;
  rotationInterval?: number,
  firstPublish?: boolean;
  publishPassword?: string;
  isTempPassword?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  // Default styling for new slides
  defaultBackgroundColor?: string;
  defaultTitleColor?: string;
  defaultTextColor?: string;
  defaultFontFamily?: string;
  defaultTitleTextSize?: number;
  defaultContentTextSize?: number;
  resolution: string;
  setResolution: (resolution: string) => void;
  logoBaseHeight: number;
  setLogoBaseHeight: (height: number) => void;
  // Theme settings
  theme: Theme;
  setThemePrimaryBackground: (color: string) => void;
  setThemeSecondaryAccent: (color: string) => void;
  setThemeTitleText: (color: string) => void;
  setThemeBodyText: (color: string) => void;
  setTemplate: (name: string) => void;
  setSlides: (slides: Slide[]) => void;
  setAddress: (address: string) => void;
  setLocation: (location: string) => void;
  setUrl: (url: string) => void;
  setCoordinates: (coordinates: { lat: number; lng: number }) => void;
  setShortcode: (shortCode: string) => void;
  setCurrentOrgId: (orgId: string | undefined) => void;
  setCustomSlideOrder: (order: string[]) => void;
  setOrgSlideOverride: (id: string, override: Partial<OrgSlideOverride>) => void;
  setOrgSlideOverrides: (overrides: Record<string, OrgSlideOverride>) => void;
  setRotationInterval: (interval: number) => void;
  setFirstPublish: (firstPublish: boolean) => void;
  setPublishPassword: (publishPassword: string) => void;
  setIsTempPassword: (isTempPassword: boolean) => void;
  setDefaultBackgroundColor: (color: string) => void;
  setDefaultTitleColor: (color: string) => void;
  setDefaultTextColor: (color: string) => void;
  setDefaultFontFamily: (font: string) => void;
  setDefaultTitleTextSize: (size: number) => void;
  setDefaultContentTextSize: (size: number) => void;
  toggleSlideHidden: (id: string) => void;
  setShowFooter: (id: string, show: boolean) => void;
  setSchedule: (id: string, schedule: SlideSchedule | null) => void;
  setSlideLabel: (id: string, label: string) => void;
  setSlideDuration: (id: string, duration: number | undefined) => void;
}

export const useGeneralStore = create<Store>()(
  persist(
    (set, get) => ({
      slides: [],
      resolution: '1920x1080',
      logoBaseHeight: 64,
      theme: {
        primaryBackground: '#192F51',
        secondaryAccent: '#78B1DD',
        titleText: '#ffffff',
        bodyText: '#ffffff',
      },

      setSlides: (slides: Slide[]) => set(() => ({
        slides, 
      })),

      setTemplate: (name) => set(() => ({
        template: name,
      })),

      setAddress: (address) => set(() => ({
        address,
      })),

      setLocation: (location) => set(() => ({
        location,
      })),

      setCoordinates: (coordinates) => set(() => ({
        coordinates,
      })),

      setUrl: (url) => set(() => ({
        url,
      })),

      setShortcode: (shortcode) => set(() => ({
        shortcode,
      })),

      setCurrentOrgId: (currentOrgId) => set(() => ({
        currentOrgId,
      })),

      setCustomSlideOrder: (customSlideOrder) => set(() => ({
        customSlideOrder,
      })),

      setOrgSlideOverride: (id, override) =>
        set((state) => ({
          orgSlideOverrides: {
            ...(state.orgSlideOverrides ?? {}),
            [id]: { ...(state.orgSlideOverrides?.[id] ?? {}), ...override },
          },
        })),

      setOrgSlideOverrides: (orgSlideOverrides) => set(() => ({
        orgSlideOverrides,
      })),

      setRotationInterval: (interval) => set(() => ({
        rotationInterval: interval,
      })),
      setFirstPublish: (firstPublish) => set(() => ({
        firstPublish,
      })),
      setPublishPassword: (publishPassword) => set(() => ({
        publishPassword,
      })),
      setIsTempPassword: (isTempPassword) => set(() => ({
        isTempPassword,
      })),
      setDefaultBackgroundColor: (color) => set(() => ({
        defaultBackgroundColor: color,
      })),
      setDefaultTitleColor: (color) => set(() => ({
        defaultTitleColor: color,
      })),
      setDefaultTextColor: (color) => set(() => ({
        defaultTextColor: color,
      })),
      setDefaultFontFamily: (font) => set(() => ({
        defaultFontFamily: font,
      })),
      setDefaultTitleTextSize: (size) => set(() => ({
        defaultTitleTextSize: size,
      })),
      setDefaultContentTextSize: (size) => set(() => ({
        defaultContentTextSize: size,
      })),
      setResolution: (resolution) => set(() => ({
        resolution,
      })),
      setLogoBaseHeight: (height) => set(() => ({
        logoBaseHeight: height,
      })),
      setThemePrimaryBackground: (color) => {
        const oldColor = get().theme.primaryBackground;
        set((state) => ({
          theme: { ...state.theme, primaryBackground: color },
        }));
        applyThemeColorToAllSlides('primaryBackground', color, oldColor);
      },
      setThemeSecondaryAccent: (color) => {
        const oldColor = get().theme.secondaryAccent;
        set((state) => ({
          theme: { ...state.theme, secondaryAccent: color },
        }));
        applyThemeColorToAllSlides('secondaryAccent', color, oldColor);
      },
      setThemeTitleText: (color) => {
        const oldColor = get().theme.titleText;
        set((state) => ({
          theme: { ...state.theme, titleText: color },
        }));
        applyThemeColorToAllSlides('titleText', color, oldColor);
      },
      setThemeBodyText: (color) => {
        const oldColor = get().theme.bodyText;
        set((state) => ({
          theme: { ...state.theme, bodyText: color },
        }));
        applyThemeColorToAllSlides('bodyText', color, oldColor);
      },
      toggleSlideHidden: (id) =>
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id ? { ...s, hidden: !s.hidden } : s
          ),
        })),
      setShowFooter: (id, show) =>
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id ? { ...s, showFooter: show } : s
          ),
        })),
      setSchedule: (id, schedule) =>
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id ? { ...s, schedule: schedule ?? undefined } : s
          ),
        })),
      setSlideLabel: (id, label) =>
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id ? { ...s, label: label || undefined } : s
          ),
        })),
      setSlideDuration: (id, duration) =>
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id ? { ...s, duration } : s
          ),
        })),
    }),
    {
      name: 'general-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const { currentOrgId: _omit, ...rest } = state as any;
        return rest;
      },
    }
  )
);