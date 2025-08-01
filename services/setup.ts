import { useTransitDestinationsStore } from "@/stores/transitDestinations";
import { useFixedRouteStore } from "@/stores/fixedRoute";
import { useQRStore } from '@/stores/qr';
import { useGeneralStore } from '@/stores/general';
import { useTransitRouteStore } from "@/stores/transitRoutes";

export async function SetupSlides(shortcode: string) {

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    console.error('Backend URL is not defined in environment variables.');
    return Promise.reject(new Error('Missing backend URL'));
  }

  console.log('Publishing JSON to backend:', `${backendUrl}/config/${shortcode}`);

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
    console.log('Fetch successful:', data);
    await importData(data);
    return data;
  } catch (error) {
    console.error('Error publishing JSON:', error);
    throw error;
  }
}

async function importData(setup: any) {
  console.log('Importing data:', setup);
  const {
    setCoordinates,
    setAddress,
    setSlides
  } = useGeneralStore.getState();

  setCoordinates({ lat: setup.coordinates.lat, lng: setup.coordinates.lng });
  setAddress(setup.address || 'Albany, NY');
  const slides: any = [];

  setup.screens.forEach((slide: any) => {
    slides.push({id: slide.id, type: slide.type});
    if (slide.type === 'transit-destinations') {
      const {
        setBackgroundColor,
        setRowColor,
        setAlternateRowColor,
        setTableHeaderTextColor,
        setTableTextColor,
      } = useTransitDestinationsStore.getState();

      console.log(slide.data.rowColor);

      setBackgroundColor(slide.id, slide.data.backgroundColor || '#000000');
      setRowColor(slide.id, slide.data.rowColor || '#000000');
      setAlternateRowColor(slide.id, slide.data.alternatingRowColor || '#78B1DD');
      setTableHeaderTextColor(slide.id, '#ffffff');
      setTableTextColor(slide.id, '#ffffff');
    }

    if (slide.type === 'fixed-routes') {
      const {
        setStopName,
        setDescription,
        setBackgroundColor,
        setTitleColor,
        setTableColor,
        setTableTextColor,
      } = useFixedRouteStore.getState();

      setStopName(slide.id, slide.data.stop?.label || '');
      setDescription(slide.id, slide.data.stop?.description || '');
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#000000');
      setTitleColor(slide.id, slide.data.slideTitleColor || '#ffffff');
      setTableColor(slide.id, slide.data.tableColor || '#ffffff');
      setTableTextColor(slide.id, slide.data.tableTextColor || '#000000');
    }

    if (slide.type === 'transit-routes') {
      const {
        setDestination,
        setLocation
      } = useTransitRouteStore.getState();

      setDestination(slide.id, slide.data.destination || '');
      setLocation(slide.id, slide.data.location || '');

    }

    if (slide.type === 'qr') {
      const {
        setText,
        setUrl,
        setBackgroundColor,
        setQRSize
      } = useQRStore.getState();

      setText(slide.id, slide.data.text || '');
      setUrl(slide.id, slide.data.url || '');
      setBackgroundColor(slide.id, slide.data.backgroundColor || '#ffffff');
      setQRSize(slide.id, slide.data.qrSize || 5);

    }

    if (slide.type === 'template-1') {

    }

    if (slide.type === 'template-2') {

    }

    if (slide.type === 'template-3') {

    }
  });

  setSlides(slides);
}