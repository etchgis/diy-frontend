'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { useGeneralStore } from '@/stores/general';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY;

export default function TransitRoutesPreview({ slideId }: { slideId: string }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const address = useGeneralStore((state) => state.address || '');
  const DEFAULT_COORDINATES = { lng: -73.7562, lat: 42.6526 };

  const coordinates = useGeneralStore(
    (state) => state.coordinates ?? DEFAULT_COORDINATES
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [coordinates.lng, coordinates.lat],
      zoom: 10,
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);


  useEffect(() => {
    if (!mapRef.current || !coordinates) return;

    mapRef.current.setCenter([coordinates.lng, coordinates.lat]);
  }, [coordinates]);

  return (
    <div
      className="w-full h-full bg-[#f7fafc] border border-[#e2e8f0] rounded-lg mb-6 relative"
    >
      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded"
        style={{ overflow: 'hidden', minHeight: '400px' }}
      />
      {/* <img
        src="/images/main-map.png"
        alt="Albany area transit map"
        className="w-full h-full object-cover rounded"
      /> */}

      {/* Map Footer Overlay */}
      <div className="absolute bottom-0 left-0 w-full bg-[#F4F4F4] p-3 flex items-center justify-between rounded-b-lg z-10">
        <img
          src="/images/statewide-mobility-services.png"
          alt="Statewide Mobility Services"
          className="h-[25px] w-[246px]"
        />
        <img src="/images/nysdot-footer-logo.png" alt="NYSDOT" className="h-8" />
      </div>
    </div>
  )
}