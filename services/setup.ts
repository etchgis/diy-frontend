import { useTransitDestinationsStore } from "@/stores/transitDestinations";
import { useFixedRouteStore } from "@/stores/fixedRoute";
import { useQRStore } from '@/stores/qr';
import { useGeneralStore } from '@/stores/general';
import { useTransitRouteStore } from "@/stores/transitRoutes";
import { useTemplate1Store } from "@/stores/template1";
import { useTemplate2Store } from "@/stores/template2";
import { useTemplate3Store } from "@/stores/template3";
import { useRouteTimesStore } from "@/stores/routeTimes";
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
        setAlternateRowTextColor
      } = useTransitDestinationsStore.getState();

      setBackgroundColor(slide.id, slide.data.backgroundColor || '#192F51');
      setRowColor(slide.id, slide.data.rowColor || '#192F51');
      setAlternateRowColor(slide.id, slide.data.alternatingRowColor || '#78B1DD');
      setTableHeaderTextColor(slide.id, slide.data.tableHeaderTextColor || '#ffffff');
      setTableTextColor(slide.id, slide.data.tableTextColor || '#ffffff');
      setAlternateRowTextColor(slide.id, slide.data.alternateRowTextColor || '#ffffff');
      setDestinations(slide.id, slide.data.destinations || []);
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
        setSelectedStop
      } = useFixedRouteStore.getState();

      setStopName(slide.id, slide.data.stopName || '');
      setDescription(slide.id, slide.data.description || '');
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#192F51');
      setTitleColor(slide.id, slide.data.slideTitleColor || '#ffffff');
      setTableColor(slide.id, slide.data.tableColor || '#ffffff');
      setTableTextColor(slide.id, slide.data.tableTextColor || '#000000');
      setBgImage(slide.id, slide.data.bgImage || '');
      setSelectedStop(slide.id, slide.data.selectedStop || undefined);
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
        setBgImage
      } = useQRStore.getState();

      setText(slide.id, slide.data.text || '');
      setUrl(slide.id, slide.data.url || '');
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#192F51');
      setQRSize(slide.id, slide.data.qrSize || 5);
      setBgImage(slide.id, slide.data.bgImage || '');
    }

    if (slide.type === 'template-1') {
      const {
        setText,
        setTitle,
        setImage,
        setBgImage,
        setBackgroundColor,
        setLeftContentSize,
        setRightContentSize
      } = useTemplate1Store.getState();

      setText(slide.id, slide.data.text || '');
      setTitle(slide.id, slide.data.title || '');
      setImage(slide.id, slide.data.image || null);
      setBgImage(slide.id, slide.data.bgImage || null);
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#305fff');
      setLeftContentSize(slide.id, slide.data.leftContentSize || '60%');
      setRightContentSize(slide.id, slide.data.rightContentSize || '40%');
    }

    if (slide.type === 'template-2') {
      const {
        setText,
        setTitle,
        setImage,
        setBgImage,
        setBackgroundColor,
        setLeftContentSize,
        setRightContentSize
      } = useTemplate2Store.getState();
    
      setText(slide.id, slide.data.text || '');
      setTitle(slide.id, slide.data.title || '');
      setImage(slide.id, slide.data.image || null);
      setBgImage(slide.id, slide.data.bgImage || null);
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#305fff');
      setLeftContentSize(slide.id, slide.data.leftContentSize || '60%');
      setRightContentSize(slide.id, slide.data.rightContentSize || '40%');

    }

    if (slide.type === 'template-3') {
      const {
        setTitle,
        setImage,
        setBgImage,
        setBackgroundColor,
      } = useTemplate3Store.getState();
      setTitle(slide.id, slide.data.title || '');
      setImage(slide.id, slide.data.image || null);
      setBgImage(slide.id, slide.data.bgImage || null);
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#305fff');
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
    }
  });

  setSlides(slides);
}
