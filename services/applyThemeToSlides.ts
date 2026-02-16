import { useWeatherStore } from '@/stores/weather';
import { useTemplate1Store } from '@/stores/template1';
import { useTemplate2Store } from '@/stores/template2';
import { useTemplate3Store } from '@/stores/template3';
import { useCitibikeStore } from '@/stores/citibike';
import { useTransitDestinationsStore } from '@/stores/transitDestinations';
import { useFixedRouteStore } from '@/stores/fixedRoute';
import { useRouteTimesStore } from '@/stores/routeTimes';
import { useQRStore } from '@/stores/qr';
import { useImageOnlyStore } from '@/stores/imageOnly';
import { useTransitRouteStore } from '@/stores/transitRoutes';

type ThemeColorType = 'primaryBackground' | 'secondaryAccent' | 'titleText' | 'bodyText';
type FontSizeType = 'titleTextSize' | 'contentTextSize';

interface StoreMapping {
  store: any;
  colorMappings: Record<ThemeColorType, string[]>;
  fontSizeMappings?: Record<FontSizeType, string[]>;
}

const storeConfigs: StoreMapping[] = [
  {
    store: useWeatherStore,
    colorMappings: {
      primaryBackground: ['backgroundColor'],
      secondaryAccent: ['contentBackgroundColor'],
      titleText: ['titleColor'],
      bodyText: ['textColor'],
    },
    fontSizeMappings: {
      titleTextSize: ['titleTextSize'],
      contentTextSize: ['contentTextSize'],
    },
  },
  {
    store: useTemplate1Store,
    colorMappings: {
      primaryBackground: ['backgroundColor'],
      secondaryAccent: [],
      titleText: ['titleColor'],
      bodyText: ['textColor'],
    },
    fontSizeMappings: {
      titleTextSize: ['titleTextSize'],
      contentTextSize: ['contentTextSize'],
    },
  },
  {
    store: useTemplate2Store,
    colorMappings: {
      primaryBackground: ['backgroundColor'],
      secondaryAccent: [],
      titleText: ['titleColor'],
      bodyText: ['textColor'],
    },
    fontSizeMappings: {
      titleTextSize: ['titleTextSize'],
      contentTextSize: ['contentTextSize'],
    },
  },
  {
    store: useTemplate3Store,
    colorMappings: {
      primaryBackground: ['backgroundColor'],
      secondaryAccent: [],
      titleText: ['titleColor'],
      bodyText: ['textColor'],
    },
    fontSizeMappings: {
      titleTextSize: ['titleTextSize'],
      contentTextSize: [],
    },
  },
  {
    store: useCitibikeStore,
    colorMappings: {
      primaryBackground: ['backgroundColor'],
      secondaryAccent: [],
      titleText: ['titleColor'],
      bodyText: ['textColor'],
    },
    fontSizeMappings: {
      titleTextSize: ['titleTextSize'],
      contentTextSize: ['contentTextSize'],
    },
  },
  {
    store: useTransitDestinationsStore,
    colorMappings: {
      primaryBackground: ['backgroundColor','alternateRowColor' ],
      secondaryAccent: ['rowColor'],
      titleText: ['tableHeaderTextColor'],
      bodyText: ['tableTextColor', 'alternateRowTextColor'],
    },
    fontSizeMappings: {
      titleTextSize: ['titleTextSize'],
      contentTextSize: ['contentTextSize'],
    },
  },
  {
    store: useFixedRouteStore,
    colorMappings: {
      primaryBackground: ['backgroundColor'],
      secondaryAccent: ['tableColor'],
      titleText: ['titleColor'],
      bodyText: ['tableTextColor'],
    },
    fontSizeMappings: {
      titleTextSize: ['titleTextSize'],
      contentTextSize: ['contentTextSize'],
    },
  },
  {
    store: useRouteTimesStore,
    colorMappings: {
      primaryBackground: ['backgroundColor'],
      secondaryAccent: ['tableColor'],
      titleText: ['titleColor'],
      bodyText: ['tableTextColor'],
    },
    fontSizeMappings: {
      titleTextSize: ['titleTextSize'],
      contentTextSize: ['contentTextSize'],
    },
  },
  {
    store: useQRStore,
    colorMappings: {
      primaryBackground: ['backgroundColor'],
      secondaryAccent: [],
      titleText: [],
      bodyText: ['textColor'],
    },
    fontSizeMappings: {
      titleTextSize: [],
      contentTextSize: ['textSize'],
    },
  },
  {
    store: useImageOnlyStore,
    colorMappings: {
      primaryBackground: ['backgroundColor'],
      secondaryAccent: [],
      titleText: [],
      bodyText: [],
    },
    fontSizeMappings: {
      titleTextSize: [],
      contentTextSize: [],
    },
  },
  {
    store: useTransitRouteStore,
    colorMappings: {
      primaryBackground: [],
      secondaryAccent: [],
      titleText: [],
      bodyText: [],
    },
    fontSizeMappings: {
      titleTextSize: [],
      contentTextSize: [],
    },
  },
];

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function applyThemeColorToAllSlides(colorType: ThemeColorType, color: string): void {
  for (const config of storeConfigs) {
    const state = config.store.getState();
    const propsToUpdate = config.colorMappings[colorType] || [];

    if (propsToUpdate.length === 0) continue;
    if (!state.slides) continue;

    for (const slideId of Object.keys(state.slides)) {
      for (const prop of propsToUpdate) {
        const setterName = `set${capitalizeFirst(prop)}`;
        if (typeof state[setterName] === 'function') {
          state[setterName](slideId, color);
        }
      }
    }
  }
}

export function applyFullThemeToAllSlides(theme: {
  primaryBackground: string;
  secondaryAccent: string;
  titleText: string;
  bodyText: string;
}): void {
  applyThemeColorToAllSlides('primaryBackground', theme.primaryBackground);
  applyThemeColorToAllSlides('secondaryAccent', theme.secondaryAccent);
  applyThemeColorToAllSlides('titleText', theme.titleText);
  applyThemeColorToAllSlides('bodyText', theme.bodyText);
}

export function applyFontSizeToAllSlides(sizeType: FontSizeType, size: number): void {
  for (const config of storeConfigs) {
    const state = config.store.getState();
    const propsToUpdate = config.fontSizeMappings?.[sizeType] || [];

    if (propsToUpdate.length === 0) continue;
    if (!state.slides) continue;

    for (const slideId of Object.keys(state.slides)) {
      for (const prop of propsToUpdate) {
        const setterName = `set${capitalizeFirst(prop)}`;
        if (typeof state[setterName] === 'function') {
          state[setterName](slideId, size);
        }
      }
    }
  }
}
