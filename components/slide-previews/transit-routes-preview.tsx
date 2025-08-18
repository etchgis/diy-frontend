'use client'
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { useGeneralStore } from '@/stores/general';
import { useTransitRouteStore } from '@/stores/transitRoutes';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY;

// Function to decode polyline (Google's polyline format)
const decodePolyline = (encoded: string): [number, number][] => {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lng / 1e5, lat / 1e5]);
  }
  return points;
};

export default function TransitRoutesPreview({ slideId, noMapScroll }: { slideId: string, noMapScroll?: boolean }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const isMapLoadedRef = useRef<boolean>(false);

  const address = useGeneralStore((state) => state.address || '');
  const DEFAULT_COORDINATES = { lng: -73.7562, lat: 42.6526 };
  const coordinates = useGeneralStore(
    (state) => state.coordinates ?? DEFAULT_COORDINATES
  );

  const mockRoutes: any = [];
  const routes = useTransitRouteStore((state) => state.slides[slideId]?.routes || mockRoutes);
  const dataError = useTransitRouteStore((state) => state.slides[slideId]?.dataError || false);

  // Route colors for different routes
  const routeColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F06292', '#AED581', '#FFB74D'
  ];

  // Initialize map only once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [coordinates.lng, coordinates.lat],
      zoom: 10,
      attributionControl: false,
    });

    if (noMapScroll) {
      mapRef.current.dragPan.disable();
      mapRef.current.scrollZoom.disable();
      mapRef.current.boxZoom.disable();
      mapRef.current.dragRotate.disable();
      mapRef.current.keyboard.disable();
      mapRef.current.doubleClickZoom.disable();
      mapRef.current.touchZoomRotate.disable();
    }


    // Add custom attribution control
    mapRef.current.addControl(
      new mapboxgl.AttributionControl({
        compact: true,
        customAttribution: '© Mapbox © OpenStreetMap'
      }),
      'top-right'
    );

    // Set up ResizeObserver
    if (mapContainerRef.current && 'ResizeObserver' in window) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        if (mapRef.current) {
          setTimeout(() => {
            mapRef.current?.resize();
          }, 100);
        }
      });

      resizeObserverRef.current.observe(mapContainerRef.current);
    }

    // Window resize fallback
    const handleWindowResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.resize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleWindowResize);

    // Set map loaded flag
    mapRef.current.on('load', () => {
      isMapLoadedRef.current = true;

    });

    return () => {
      resizeObserverRef.current?.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      // Clear all markers before removing map
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      isMapLoadedRef.current = false;
    };
  }, []); // Only run once on mount

  // Update map center when coordinates change
  useEffect(() => {
    if (!mapRef.current || !coordinates) return;
    mapRef.current.setCenter([coordinates.lng, coordinates.lat]);
  }, [coordinates]);

  // Function to clear existing route data
  const clearExistingRoutes = () => {
    if (!mapRef.current) return;

    // Clear markers

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear existing sources and layers
    const style = mapRef.current.getStyle();
    if (style && style.layers) {
      style.layers.forEach((layer: any) => {
        if (layer.id.startsWith('route-layer-')) {
          if (mapRef.current?.getLayer(layer.id)) {
            mapRef.current.removeLayer(layer.id);
          }
        }
      });
    }

    if (style && style.sources) {
      Object.keys(style.sources).forEach((sourceId) => {
        if (sourceId.startsWith('route-')) {
          if (mapRef.current?.getSource(sourceId)) {
            mapRef.current.removeSource(sourceId);
          }
        }
      });
    }
  };

  // Function to add routes to map
  const addRoutesToMap = () => {
    if (!mapRef.current || !routes || routes.length === 0) return;



    try {
      // Add origin marker first (always visible)
      const originMarkerEl = document.createElement('div');
      originMarkerEl.style.cssText = `
        width: 20px;
        height: 20px;
        background: #FF4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        position: relative;
        z-index: 1;
      `;



      const originMarker = new mapboxgl.Marker({
        element: originMarkerEl,
        anchor: 'center'
      })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(mapRef.current!);

      markersRef.current.push(originMarker);


      routes.forEach((route: any, routeIndex: number) => {

        const routeColor = routeColors[routeIndex % routeColors.length];

        // Process each leg of the route
        route.legs?.forEach((leg: any, legIndex: number) => {
          if (leg.legGeometry?.points) {
            const sourceId = `route-${routeIndex}-leg-${legIndex}`;
            const layerId = `route-layer-${routeIndex}-leg-${legIndex}`;

            // Decode the polyline geometry
            const routeCoordinates = decodePolyline(leg.legGeometry.points);

            // Add source
            mapRef.current?.addSource(sourceId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: routeCoordinates
                }
              }
            });

            // Add route layer
            mapRef.current?.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': routeColor,
                'line-width': 4,
                'line-opacity': 0.8
              }
            });
          }
        });

        // Add duration banner at the end of the route
        if (route.legs && route.legs.length > 0) {
          const lastLeg = route.legs[route.legs.length - 1];
          const endPoint = lastLeg.to;




          if (endPoint?.lon && endPoint?.lat && route.travel) {


            // Validate coordinates
            const isValidLng = endPoint.lon >= -180 && endPoint.lon <= 180;
            const isValidLat = endPoint.lat >= -90 && endPoint.lat <= 90;



            if (!isValidLng || !isValidLat) {
              console.error('Invalid coordinates for banner:', endPoint);
              return;
            }

            // Create duration banner element with location pin style
            const bannerEl = document.createElement('div');
            bannerEl.className = 'route-duration-banner';
            bannerEl.innerHTML = `
              <div class="pin-content">${route.travel}</div>
              <div class="pin-point"></div>
            `;
            bannerEl.style.cssText = `
              display: flex;
              flex-direction: column;
              align-items: center;
              z-index: 1;
              pointer-events: none;
            `;

            // Style the content area
            const pinContent = bannerEl.querySelector('.pin-content') as HTMLElement;
            if (pinContent) {
              pinContent.style.cssText = `
                background: ${routeColor};
                color: white;
                padding: 6px 10px;
                border-radius: 10px;
                font-weight: bold;
                font-size: 11px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                white-space: nowrap;
                min-width: 50px;
                text-align: center;
                margin-bottom: -2px;
              `;
            }

            // Style the pin point
            const pinPoint = bannerEl.querySelector('.pin-point') as HTMLElement;
            if (pinPoint) {
              pinPoint.style.cssText = `
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 12px solid ${routeColor};
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
              `;
            }



            try {
              // Debug: Log coordinates being used
              console.log('Creating marker with coordinates:', {
                lon: endPoint.lon,
                lat: endPoint.lat,
                type: typeof endPoint.lon,
                typelat: typeof endPoint.lat
              });

              // Ensure coordinates are numbers
              const markerLng = Number(endPoint.lon);
              const markerLat = Number(endPoint.lat);



              // Double check coordinates are valid numbers
              if (isNaN(markerLng) || isNaN(markerLat)) {
                console.error('Invalid coordinate numbers:', { markerLng, markerLat });
                return;
              }

              // Create marker with explicit coordinate conversion
              const marker = new mapboxgl.Marker({
                element: bannerEl,
                anchor: 'bottom'
              })
                .setLngLat([markerLng, markerLat])
                .addTo(mapRef.current!);


              markersRef.current.push(marker);

              // Debug: Check if marker is properly attached to map
              setTimeout(() => {
                const markerElement = marker.getElement();
                const computedStyle = window.getComputedStyle(markerElement);
                console.log('Marker DOM element styles:', {
                  position: computedStyle.position,
                  transform: computedStyle.transform,
                  left: computedStyle.left,
                  top: computedStyle.top,
                  zIndex: computedStyle.zIndex
                });
              }, 100);

            } catch (error) {
              console.error('Error adding marker:', error);
            }
          } else {
            console.log('Banner not created - missing data:', {
              hasEndpoint: !!endPoint,
              hasCoords: !!(endPoint?.lon && endPoint?.lat),
              hasTravel: !!route.travel,
              endPointData: endPoint
            });
          }
        }
      });

      // Fit map to show all routes
      if (routes.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();

        // Add origin to bounds
        bounds.extend([coordinates.lng, coordinates.lat]);

        routes.forEach((route: any) => {
          route.legs?.forEach((leg: any) => {
            if (leg.from?.lon && leg.from?.lat) {
              bounds.extend([leg.from.lon, leg.from.lat]);
            }
            if (leg.to?.lon && leg.to?.lat) {
              bounds.extend([leg.to.lon, leg.to.lat]);
            }
          });
        });

        if (!bounds.isEmpty()) {
          mapRef.current?.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15
          });
        }
      }



    } catch (error) {
      console.error('Error in addRoutesToMap:', error);
    }
  };

  // Update routes when they change
  useEffect(() => {


    if (!mapRef.current) {

      return;
    }

    // Function to handle route updates
    const updateRoutes = () => {


      // Clear existing routes first
      clearExistingRoutes();

      // Add new routes if they exist
      if (routes && routes.length > 0) {
        addRoutesToMap();
      }
    };

    // Check if map is loaded and update routes
    if (isMapLoadedRef.current) {

      updateRoutes();
    } else {

      // If map isn't loaded yet, wait for it
      const handleLoad = () => {

        updateRoutes();
        mapRef.current?.off('load', handleLoad);
      };

      mapRef.current?.on('load', handleLoad);
    }
    console.log(routes);

  }, [routes, coordinates]); // Depend on both routes and coordinates

  // Force resize when component mounts
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
      {/* Map container */}
      <div className="flex-1 w-full relative overflow-hidden rounded-t-lg">
        <div
          ref={mapContainerRef}
          className="absolute inset-0"
          style={{
            width: '100%',
            height: '100%'
          }}
        />

         {/* Error message overlay - positioned in top-left corner */}
         {dataError && (
          <div className="absolute top-4 left-4 z-20">
            <div className="p-3 bg-white rounded-lg shadow-lg border border-yellow-200">
              <p className="text-yellow-600 text-sm">
                ⚠️ Fixed Route data currently not available. Times are not accurate.
              </p>
            </div>
          </div>
        )}
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