'use client'
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { useGeneralStore } from '@/stores/general';
import { useTransitRouteStore } from '@/stores/transitRoutes';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY;

export default function TransitRoutesPreview({ slideId }: { slideId: string }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  const address = useGeneralStore((state) => state.address || '');
  const DEFAULT_COORDINATES = { lng: -73.7562, lat: 42.6526 };
  const coordinates = useGeneralStore(
    (state) => state.coordinates ?? DEFAULT_COORDINATES
  );

 const mockRoutes: any = [];
 const routes = useTransitRouteStore((state) => state.slides[slideId]?.routes || mockRoutes);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [coordinates.lng, coordinates.lat],
      zoom: 10,
      attributionControl: false, 
    });

    // Add custom attribution control positioned to avoid footer overlap
    mapRef.current.addControl(
      new mapboxgl.AttributionControl({
        compact: true,
        customAttribution: '© Mapbox © OpenStreetMap'
      }), 
      'top-right'
    );

    // Set up ResizeObserver to handle container size changes
    if (mapContainerRef.current && 'ResizeObserver' in window) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        if (mapRef.current) {
          // Small delay to ensure DOM has updated
          setTimeout(() => {
            mapRef.current?.resize();
          }, 100);
        }
      });
      
      resizeObserverRef.current.observe(mapContainerRef.current);
    }

    // Fallback: Listen for window resize events
    const handleWindowResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.resize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserverRef.current?.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map center when coordinates change
  useEffect(() => {
    if (!mapRef.current || !coordinates) return;
    mapRef.current.setCenter([coordinates.lng, coordinates.lat]);
  }, [coordinates]);

  // Force resize when component mounts (for cases where container size is set after mount)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-full bg-[#f7fafc] rounded-lg relative flex flex-col">
      {/* Map container - takes remaining space after footer */}
      <div className="flex-1 w-full relative overflow-hidden rounded-t-lg">
        <div
          ref={mapContainerRef}
          className="absolute inset-0"
          style={{
            width: '100%',
            height: '100%'
          }}
        />
      </div>
      
      {/* Custom Footer */}
      <div className="w-full bg-[#F4F4F4] p-3 flex items-center justify-between rounded-b-lg flex-shrink-0 z-20">
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