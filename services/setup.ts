import { useTransitDestinationsStore } from "@/stores/transitDestinations";
import { useFixedRouteStore } from "@/stores/fixedRoute";
import { useQRStore } from '@/stores/qr';
import { useGeneralStore } from '@/stores/general';
import { useTransitRouteStore } from "@/stores/transitRoutes";
import { useTemplate1Store } from "@/stores/template1";
import { useTemplate2Store } from "@/stores/template2";
import { useTemplate3Store } from "@/stores/template3";
import { useRouteTimesStore } from "@/stores/routeTimes";
import { useImageOnlyStore } from "@/stores/imageOnly";
import { useWeatherStore } from "@/stores/weather";
import { useCitibikeStore } from "@/stores/citibike";
import { useFooterStore } from "@/stores/footer";
import { set } from "react-hook-form";

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
    setPublishPassword
  } = useGeneralStore.getState();

  setCoordinates({ lat: setup.coordinates.lat, lng: setup.coordinates.lng });
  setAddress(setup.address || 'Albany, NY');
  setShortcode(setup.shortcode || '');
  setRotationInterval(setup.rotationInterval || 20);
  setPublishPassword(setup.publishPassword || '');

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
    slides.push({ id: slide.id, type: slide.type });
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
        setDescription,
        setBackgroundColor,
        setTitleColor,
        setTableColor,
        setTableTextColor,
        setBgImage,
        setLogoImage,
        setSelectedStop,
        setTitleTextSize,
        setContentTextSize
      } = useFixedRouteStore.getState();

      setStopName(slide.id, slide.data.stopName || '');
      setDescription(slide.id, slide.data.description || '');
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#192F51');
      setTitleColor(slide.id, slide.data.slideTitleColor || '#ffffff');
      setTableColor(slide.id, slide.data.tableColor || '#ffffff');
      setTableTextColor(slide.id, slide.data.tableTextColor || '#000000');
      setBgImage(slide.id, slide.data.bgImage || '');
      setLogoImage(slide.id, slide.data.logoImage || '');
      setSelectedStop(slide.id, slide.data.selectedStop || undefined);
      setTitleTextSize(slide.id, slide.data.titleTextSize || 5);
      setContentTextSize(slide.id, slide.data.contentTextSize || 5);
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
