import { useFixedRouteStore } from '@/stores/fixedRoute';
import { useTransitDestinationsStore } from '@/stores/transitDestinations';
import setup from '../setup.json';
import { useGeneralStore } from '@/stores/general';
import { useQRStore } from '@/stores/qr';

export async function publish() {
  const { address, location, coordinates } = useGeneralStore.getState();

  const json = {
    location: location,
    address: address,
    coordinates: coordinates,
    screens: [] as any[],
  }

  setup.screens.forEach((slide) => {
    const screenObj: any = {};
    if (slide.type === 'transit-destinations') {
      screenObj.type = 'transit-destinations';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTransitDestinationsStore.getState();

      const slideData = slides[slide.id];

      if (slideData) {
        console.log('Slide Data:', slideData);
        const {
          backgroundColor,
          rowColor,
          alternateRowColor,
          tableHeaderTextColor,
          tableTextColor,
        } = slideData;

        // Use the slide data as needed
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.rowColor = rowColor;
        screenObj.data.alternatingRowColor = alternateRowColor;
        screenObj.data.tableHeaderTextColor = tableHeaderTextColor;
        screenObj.data.tableTextColor = tableTextColor;
      } else {
        console.error(`Slide with ID ${slide.id} not found in the store.`);
      }
    }

    if (slide.type === 'fixed-routes') {
      screenObj.type = 'fixed-routes';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useFixedRouteStore.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        console.log('Fixed Route Slide Data:', slideData);
        const {
          stopName,
          description,
          backgroundColor,
          titleColor,
          tableColor,
          tableTextColor,
        } = slideData;

        screenObj.data.stopName = stopName;
        screenObj.data.description = description;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.slideTitleColor = titleColor;
        screenObj.data.tableColor = tableColor;
        screenObj.data.tableTextColor = tableTextColor;
      } else {
        console.error(`Fixed route slide with ID ${slide.id} not found in the store.`);
      }
    }

    if (slide.type === 'transit-routes') {
      // TODO: Add logic for transit-routes if needed
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
        } = slideData;

        screenObj.data.text = text;
        screenObj.data.url = url;
        screenObj.data.backgroundColor = backgroundColor;
      } else {
        console.error(`QR slide with ID ${slide.id} not found in the store.`);
      }

    }

    if (slide.type === 'template-1') {

    }

    if (slide.type === 'template-2') {

    }

    if (slide.type === 'template-3') {

    }

    json.screens.push(screenObj);
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    console.error('Backend URL is not defined in environment variables.');
    return Promise.reject(new Error('Missing backend URL'));
  }

  try {
    const response = await fetch(`${backendUrl}/upload`, {
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
    console.log('Publish successful:', data);
    return data; 
  } catch (error) {
    console.error('Error publishing JSON:', error);
    throw error; 
  }

}