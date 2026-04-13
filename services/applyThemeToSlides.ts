import { useWeatherStore } from '@/modules/weather/store';
import { useTemplate1Store } from '@/modules/template-1/store';
import { useTemplate2Store } from '@/modules/template-2/store';
import { useTemplate3Store } from '@/modules/template-3/store';
import { useCitibikeStore } from '@/modules/citibike/store';
import { useTrafficCorridorStore } from '@/modules/traffic-corridor/store';
import { useTransitDestinationsStore } from '@/modules/transit-destinations/store';
import { useFixedRouteStore } from '@/modules/fixed-routes/store';
import { useRouteTimesStore } from '@/modules/route-times/store';
import { useQRStore } from '@/modules/qr/store';
import { useImageOnlyStore } from '@/modules/image-only/store';
import { useTransitRouteStore } from '@/modules/transit-routes/store';

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
    store: useTrafficCorridorStore,
    colorMappings: {
      primaryBackground: ['backgroundColor', 'rowColor'],
      secondaryAccent: ['tableHeaderColor'],
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

export function applyThemeColorToAllSlides(colorType: ThemeColorType, color: string, oldColor?: string): void {
  for (const config of storeConfigs) {
    const state = config.store.getState();
    const propsToUpdate = config.colorMappings[colorType] || [];

    if (propsToUpdate.length === 0) continue;
    if (!state.slides) continue;

    for (const slideId of Object.keys(state.slides)) {
      const slideData = state.slides[slideId];
      for (const prop of propsToUpdate) {
        // Only update slides that are still using the previous theme color.
        // Slides with undefined (uninitialized prop) always get the new value.
        // Slides manually changed to a different color are left alone.
        if (oldColor !== undefined && slideData[prop] !== undefined && slideData[prop] !== oldColor) {
          continue;
        }
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
