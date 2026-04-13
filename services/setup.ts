import { useTransitDestinationsStore } from "@/modules/transit-destinations/store";
import { useFixedRouteStore } from "@/modules/fixed-routes/store";
import { useQRStore } from '@/modules/qr/store';
import { useGeneralStore } from '@/stores/general';
import { useTransitRouteStore } from "@/modules/transit-routes/store";
import { useTemplate1Store } from "@/modules/template-1/store";
import { useTemplate2Store } from "@/modules/template-2/store";
import { useTemplate3Store } from "@/modules/template-3/store";
import { useRouteTimesStore } from "@/modules/route-times/store";
import { useImageOnlyStore } from "@/modules/image-only/store";
import { useWeatherStore } from "@/modules/weather/store";
import { useCitibikeStore } from "@/modules/citibike/store";
import { useTrafficCorridorStore } from "@/modules/traffic-corridor/store";
import { useFooterStore } from "@/stores/footer";

// =============================================================================
// TEMPORARY MIGRATION: Remove after all stored configs have been re-published
// Migrates old API format (stop_id, service_guid, snake_case) to new format (id, serviceId, camelCase)
// Old format in database: stop_id, stop_name, services[].service_guid, route_short_name, etc.
// New format: id, name, services[].id, shortName, etc.
// =============================================================================

function migrateSelectedStop(stop: any): any {
  if (!stop) return stop;

  // Check if already in new format (has proper stop structure with services array)
  // New format has: { id: "stopId", services: [{ id: "serviceGuid", ... }] }
  if (stop.services && Array.isArray(stop.services) && stop.services[0]?.id && !stop.services[0]?.service_guid) {
    return stop;
  }

  // OLD FORMAT: selectedStop is actually a SERVICE object with _stopIds embedded:
  // { service_guid, organization_guid, agency_name, routes, _stopIds: ["12337"], _stopIdData: {...} }
  //
  // NEW FORMAT: selectedStop is a proper STOP object with services array:
  // { id: "12337", name: "...", services: [{ id: "service_guid", organizationId: "...", routes: [...] }] }

  // Handle old flat service format (service_guid at root level)
  if (stop.service_guid || (stop._stopIds && !stop.services)) {
    const stopId = stop._stopIds?.[0] || '';
    return {
      id: stopId,
      name: stop.stop_name ?? stop.name ?? '',
      lat: stop.stop_lat ?? stop.lat,
      lon: stop.stop_lon ?? stop.lon,
      locationType: stop._stopIdData?.[stopId]?.location_type ?? stop.location_type ?? stop.locationType,
      services: [{
        id: stop.service_guid ?? stop.id,
        organizationId: stop.organization_guid ?? stop.organizationId,
        agencyName: stop.agency_name ?? stop.agencyName,
        routes: (stop.routes || []).map((r: any) => ({
          id: r.route_id ?? r.id,
          shortName: r.route_short_name ?? r.shortName,
          longName: r.route_long_name ?? r.longName,
          color: r.route_color ?? r.color,
          textColor: r.route_text_color ?? r.textColor,
          headsigns: r.headsigns || [],
        })),
        _stopIds: stop._stopIds,
        _stopIdData: stop._stopIdData,
      }],
      linkedStops: [],
      _allStopIds: stop._allStopIds || stop._stopIds,
    };
  }

  // Handle intermediate format (stop with services array but old field names)
  return {
    id: stop.stop_id ?? stop.id,
    name: stop.stop_name ?? stop.name,
    lat: stop.stop_lat ?? stop.lat,
    lon: stop.stop_lon ?? stop.lon,
    locationType: stop.location_type ?? stop.locationType,
    services: (stop.services || []).map((svc: any) => ({
      id: svc.service_guid ?? svc.id,
      organizationId: svc.organization_guid ?? svc.organizationId,
      agencyName: svc.agency_name ?? svc.agencyName,
      routes: (svc.routes || []).map((r: any) => ({
        id: r.route_id ?? r.id,
        shortName: r.route_short_name ?? r.shortName,
        longName: r.route_long_name ?? r.longName,
        color: r.route_color ?? r.color,
        textColor: r.route_text_color ?? r.textColor,
        headsigns: r.headsigns || [],
      })),
      _stopIds: svc._stopIds,
      _stopIdData: svc._stopIdData,
    })),
    linkedStops: (stop.complex_stops || stop.linkedStops || []).map((ls: any) => ({
      id: ls.stop_id ?? ls.id,
      name: ls.stop_name ?? ls.name,
      services: (ls.services || []).map((svc: any) => ({
        id: svc.service_guid ?? svc.id,
        organizationId: svc.organization_guid ?? svc.organizationId,
        agencyName: svc.agency_name ?? svc.agencyName,
        routes: (svc.routes || []).map((r: any) => ({
          id: r.route_id ?? r.id,
          shortName: r.route_short_name ?? r.shortName,
          longName: r.route_long_name ?? r.longName,
          color: r.route_color ?? r.color,
          textColor: r.route_text_color ?? r.textColor,
          headsigns: r.headsigns || [],
        })),
      })),
    })),
    _allStopIds: stop._allStopIds,
    distance: stop.distance,
  };
}

function migrateServiceSelections(selections: any[], selectedStop: any): any[] {
  // If serviceSelections is missing, generate default from selectedStop.services
  if (!selections || !Array.isArray(selections) || selections.length === 0) {
    const services = selectedStop?.services || [];
    if (services.length === 0) return [];

    // Generate default selections - all services enabled, using the stop's ID
    const stopId = selectedStop?.id ?? selectedStop?.stop_id ?? '';
    return services.map((svc: any) => ({
      serviceId: svc.id ?? svc.service_guid,
      agencyName: svc.agencyName ?? svc.agency_name ?? 'Unknown',
      routes: (svc.routes || []).map((r: any) => ({
        id: r.id ?? r.route_id,
        shortName: r.shortName ?? r.route_short_name,
        longName: r.longName ?? r.route_long_name,
        color: r.color ?? r.route_color,
        textColor: r.textColor ?? r.route_text_color,
        headsigns: r.headsigns || [],
      })),
      enabled: true,
      selectedStopId: stopId,
      directionOptions: [{ stopId, label: 'All Directions', isAllDirections: true }],
      enabledRouteIds: (svc.routes || []).map((r: any) => r.id ?? r.route_id),
    }));
  }

  return selections.map((sel: any) => {
    // Check if already in new format (has 'serviceId' instead of 'service_guid')
    if (sel.serviceId !== undefined && sel.service_guid === undefined) {
      return sel;
    }

    return {
      serviceId: sel.service_guid ?? sel.serviceId,
      agencyName: sel.agency_name ?? sel.agencyName,
      routes: (sel.routes || []).map((r: any) => ({
        id: r.route_id ?? r.id,
        shortName: r.route_short_name ?? r.shortName,
        longName: r.route_long_name ?? r.longName,
        color: r.route_color ?? r.color,
        textColor: r.route_text_color ?? r.textColor,
        headsigns: r.headsigns,
      })),
      enabled: sel.enabled,
      selectedStopId: sel.selectedStopId,
      selectedHeadsignFilters: sel.selectedHeadsignFilters,
      directionOptions: (sel.directionOptions || []).map((opt: any) => ({
        stopId: opt.stop_id ?? opt.stopId,
        label: opt.label,
        isAllDirections: opt.isAllDirections,
        headsignFilter: opt.headsignFilter,
      })),
      enabledRouteIds: sel.enabledRouteIds,
      headsignAliases: sel.headsignAliases,
    };
  });
}

// =============================================================================

export async function SetupSlides(shortcode: string) {

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    console.error('Backend URL is not defined in environment variables.');
    return Promise.reject(new Error('Missing backend URL'));
  }



  try {
    const response = await fetch(`${backendUrl}/config/${shortcode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to publish: ${response.statusText}`);
    }

    const data = await response.json();

    await importData(data);
    return data;
  } catch (error) {
    console.error('Error publishing JSON:', error);
    throw error;
  }
}

async function importData(setup: any) {

  const {
    setCoordinates,
    setAddress,
    setSlides,
    setShortcode,
    setRotationInterval,
    setPublishPassword,
    setDefaultBackgroundColor,
    setDefaultTitleColor,
    setDefaultTextColor,
    setDefaultFontFamily,
    setDefaultTitleTextSize,
    setDefaultContentTextSize
  } = useGeneralStore.getState();

  setCoordinates({ lat: setup.coordinates.lat, lng: setup.coordinates.lng });
  setAddress(setup.address || 'Albany, NY');
  setShortcode(setup.shortcode || '');
  setRotationInterval(setup.rotationInterval || 20);
  setPublishPassword(setup.publishPassword || '');

  // Restore default styling settings
  if (setup.defaultBackgroundColor) {
    setDefaultBackgroundColor(setup.defaultBackgroundColor);
  }
  if (setup.defaultTitleColor) {
    setDefaultTitleColor(setup.defaultTitleColor);
  }
  if (setup.defaultTextColor) {
    setDefaultTextColor(setup.defaultTextColor);
  }
  if (setup.defaultFontFamily) {
    setDefaultFontFamily(setup.defaultFontFamily);
  }
  if (setup.defaultTitleTextSize) {
    setDefaultTitleTextSize(setup.defaultTitleTextSize);
  }
  if (setup.defaultContentTextSize) {
    setDefaultContentTextSize(setup.defaultContentTextSize);
  }

  if (setup.theme) {
    const generalState = useGeneralStore.getState();
    // Directly set theme state without triggering applyThemeColorToAllSlides
    useGeneralStore.setState({
      theme: {
        primaryBackground: setup.theme.primaryBackground || '#192F51',
        secondaryAccent: setup.theme.secondaryAccent || '#78B1DD',
        titleText: setup.theme.titleText || '#ffffff',
        bodyText: setup.theme.bodyText || '#ffffff',
      }
    });
  }

  // Restore footer data - always set them to override localStorage defaults
  const {
    setLeftImage,
    setMiddleImage,
    setRightImage,
    setLeftType,
    setMiddleType,
    setRightType,
    setBackgroundColor,
    setTimeTextColor
  } = useFooterStore.getState();

  const leftImageValue = setup.footer?.leftImage !== undefined
    ? setup.footer.leftImage
    : '/images/statewide-mobility-services.png';
  const middleImageValue = setup.footer?.middleImage !== undefined
    ? setup.footer.middleImage
    : '';
  const rightImageValue = setup.footer?.rightImage !== undefined
    ? setup.footer.rightImage
    : '/images/nysdot-footer-logo.png';
  const leftTypeValue = setup.footer?.leftType !== undefined
    ? setup.footer.leftType
    : 'image';
  const middleTypeValue = setup.footer?.middleType !== undefined
    ? setup.footer.middleType
    : 'image';
  const rightTypeValue = setup.footer?.rightType !== undefined
    ? setup.footer.rightType
    : 'image';
  const backgroundColorValue = setup.footer?.backgroundColor !== undefined
    ? setup.footer.backgroundColor
    : '#F4F4F4';
  const timeTextColorValue = setup.footer?.timeTextColor !== undefined
    ? setup.footer.timeTextColor
    : '#000000';

  console.log('[SETUP] Setting footer data:', {
    leftImageValue,
    middleImageValue,
    rightImageValue,
    leftTypeValue,
    middleTypeValue,
    rightTypeValue,
    backgroundColorValue,
    timeTextColorValue
  });

  setLeftImage(leftImageValue);
  setMiddleImage(middleImageValue);
  setRightImage(rightImageValue);
  setLeftType(leftTypeValue);
  setMiddleType(middleTypeValue);
  setRightType(rightTypeValue);
  setBackgroundColor(backgroundColorValue);
  setTimeTextColor(timeTextColorValue);

  const slides: any = [];

  setup.screens.forEach((slide: any) => {
    slides.push({ id: slide.id, type: slide.type, hidden: slide.hidden ?? false });
    if (slide.type === 'transit-destinations') {
      const {
        setBackgroundColor,
        setRowColor,
        setAlternateRowColor,
        setTableHeaderTextColor,
        setTableTextColor,
        setDestinations,
        setAlternateRowTextColor,
        setTitleTextSize,
        setContentTextSize
      } = useTransitDestinationsStore.getState();

      setBackgroundColor(slide.id, slide.data.backgroundColor || '#192F51');
      setRowColor(slide.id, slide.data.rowColor || '#192F51');
      setAlternateRowColor(slide.id, slide.data.alternatingRowColor || '#78B1DD');
      setTableHeaderTextColor(slide.id, slide.data.tableHeaderTextColor || '#ffffff');
      setTableTextColor(slide.id, slide.data.tableTextColor || '#ffffff');
      setAlternateRowTextColor(slide.id, slide.data.alternateRowTextColor || '#ffffff');
      setDestinations(slide.id, slide.data.destinations || []);
      setTitleTextSize(slide.id, slide.data.titleTextSize || 5);
      setContentTextSize(slide.id, slide.data.contentTextSize || 5);
      console.log('Destinations set for slide:', slide.id, slide.data.destinations || []);
    }

    if (slide.type === 'fixed-routes') {
      const {
        setStopName,
        setDisplayName,
        setShowTitle,
        setDescription,
        setBackgroundColor,
        setTitleColor,
        setTableColor,
        setTableTextColor,
        setBgImage,
        setLogoImage,
        setSelectedStop,
        setServiceSelections,
        setTitleTextSize,
        setContentTextSize,
        setColumnMode,
        setColumnLabels,
        setColumnServiceSelections,
      } = useFixedRouteStore.getState();

      setStopName(slide.id, slide.data.stopName || '');
      setDisplayName(slide.id, slide.data.displayName || '');
      setShowTitle(slide.id, slide.data.showTitle !== false);
      setDescription(slide.id, slide.data.description || '');
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#192F51');
      setTitleColor(slide.id, slide.data.slideTitleColor || '#FFFFFF');
      setTableColor(slide.id, slide.data.tableColor || '#78B1DD');
      setTableTextColor(slide.id, slide.data.tableTextColor || '#FFFFFF');
      setBgImage(slide.id, slide.data.bgImage || '');
      setLogoImage(slide.id, slide.data.logoImage || '');
      // TEMPORARY MIGRATION: Apply migration for old stored format
      const migratedStop = migrateSelectedStop(slide.data.selectedStop);
      const migratedSelections = migrateServiceSelections(slide.data.serviceSelections, migratedStop) || [];
      setSelectedStop(slide.id, migratedStop || undefined);
      setServiceSelections(slide.id, migratedSelections);
      setTitleTextSize(slide.id, slide.data.titleTextSize || 5);
      setContentTextSize(slide.id, slide.data.contentTextSize || 5);
      setColumnMode(slide.id, slide.data.columnMode || false);
      if (slide.data.columnLabels) {
        setColumnLabels(slide.id, slide.data.columnLabels);
      }
      if (slide.data.columnServiceSelections) {
        setColumnServiceSelections(slide.id, slide.data.columnServiceSelections);
      }
    }

    if (slide.type === 'transit-routes') {
      const {
        setDestination,
        setLocation,
        setRoutes
      } = useTransitRouteStore.getState();

      setDestination(slide.id, slide.data.destination || '');
      setLocation(slide.id, slide.data.location || '');
      setRoutes(slide.id, slide.data.routes || []);

    }

    if (slide.type === 'qr') {
      const {
        setText,
        setUrl,
        setBackgroundColor,
        setQRSize,
        setBgImage,
        setLogoImage,
        setTextSize
      } = useQRStore.getState();

      setText(slide.id, slide.data.text || '');
      setUrl(slide.id, slide.data.url || '');
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#192F51');
      setQRSize(slide.id, slide.data.qrSize || 5);
      setBgImage(slide.id, slide.data.bgImage || '');
      setLogoImage(slide.id, slide.data.logoImage || '');
      setTextSize(slide.id, slide.data.textSize || 5);
    }

    if (slide.type === 'template-1') {
      const {
        setText,
        setTitle,
        setImage,
        setBgImage,
        setBackgroundColor,
        setLeftContentSize,
        setRightContentSize,
        setTextColor,
        setTitleColor,
        setLogoImage,
        setImageWidth,
        setImageHeight,
        setImageObjectFit,
        setTitleTextSize,
        setContentTextSize
      } = useTemplate1Store.getState();

      setText(slide.id, slide.data.text || '');
      setTitle(slide.id, slide.data.title || '');
      setImage(slide.id, slide.data.image || null);
      setBgImage(slide.id, slide.data.bgImage || null);
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#305fff');
      setLeftContentSize(slide.id, slide.data.leftContentSize || '60%');
      setRightContentSize(slide.id, slide.data.rightContentSize || '40%');
      setTextColor(slide.id, slide.data.textColor || '#ffffff');
      setTitleColor(slide.id, slide.data.titleColor || '#ffffff');
      setLogoImage(slide.id, slide.data.logoImage || '');
      setImageWidth(slide.id, slide.data.imageWidth || 400);
      setImageHeight(slide.id, slide.data.imageHeight || 280);
      setImageObjectFit(slide.id, slide.data.imageObjectFit || 'contain');
      setTitleTextSize(slide.id, slide.data.titleTextSize || 5);
      setContentTextSize(slide.id, slide.data.contentTextSize || 5);
    }

    if (slide.type === 'template-2') {
      const {
        setText,
        setTitle,
        setImage,
        setBgImage,
        setBackgroundColor,
        setLeftContentSize,
        setRightContentSize,
        setTextColor,
        setTitleColor,
        setLogoImage,
        setImageWidth,
        setImageHeight,
        setImageObjectFit,
        setTitleTextSize,
        setContentTextSize
      } = useTemplate2Store.getState();

      setText(slide.id, slide.data.text || '');
      setTitle(slide.id, slide.data.title || '');
      setImage(slide.id, slide.data.image || null);
      setBgImage(slide.id, slide.data.bgImage || null);
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#305fff');
      setLeftContentSize(slide.id, slide.data.leftContentSize || '60%');
      setRightContentSize(slide.id, slide.data.rightContentSize || '40%');
      setTextColor(slide.id, slide.data.textColor || '#ffffff');
      setTitleColor(slide.id, slide.data.titleColor || '#ffffff');
      setLogoImage(slide.id, slide.data.logoImage || '');
      setImageWidth(slide.id, slide.data.imageWidth || 400);
      setImageHeight(slide.id, slide.data.imageHeight || 280);
      setImageObjectFit(slide.id, slide.data.imageObjectFit || 'contain');
      setTitleTextSize(slide.id, slide.data.titleTextSize || 5);
      setContentTextSize(slide.id, slide.data.contentTextSize || 5);

    }

    if (slide.type === 'template-3') {
      const {
        setTitle,
        setImage,
        setBgImage,
        setBackgroundColor,
        setTextColor,
        setTitleColor,
        setLogoImage,
        setImageWidth,
        setImageHeight,
        setImageObjectFit,
        setTitleTextSize
      } = useTemplate3Store.getState();
      setTitle(slide.id, slide.data.title || '');
      setImage(slide.id, slide.data.image || null);
      setBgImage(slide.id, slide.data.bgImage || null);
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#305fff');
      setTextColor(slide.id, slide.data.textColor || '#ffffff');
      setTitleColor(slide.id, slide.data.titleColor || '#ffffff');
      setLogoImage(slide.id, slide.data.logoImage || '');
      setImageWidth(slide.id, slide.data.imageWidth || 600);
      setImageHeight(slide.id, slide.data.imageHeight || 400);
      setImageObjectFit(slide.id, slide.data.imageObjectFit || 'contain');
      setTitleTextSize(slide.id, slide.data.titleTextSize || 5);
    }

    if (slide.type === 'image-only') {
      const {
        setImage,
        setImageObjectFit,
        setBackgroundColor,
        setFullScreen,
        setImageWidth,
        setImageHeight
      } = useImageOnlyStore.getState();

      setImage(slide.id, slide.data.image || null);
      setImageObjectFit(slide.id, slide.data.imageObjectFit || 'cover');
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#000000');
      setFullScreen(slide.id, slide.data.fullScreen ?? true);
      setImageWidth(slide.id, slide.data.imageWidth || 600);
      setImageHeight(slide.id, slide.data.imageHeight || 400);
    }

    if (slide.type === 'weather') {
      const {
        setTitle,
        setBackgroundColor,
        setContentBackgroundColor,
        setBgImage,
        setTitleColor,
        setTextColor,
        setLogoImage,
        setTitleTextSize,
        setContentTextSize
      } = useWeatherStore.getState();

      setTitle(slide.id, slide.data.title || '');
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#192F51');
      setContentBackgroundColor(slide.id, slide.data.contentBackgroundColor || '');
      setBgImage(slide.id, slide.data.bgImage || '');
      setTitleColor(slide.id, slide.data.titleColor || '#ffffff');
      setTextColor(slide.id, slide.data.textColor || '#ffffff');
      setLogoImage(slide.id, slide.data.logoImage || '');
      setTitleTextSize(slide.id, slide.data.titleTextSize || 5);
      setContentTextSize(slide.id, slide.data.contentTextSize || 5);
    }

    if (slide.type === 'citibike') {
      const {
        setTitle,
        setBackgroundColor,
        setBgImage,
        setTitleColor,
        setTextColor,
        setLogoImage,
        setSearchRadius,
        setTitleTextSize,
        setContentTextSize
      } = useCitibikeStore.getState();

      setTitle(slide.id, slide.data.title || '');
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#192F51');
      setBgImage(slide.id, slide.data.bgImage || '');
      setTitleColor(slide.id, slide.data.titleColor || '#ffffff');
      setTextColor(slide.id, slide.data.textColor || '#ffffff');
      setLogoImage(slide.id, slide.data.logoImage || '');
      setSearchRadius(slide.id, slide.data.searchRadius || 0.5);
      setTitleTextSize(slide.id, slide.data.titleTextSize || 5);
      setContentTextSize(slide.id, slide.data.contentTextSize || 5);
    }

    if (slide.type === 'traffic-corridor') {
      const {
        setTitle,
        setShowTitle,
        setBackgroundColor,
        setBgImage,
        setLogoImage,
        setTitleColor,
        setTextColor,
        setTableHeaderColor,
        setRowColor,
        setTables,
        setShowSecondTable,
        setTitleTextSize,
        setContentTextSize,
      } = useTrafficCorridorStore.getState();

      setTitle(slide.id, slide.data.title || '');
      setShowTitle(slide.id, slide.data.showTitle !== false);
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#192F51');
      setBgImage(slide.id, slide.data.bgImage || '');
      setLogoImage(slide.id, slide.data.logoImage || '');
      setTitleColor(slide.id, slide.data.titleColor || '#ffffff');
      setTextColor(slide.id, slide.data.textColor || '#ffffff');
      setTableHeaderColor(slide.id, slide.data.tableHeaderColor || '#78B1DD');
      setRowColor(slide.id, slide.data.rowColor || '#192F51');
      setTables(slide.id, slide.data.tables || [{ destination: '', corridors: [] }, { destination: '', corridors: [] }]);
      setShowSecondTable(slide.id, slide.data.showSecondTable || false);
      setTitleTextSize(slide.id, slide.data.titleTextSize || 5);
      setContentTextSize(slide.id, slide.data.contentTextSize || 5);
    }

    if (slide.type === 'route-times') {
      const {
        setRouteName,
        setSelectedRoute,
        setDescription,
        setViewMode,
        setBackgroundColor,
        setTitleColor,
        setTableColor,
        setTableTextColor,
        setBgImage,
        setLogoImage,
        setTitleTextSize,
        setContentTextSize
      } = useRouteTimesStore.getState();

      setRouteName(slide.id, slide.data.routeName || '');
      setSelectedRoute(slide.id, slide.data.selectedRoute || undefined);
      setDescription(slide.id, slide.data.description || '');
      setViewMode(slide.id, slide.data.viewMode || 'map');
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#192F51');
      setTitleColor(slide.id, slide.data.slideTitleColor || '#ffffff');
      setTableColor(slide.id, slide.data.tableColor || '#ffffff');
      setTableTextColor(slide.id, slide.data.tableTextColor || '#000000');
      setBgImage(slide.id, slide.data.bgImage || '');
      setLogoImage(slide.id, slide.data.logoImage || '');
      setTitleTextSize(slide.id, slide.data.titleTextSize || 5);
      setContentTextSize(slide.id, slide.data.contentTextSize || 5);
    }
  });

  setSlides(slides);
}
