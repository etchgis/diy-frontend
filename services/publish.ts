import { useFixedRouteStore } from '@/stores/fixedRoute';
import { useTransitDestinationsStore } from '@/stores/transitDestinations';
import { useGeneralStore } from '@/stores/general';
import { useQRStore } from '@/stores/qr';
import { useTransitRouteStore } from '@/stores/transitRoutes';
import { useTemplate1Store } from '@/stores/template1';
import { useTemplate2Store } from '@/stores/template2';
import { useTemplate3Store } from '@/stores/template3';

export async function publish() {
  const { address, location, coordinates, slides, url } = useGeneralStore.getState();

  const json = {
    location: location,
    address: address,
    coordinates: coordinates,
    screens: [] as any[],
  }

  slides.forEach((slide) => {
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
      screenObj.type = 'transit-routes';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTransitRouteStore.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        console.log('Transit Route Slide Data:', slideData);
        const { destination, location } = slideData;

        screenObj.data.destination = destination;
        screenObj.data.location = location;
      } else {
        console.error(`Transit route slide with ID ${slide.id} not found in the store.`);
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
        } = slideData;

        screenObj.data.text = text;
        screenObj.data.url = url;
        screenObj.data.backgroundColor = backgroundColor;
      } else {
        console.error(`QR slide with ID ${slide.id} not found in the store.`);
      }

    }

    if (slide.type === 'template-1') {
      screenObj.type = 'template-1';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTemplate1Store.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        console.log('Template 1 Slide Data:', slideData);
        const { text, title, image } = slideData;

        screenObj.data.text = text;
        screenObj.data.title = title;
        screenObj.data.image = image;
      } else {
        console.error(`Template 1 slide with ID ${slide.id} not found in the store.`);
      }
    }

    if (slide.type === 'template-2') {
      screenObj.type = 'template-2';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTemplate2Store.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        console.log('Template 2 Slide Data:', slideData);
        const { text, title, image } = slideData;

        screenObj.data.text = text;
        screenObj.data.title = title;
        screenObj.data.image = image;
      } else {
        console.error(`Template 2 slide with ID ${slide.id} not found in the store.`);
      }
    }

    if (slide.type === 'template-3') {
      screenObj.type = 'template-3';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTemplate3Store.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        console.log('Template 3 Slide Data:', slideData);
        const { title, image } = slideData;

        screenObj.data.title = title;
        screenObj.data.image = image;
      } else {
        console.error(`Template 3 slide with ID ${slide.id} not found in the store.`);
      }
    }

    json.screens.push(screenObj);
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    console.error('Backend URL is not defined in environment variables.');
    return Promise.reject(new Error('Missing backend URL'));
  }

  try {
    const shortcode = url?.split('/').pop()
    const endpoint = url ? `/upload/${shortcode}` : '/upload';
    console.log(endpoint);
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
    console.log('Publish successful:', data);
    return data;
  } catch (error) {
    console.error('Error publishing JSON:', error);
    throw error;
  }

}