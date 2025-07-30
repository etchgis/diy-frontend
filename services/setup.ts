import setup from '../setup.json';
import { useTransitDestinationsStore } from "@/stores/transitDestinations";
import { useFixedRouteStore } from "@/stores/fixedRoute";
import { useQRStore } from '@/stores/qr';
import { useGeneralStore } from '@/stores/general';

export function SetupSlides() {

  const {
    setCoordinates,
    setAddress
  } = useGeneralStore.getState();

  setCoordinates({ lat: setup.coordinates[0], lng: setup.coordinates[1] });
  setAddress(setup.address || 'Albany, NY');

  setup.screens.forEach((slide) => {
    if (slide.type === 'transit-destinations') {
      const {
        setBackgroundColor,
        setRowColor,
        setAlternateRowColor,
        setTableHeaderTextColor,
        setTableTextColor,
      } = useTransitDestinationsStore.getState();

      setBackgroundColor(slide.id, slide.data.backgroundColor || '#000000');
      setRowColor(slide.id, slide.data.backgroundColor || '#000000');
      setAlternateRowColor(slide.id, '#78B1DD');
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
        setText,
        setUrl,
        setBackgroundColor
      } = useQRStore.getState();
    }

    if (slide.type === 'qr') {


    }

    if (slide.type === 'template-1') {

    }

    if (slide.type === 'template-2') {

    }

    if (slide.type === 'template-3') {

    }
  });


}