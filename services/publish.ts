import { useFixedRouteStore } from '@/modules/fixed-routes/store';
import { useTransitDestinationsStore } from '@/modules/transit-destinations/store';
import { useGeneralStore } from '@/stores/general';
import { getOrgConfig } from '@/lib/orgConfig';
import { useQRStore } from '@/modules/qr/store';
import { useTransitRouteStore } from '@/modules/transit-routes/store';
import { useTemplate1Store } from '@/modules/template-1/store';
import { useTemplate2Store } from '@/modules/template-2/store';
import { useTemplate3Store } from '@/modules/template-3/store';
import { useRouteTimesStore } from '@/modules/route-times/store';
import { useImageOnlyStore } from '@/modules/image-only/store';
import { useWeatherStore } from '@/modules/weather/store';
import { useCitibikeStore } from '@/modules/citibike/store';
import { useTrafficCorridorStore } from '@/modules/traffic-corridor/store';
import { useWebEmbedStore } from '@/modules/web-embed/store';
import { useFooterStore } from '@/stores/footer';
import { migrateHeadsignFilters } from '@/lib/stop-arrivals-filters';

export class PublishDataMissingError extends Error {
  missingSlides: string[];
  constructor(missingSlides: string[]) {
    super(`Data missing for slides: ${missingSlides.join(', ')}. Open each slide in the editor at least once before publishing.`);
    this.name = 'PublishDataMissingError';
    this.missingSlides = missingSlides;
  }
}

export function buildPublishPayload() {
  const { address, location, coordinates, slides, url, shortcode, rotationInterval, publishPassword, isTempPassword, defaultBackgroundColor, defaultTitleColor, defaultTextColor, defaultFontFamily, defaultTitleTextSize, defaultContentTextSize, theme, resolution, logoBaseHeight } = useGeneralStore.getState();
  const { leftImage, middleImage, rightImage, leftType, middleType, rightType, leftText, middleText, rightText, backgroundColor, timeTextColor, footerBaseHeight } = useFooterStore.getState();

  console.log('[PUBLISH] Footer data being published:', {
    leftImage,
    middleImage,
    rightImage,
    leftType,
    middleType,
    rightType,
    backgroundColor,
    timeTextColor
  });

  const missingSlides: string[] = [];

  const json = {
    location: location,
    address: address,
    coordinates: coordinates,
    shortcode: shortcode,
    rotationInterval: rotationInterval,
    url: url,
    publishPassword: publishPassword,
    isTempPassword: isTempPassword ?? false,
    defaultBackgroundColor: defaultBackgroundColor,
    defaultTitleColor: defaultTitleColor,
    defaultTextColor: defaultTextColor,
    defaultFontFamily: defaultFontFamily,
    defaultTitleTextSize: defaultTitleTextSize,
    defaultContentTextSize: defaultContentTextSize,
    theme: theme,
    resolution: resolution || '1920x1080',
    logoBaseHeight: logoBaseHeight ?? 64,
    footer: {
      leftImage: leftImage,
      middleImage: middleImage,
      rightImage: rightImage,
      leftType: leftType,
      middleType: middleType,
      rightType: rightType,
      leftText: leftText,
      middleText: middleText,
      rightText: rightText,
      backgroundColor: backgroundColor,
      timeTextColor: timeTextColor,
      footerBaseHeight: footerBaseHeight ?? 50,
    },
    screens: [] as any[],
  }

  slides.forEach((slide) => {
    const screenObj: any = { hidden: slide.hidden ?? false, showFooter: slide.showFooter ?? true, schedule: slide.schedule ?? null, label: slide.label ?? null, duration: slide.duration ?? null };
    if (slide.type === 'transit-destinations') {
      screenObj.type = 'transit-destinations';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTransitDestinationsStore.getState();

      const slideData = slides[slide.id];

      if (slideData) {
        const {
          backgroundColor,
          rowColor,
          alternateRowColor,
          tableHeaderTextColor,
          tableTextColor,
          destinations,
          alternateRowTextColor,
          titleTextSize,
          contentTextSize,
          maxWalkDistance,
        } = slideData;

        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.rowColor = rowColor;
        screenObj.data.alternatingRowColor = alternateRowColor;
        screenObj.data.tableHeaderTextColor = tableHeaderTextColor;
        screenObj.data.tableTextColor = tableTextColor;
        screenObj.data.alternateRowTextColor = alternateRowTextColor;
        screenObj.data.destinations = destinations?.map((destination: any) => ({
          name: destination.name,
          coordinates: destination.coordinates,
          allowedModes: destination.allowedModes ?? null,
          preferredItinerary: destination.preferredItinerary ?? null,
          allowedRoutes: destination.allowedRoutes ?? null,
          bannedRoutes: destination.bannedRoutes ?? null,
          maxWalkDistance: destination.maxWalkDistance ?? null,
        })) || [];
        screenObj.data.titleTextSize = titleTextSize;
        screenObj.data.contentTextSize = contentTextSize;
        screenObj.data.maxWalkDistance = maxWalkDistance ?? 800;
        screenObj.data.outageMessage = slideData.outageMessage ?? '';
        screenObj.data.skipOnError = slideData.skipOnError ?? false;

      } else {
        missingSlides.push(`transit-destinations (${slide.id})`);
      }
    }

    if (slide.type === 'fixed-routes') {
      screenObj.type = 'fixed-routes';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useFixedRouteStore.getState();
      const slideData = slides[slide.id];

      if (slideData) {

        const {
          stopName,
          displayName,
          description,
          backgroundColor,
          titleColor,
          tableColor,
          tableTextColor,
          bgImage,
          logoImage,
          selectedStop,
          serviceSelections,
          titleTextSize,
          contentTextSize,
          showTitle,
          columnMode,
          columnLabels,
          showColumnHeaders,
        } = slideData;

        screenObj.data.stopName = stopName ?? '';
        screenObj.data.displayName = displayName ?? '';
        screenObj.data.description = description ?? '';
        screenObj.data.backgroundColor = backgroundColor ?? '#192F51';
        screenObj.data.slideTitleColor = titleColor ?? '#FFFFFF';
        screenObj.data.tableColor = tableColor ?? '#78B1DD';
        screenObj.data.tableTextColor = tableTextColor ?? '#FFFFFF';
        screenObj.data.bgImage = bgImage ?? '';
        screenObj.data.logoImage = logoImage ?? '';
        screenObj.data.showTitle = showTitle !== false;
        screenObj.data.columnMode = columnMode ?? false;
        screenObj.data.columnLabels = columnLabels ?? ['Left', 'Right'];
        screenObj.data.showColumnHeaders = showColumnHeaders ?? false;
        screenObj.data.columnHeaderBgColor = slideData.columnHeaderBgColor ?? '#ffffff';
        screenObj.data.columnHeaderTextColor = slideData.columnHeaderTextColor ?? '#78B1DD';
        screenObj.data.columnHeaderTextSize = slideData.columnHeaderTextSize ?? 5;
        screenObj.data.minArrivalMinutes = slideData.minArrivalMinutes ?? 0;
        screenObj.data.titleTextSize = titleTextSize ?? 5;
        screenObj.data.contentTextSize = contentTextSize ?? 5;
        screenObj.data.outageMessage = slideData.outageMessage ?? '';
        screenObj.data.skipOnError = slideData.skipOnError ?? false;

        if (selectedStop) {
          screenObj.data.selectedStop = {
            id: selectedStop.id,
            name: selectedStop.name,
            lat: selectedStop.lat,
            lon: selectedStop.lon,
            services: (selectedStop.services || []).map((svc: any) => ({
              id: svc.id,
              organizationId: svc.organizationId,
              agencyName: svc.agencyName,
              routes: (svc.routes || []).map((r: any) => ({
                id: r.id,
                shortName: r.shortName,
                longName: r.longName,
                color: r.color,
                textColor: r.textColor,
                headsigns: r.headsigns || [],
              })),
            })),
          };
        }

        if (serviceSelections) {
          screenObj.data.serviceSelections = serviceSelections.map((s: any) => ({
            serviceId: s.serviceId,
            organizationId: s.organizationId,
            agencyName: s.agencyName,
            enabled: s.enabled,
            selectedStopId: s.selectedStopId,
            enabledRouteIds: s.enabledRouteIds,
            selectedHeadsignFilters: s.selectedHeadsignFilters,
            headsignAliases: s.headsignAliases,
            routes: (s.routes || []).map((r: any) => ({
              id: r.id,
              shortName: r.shortName,
              longName: r.longName,
              color: r.color,
              textColor: r.textColor,
              headsigns: r.headsigns || [],
            })),
          }));
        }

        const { columnServiceSelections } = slideData;
        if (columnServiceSelections) {
          const stripSel = (s: any) => ({
            serviceId: s.serviceId,
            organizationId: s.organizationId,
            enabled: s.enabled,
            selectedStopId: s.selectedStopId,
            enabledRouteIds: s.enabledRouteIds,
            selectedHeadsignFilters: s.selectedHeadsignFilters,
            headsignAliases: s.headsignAliases,
          });
          screenObj.data.columnServiceSelections = [
            columnServiceSelections[0].map(stripSel),
            columnServiceSelections[1].map(stripSel),
          ];
        }
      } else {
        missingSlides.push(`fixed-routes (${slide.id})`);
      }
    }

    if (slide.type === 'transit-routes') {
      screenObj.type = 'transit-routes';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTransitRouteStore.getState();
      const slideData = slides[slide.id];

      if (slideData) {

        const { destination, location, routes } = slideData;

        screenObj.data.destination = destination;
        screenObj.data.location = location;
        screenObj.data.routes = routes;
      } else {
        missingSlides.push(`transit-routes (${slide.id})`);
      }
    }

    if (slide.type === 'qr') {
      screenObj.type = 'qr';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useQRStore.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        const {
          text,
          url,
          backgroundColor,
          bgImage,
          logoImage,
          qrSize,
          textSize
        } = slideData;

        screenObj.data.text = text;
        screenObj.data.url = url;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.bgImage = bgImage;
        screenObj.data.logoImage = logoImage;
        screenObj.data.qrSize = qrSize;
        screenObj.data.textSize = textSize;
      } else {
        missingSlides.push(`qr (${slide.id})`);
      }

    }

    if (slide.type === 'template-1') {

      screenObj.type = 'template-1';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTemplate1Store.getState();
      const slideData = slides[slide.id];

      if (slideData) {

        const { text, title, image, bgImage, backgroundColor, leftContentSize, rightContentSize, textColor, titleColor, logoImage, imageWidth, imageHeight, imageObjectFit, titleTextSize, contentTextSize } = slideData;

        screenObj.data.text = text;
        screenObj.data.title = title;
        screenObj.data.image = image;
        screenObj.data.bgImage = bgImage;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.leftContentSize = leftContentSize;
        screenObj.data.rightContentSize = rightContentSize;
        screenObj.data.textColor = textColor;
        screenObj.data.titleColor = titleColor;
        screenObj.data.logoImage = logoImage;
        screenObj.data.imageWidth = imageWidth;
        screenObj.data.imageHeight = imageHeight;
        screenObj.data.imageObjectFit = imageObjectFit;
        screenObj.data.titleTextSize = titleTextSize;
        screenObj.data.contentTextSize = contentTextSize;

      } else {
        missingSlides.push(`template-1 (${slide.id})`);
      }
    }

    if (slide.type === 'template-2') {

      screenObj.type = 'template-2';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTemplate2Store.getState();
      const slideData = slides[slide.id];

      if (slideData) {

        const { text, title, image, backgroundColor, leftContentSize, rightContentSize, bgImage, textColor, titleColor, logoImage, imageWidth, imageHeight, imageObjectFit, titleTextSize, contentTextSize } = slideData;

        screenObj.data.text = text;
        screenObj.data.title = title;
        screenObj.data.image = image;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.leftContentSize = leftContentSize;
        screenObj.data.rightContentSize = rightContentSize;
        screenObj.data.bgImage = bgImage;
        screenObj.data.textColor = textColor;
        screenObj.data.titleColor = titleColor;
        screenObj.data.logoImage = logoImage;
        screenObj.data.imageWidth = imageWidth;
        screenObj.data.imageHeight = imageHeight;
        screenObj.data.imageObjectFit = imageObjectFit;
        screenObj.data.titleTextSize = titleTextSize;
        screenObj.data.contentTextSize = contentTextSize;
      } else {
        missingSlides.push(`template-2 (${slide.id})`);
      }
    }

    if (slide.type === 'template-3') {
      screenObj.type = 'template-3';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTemplate3Store.getState();
      const slideData = slides[slide.id];

      if (slideData) {

        const { title, image, backgroundColor, bgImage, textColor, titleColor, logoImage, imageWidth, imageHeight, imageObjectFit, titleTextSize } = slideData;

        screenObj.data.title = title;
        screenObj.data.image = image;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.bgImage = bgImage;
        screenObj.data.textColor = textColor;
        screenObj.data.titleColor = titleColor;
        screenObj.data.logoImage = logoImage;
        screenObj.data.imageWidth = imageWidth;
        screenObj.data.imageHeight = imageHeight;
        screenObj.data.imageObjectFit = imageObjectFit;
        screenObj.data.titleTextSize = titleTextSize;
      } else {
        missingSlides.push(`template-3 (${slide.id})`);
      }
    }

    if (slide.type === 'image-only') {
      screenObj.type = 'image-only';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useImageOnlyStore.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        const { image, imageObjectFit, backgroundColor, fullScreen, imageWidth, imageHeight } = slideData;

        screenObj.data.image = image;
        screenObj.data.imageObjectFit = imageObjectFit;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.fullScreen = fullScreen;
        screenObj.data.imageWidth = imageWidth;
        screenObj.data.imageHeight = imageHeight;
      } else {
        missingSlides.push(`image-only (${slide.id})`);
      }
    }

    if (slide.type === 'weather') {
      screenObj.type = 'weather';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useWeatherStore.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        const { title, backgroundColor, contentBackgroundColor, bgImage, titleColor, textColor, logoImage, titleTextSize, contentTextSize } = slideData;

        screenObj.data.title = title;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.contentBackgroundColor = contentBackgroundColor;
        screenObj.data.bgImage = bgImage;
        screenObj.data.titleColor = titleColor;
        screenObj.data.textColor = textColor;
        screenObj.data.logoImage = logoImage;
        screenObj.data.titleTextSize = titleTextSize;
        screenObj.data.contentTextSize = contentTextSize;
      } else {
        missingSlides.push(`weather (${slide.id})`);
      }
    }

    if (slide.type === 'citibike') {
      screenObj.type = 'citibike';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useCitibikeStore.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        const { title, backgroundColor, bgImage, titleColor, textColor, logoImage, searchRadius, titleTextSize, contentTextSize } = slideData;

        screenObj.data.title = title;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.bgImage = bgImage;
        screenObj.data.titleColor = titleColor;
        screenObj.data.textColor = textColor;
        screenObj.data.logoImage = logoImage;
        screenObj.data.searchRadius = searchRadius;
        screenObj.data.titleTextSize = titleTextSize;
        screenObj.data.contentTextSize = contentTextSize;
      } else {
        missingSlides.push(`citibike (${slide.id})`);
      }
    }

    if (slide.type === 'traffic-corridor') {
      screenObj.type = 'traffic-corridor';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTrafficCorridorStore.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        const { title, showTitle, backgroundColor, bgImage, logoImage, titleColor, textColor, tableHeaderColor, rowColor, alternateRowColor, tables, showSecondTable, tableLayout, origin, titleTextSize, contentTextSize } = slideData;

        screenObj.data.title = title;
        screenObj.data.showTitle = showTitle;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.bgImage = bgImage;
        screenObj.data.logoImage = logoImage;
        screenObj.data.titleColor = titleColor;
        screenObj.data.textColor = textColor;
        screenObj.data.tableHeaderColor = tableHeaderColor;
        screenObj.data.rowColor = rowColor;
        screenObj.data.alternateRowColor = alternateRowColor;
        screenObj.data.tables = tables;
        screenObj.data.showSecondTable = showSecondTable;
        screenObj.data.tableLayout = tableLayout;
        screenObj.data.origin = origin;
        screenObj.data.titleTextSize = titleTextSize;
        screenObj.data.contentTextSize = contentTextSize;
      } else {
        missingSlides.push(`traffic-corridor (${slide.id})`);
      }
    }

    if (slide.type === 'route-times') {
      screenObj.type = 'route-times';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useRouteTimesStore.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        const {
          routeName,
          selectedRoute,
          description,
          viewMode,
          backgroundColor,
          titleColor,
          tableColor,
          tableTextColor,
          bgImage,
          logoImage,
          titleTextSize,
          contentTextSize
        } = slideData;

        screenObj.data.routeName = routeName;
        screenObj.data.selectedRoute = selectedRoute;
        screenObj.data.description = description;
        screenObj.data.viewMode = viewMode;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.slideTitleColor = titleColor;
        screenObj.data.tableColor = tableColor;
        screenObj.data.tableTextColor = tableTextColor;
        screenObj.data.bgImage = bgImage;
        screenObj.data.logoImage = logoImage;
        screenObj.data.titleTextSize = titleTextSize;
        screenObj.data.contentTextSize = contentTextSize;
        screenObj.data.outageMessage = slideData.outageMessage ?? '';
        screenObj.data.skipOnError = slideData.skipOnError ?? false;
      } else {
        missingSlides.push(`route-times (${slide.id})`);
      }
    }

    if (slide.type === 'web-embed') {
      screenObj.type = 'web-embed';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useWebEmbedStore.getState();
      const slideData = slides[slide.id];

      screenObj.data.url = slideData?.url ?? '';
      screenObj.data.zoom = slideData?.zoom ?? 1.0;
      screenObj.data.scrollX = slideData?.scrollX ?? 0;
      screenObj.data.scrollY = slideData?.scrollY ?? 0;
      screenObj.data.refreshInterval = slideData?.refreshInterval ?? 0;
    }

    json.screens.push(screenObj);
  });

  if (missingSlides.length > 0) {
    throw new PublishDataMissingError(missingSlides);
  }

  // Reorder screens to match the user's custom slide order (including org slide positions)
  const { customSlideOrder, currentOrgId, orgSlideOverrides } = useGeneralStore.getState();
  if (customSlideOrder && customSlideOrder.length > 0) {
    const orgConfig = currentOrgId ? getOrgConfig(currentOrgId) : null;
    const orgCustomSlides = (orgConfig?.customSlides ?? []).filter((s) => {
      if (s.hidden) return false;
      if (orgSlideOverrides?.[s.id]?.hidden) return false;
      return true;
    });
    const orgSlideIdSet = new Set(orgCustomSlides.map((s) => s.id));

    const diyScreenMap = new Map(json.screens.map((s: any) => [s.id, s]));
    const orderedScreens: any[] = [];
    const handledIds = new Set<string>();

    for (const id of customSlideOrder) {
      if (handledIds.has(id)) continue;
      if (orgSlideIdSet.has(id)) {
        const orgSlide = orgCustomSlides.find((s) => s.id === id);
        if (orgSlide) {
          const override = orgSlideOverrides?.[id];
          orderedScreens.push({
            id: orgSlide.id,
            type: orgSlide.type,
            ...(override?.duration != null ? { duration: override.duration } : {}),
            ...(override?.schedule ? { schedule: override.schedule } : {}),
          });
          handledIds.add(id);
        }
      } else if (diyScreenMap.has(id)) {
        orderedScreens.push(diyScreenMap.get(id));
        handledIds.add(id);
      }
    }

    // Append any DIY screens not yet in customSlideOrder (added since last drag)
    for (const screen of json.screens) {
      if (!handledIds.has(screen.id)) orderedScreens.push(screen);
    }

    json.screens = orderedScreens;
  }

  if (orgSlideOverrides && Object.keys(orgSlideOverrides).length > 0) {
    (json as any).orgSlideOverrides = orgSlideOverrides;
  }

  return json;
}

export async function sendPublishPayload(json: any) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) throw new Error('Missing backend URL');

  const response = await fetch(`${backendUrl}/upload/${json.shortcode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json),
  });

  if (!response.ok) throw new Error(`Failed to publish: ${response.statusText}`);
  return response.json();
}

export async function publish() {
  const json = buildPublishPayload();
  return sendPublishPayload(json);
}