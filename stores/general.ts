import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { applyThemeColorToAllSlides } from '@/services/applyThemeToSlides';

interface Theme {
  primaryBackground: string;
  secondaryAccent: string;
  titleText: string;
  bodyText: string;
}

interface Slide {
  id: string;
  type: string;
  hidden?: boolean;
  data?: any;
}

interface Store {
  template?: string;
  slides: Slide[];
  address?: string;
  url?: string;
  location?: string;
  shortcode?: string;
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
}

export const useGeneralStore = create<Store>()(
  persist(
    (set, get) => ({
      slides: [],
      resolution: '1920x1080',
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
    }),
    {
      name: 'general-store' ,
      storage: createJSONStorage(() => localStorage)
    }
  )
);