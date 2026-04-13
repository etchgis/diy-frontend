import { useFixedRouteStore } from '@/modules/fixed-routes/store';
import { useTransitDestinationsStore } from '@/modules/transit-destinations/store';
import { useGeneralStore } from '@/stores/general';
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
import { useFooterStore } from '@/stores/footer';

export async function publish() {
  const { address, location, coordinates, slides, url, shortcode, rotationInterval, publishPassword, defaultBackgroundColor, defaultTitleColor, defaultTextColor, defaultFontFamily, defaultTitleTextSize, defaultContentTextSize, theme } = useGeneralStore.getState();
  const { leftImage, middleImage, rightImage, leftType, middleType, rightType, backgroundColor, timeTextColor } = useFooterStore.getState();

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

  const json = {
    location: location,
    address: address,
    coordinates: coordinates,
    shortcode: shortcode,
    rotationInterval: rotationInterval,
    url: url,
    publishPassword: publishPassword,
    defaultBackgroundColor: defaultBackgroundColor,
    defaultTitleColor: defaultTitleColor,
    defaultTextColor: defaultTextColor,
    defaultFontFamily: defaultFontFamily,
    defaultTitleTextSize: defaultTitleTextSize,
    defaultContentTextSize: defaultContentTextSize,
    theme: theme,
    footer: {
      leftImage: leftImage,
      middleImage: middleImage,
      rightImage: rightImage,
      leftType: leftType,
      middleType: middleType,
      rightType: rightType,
      backgroundColor: backgroundColor,
      timeTextColor: timeTextColor,
    },
    screens: [] as any[],
  }

  slides.forEach((slide) => {
    const screenObj: any = { hidden: slide.hidden ?? false };
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
          contentTextSize
        } = slideData;

        // Use the slide data as needed
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.rowColor = rowColor;
        screenObj.data.alternatingRowColor = alternateRowColor;
        screenObj.data.tableHeaderTextColor = tableHeaderTextColor;
        screenObj.data.tableTextColor = tableTextColor;
        screenObj.data.alternateRowTextColor = alternateRowTextColor;
        screenObj.data.destinations = destinations?.map((destination: any) => ({
          name: destination.name,
          coordinates: destination.coordinates,
        })) || [];
        screenObj.data.titleTextSize = titleTextSize;
        screenObj.data.contentTextSize = contentTextSize;

      } else {
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
        screenObj.data.titleTextSize = titleTextSize ?? 5;
        screenObj.data.contentTextSize = contentTextSize ?? 5;

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
            })),
          };
        }

        if (serviceSelections) {
          screenObj.data.serviceSelections = serviceSelections.map((s: any) => ({
            serviceId: s.serviceId,
            organizationId: s.organizationId,
            enabled: s.enabled,
            selectedStopId: s.selectedStopId,
            enabledRouteIds: s.enabledRouteIds,
            selectedHeadsignFilters: s.selectedHeadsignFilters,
            headsignAliases: s.headsignAliases,
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
      }
    }

    if (slide.type === 'traffic-corridor') {
      screenObj.type = 'traffic-corridor';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTrafficCorridorStore.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        const { title, showTitle, backgroundColor, bgImage, logoImage, titleColor, textColor, tableHeaderColor, rowColor, tables, showSecondTable, titleTextSize, contentTextSize } = slideData;

        screenObj.data.title = title;
        screenObj.data.showTitle = showTitle;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.bgImage = bgImage;
        screenObj.data.logoImage = logoImage;
        screenObj.data.titleColor = titleColor;
        screenObj.data.textColor = textColor;
        screenObj.data.tableHeaderColor = tableHeaderColor;
        screenObj.data.rowColor = rowColor;
        screenObj.data.tables = tables;
        screenObj.data.showSecondTable = showSecondTable;
        screenObj.data.titleTextSize = titleTextSize;
        screenObj.data.contentTextSize = contentTextSize;
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
      } else {
      }
    }

    json.screens.push(screenObj);
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    return Promise.reject(new Error('Missing backend URL'));
  }

  try {
    const endpoint = `/upload/${shortcode}`;

    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json),
    });

    if (!response.ok) {
      throw new Error(`Failed to publish: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    throw error;
  }

}