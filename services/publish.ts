import { useFixedRouteStore } from '@/stores/fixedRoute';
import { useTransitDestinationsStore } from '@/stores/transitDestinations';
import { useGeneralStore } from '@/stores/general';
import { useQRStore } from '@/stores/qr';
import { useTransitRouteStore } from '@/stores/transitRoutes';
import { useTemplate1Store } from '@/stores/template1';
import { useTemplate2Store } from '@/stores/template2';
import { useTemplate3Store } from '@/stores/template3';

export async function publish() {
  const { address, location, coordinates, slides, url, shortcode, rotationInterval } = useGeneralStore.getState();

  const json = {
    location: location,
    address: address,
    coordinates: coordinates,
    shortcode: shortcode,
    rotationInterval: rotationInterval,
    url: url,
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
        const {
          backgroundColor,
          rowColor,
          alternateRowColor,
          tableHeaderTextColor,
          tableTextColor,
          destinations
        } = slideData;

        // Use the slide data as needed
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.rowColor = rowColor;
        screenObj.data.alternatingRowColor = alternateRowColor;
        screenObj.data.tableHeaderTextColor = tableHeaderTextColor;
        screenObj.data.tableTextColor = tableTextColor;
        screenObj.data.destinations = destinations?.map((destination: any) => ({
          name: destination.name,
          coordinates: destination.coordinates,
        })) || [];
        console.log(screenObj.data.destinations);
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
        console.log('Fixed Route Slide Data:', slideData);
        const {
          stopName,
          description,
          backgroundColor,
          titleColor,
          tableColor,
          tableTextColor,
          bgImage
        } = slideData;

        screenObj.data.stopName = stopName;
        screenObj.data.description = description;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.slideTitleColor = titleColor;
        screenObj.data.tableColor = tableColor;
        screenObj.data.tableTextColor = tableTextColor;
        screenObj.data.bgImage = bgImage;
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
        console.log('Transit Route Slide Data:', slideData);
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
          bgImage
        } = slideData;

        screenObj.data.text = text;
        screenObj.data.url = url;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.bgImage = bgImage;
      } else {
      }

    }

    if (slide.type === 'template-1') {
      console.log(slide);
      screenObj.type = 'template-1';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTemplate1Store.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        console.log('Template 1 Slide Data:', slideData);
        const { text, title, image, bgImage, backgroundColor, leftContentSize, rightContentSize } = slideData;

        screenObj.data.text = text;
        screenObj.data.title = title;
        screenObj.data.image = image;
        screenObj.data.bgImage = bgImage;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.leftContentSize = leftContentSize;
        screenObj.data.rightContentSize = rightContentSize;

      } else {
      }
    }

    if (slide.type === 'template-2') {
      console.log(slide);
      screenObj.type = 'template-2';
      screenObj.id = slide.id;
      screenObj.data = {};

      const { slides } = useTemplate2Store.getState();
      const slideData = slides[slide.id];

      if (slideData) {
        console.log('Template 2 Slide Data:', slideData);
        const { text, title, image, backgroundColor, leftContentSize, rightContentSize, bgImage } = slideData;

        screenObj.data.text = text;
        screenObj.data.title = title;
        screenObj.data.image = image;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.leftContentSize = leftContentSize;
        screenObj.data.rightContentSize = rightContentSize;
        screenObj.data.bgImage = bgImage;
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
        console.log('Template 3 Slide Data:', slideData);
        const { title, image, backgroundColor, bgImage } = slideData;

        screenObj.data.title = title;
        screenObj.data.image = image;
        screenObj.data.backgroundColor = backgroundColor;
        screenObj.data.bgImage = bgImage;
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
    throw error;
  }

}