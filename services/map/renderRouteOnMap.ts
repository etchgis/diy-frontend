import mapboxgl from 'mapbox-gl';

export interface RouteMapOptions {
  map: mapboxgl.Map;
  patternData: {
    coordinates?: number[][];
    stops?: Array<{
      id?: string;
      stopId?: string;
      name?: string;
      stopName?: string;
      coordinates?: number[];
      lon?: number;
      lat?: number;
    }>;
  };
  selectedRoute?: {
    route_color?: string;
    route_text_color?: string;
  };
  markers?: mapboxgl.Marker[];
}

/**
 * Renders a route line and stop markers on a Mapbox map
 * Returns an array of markers that were added
 */
export function renderRouteOnMap({
  map,
  patternData,
  selectedRoute,
  markers = [],
}: RouteMapOptions): mapboxgl.Marker[] {
  // Clear existing markers
  markers.forEach(marker => marker.remove());
  const newMarkers: mapboxgl.Marker[] = [];

  // Remove existing route layer if it exists
  if (map.getLayer('route-line')) {
    map.removeLayer('route-line');
  }
  if (map.getSource('route')) {
    map.removeSource('route');
  }

  // Add route line if we have coordinates
  if (patternData.coordinates && patternData.coordinates.length > 0) {
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: patternData.coordinates,
        },
      },
    });

    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': selectedRoute?.route_color ? `#${selectedRoute.route_color}` : '#0074D9',
        'line-width': 4,
        'line-opacity': 0.8,
      },
    });
  }

  // Add stop markers
  if (patternData.stops && patternData.stops.length > 0) {
    patternData.stops.forEach((stop: any, index: number) => {
      // Check for coordinates in different formats
      let lon, lat;
      if (stop.coordinates && stop.coordinates.length === 2) {
        [lon, lat] = stop.coordinates;
      } else if (stop.lon !== undefined && stop.lat !== undefined) {
        lon = stop.lon;
        lat = stop.lat;
      } else {
        return; // Skip this stop if no valid coordinates
      }

      // Create marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'route-stop-marker';
      markerEl.style.cssText = `
        width: 24px;
        height: 24px;
        background: ${selectedRoute?.route_color ? `#${selectedRoute.route_color}` : '#0074D9'};
        color: ${selectedRoute?.route_text_color ? `#${selectedRoute.route_text_color}` : '#FFFFFF'};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        z-index: 10;
      `;
      markerEl.textContent = (index + 1).toString();

      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'center',
      })
        .setLngLat([lon, lat])
        .addTo(map);

      newMarkers.push(marker);
    });
  }

  return newMarkers;
}

/**
 * Calculate bounds for a set of stops
 */
export function calculateStopBounds(stops: any[]): mapboxgl.LngLatBounds | null {
  if (!stops || stops.length === 0) {return null;}

  const bounds = new mapboxgl.LngLatBounds();

  stops.forEach((stop: any) => {
    let lon, lat;
    if (stop.coordinates && stop.coordinates.length === 2) {
      [lon, lat] = stop.coordinates;
    } else if (stop.lon !== undefined && stop.lat !== undefined) {
      lon = stop.lon;
      lat = stop.lat;
    }

    if (lon !== undefined && lat !== undefined) {
      bounds.extend([lon, lat]);
    }
  });

  return bounds.isEmpty() ? null : bounds;
}

/**
 * Calculate appropriate zoom level based on bounds
 */
export function calculateZoomFromBounds(bounds: mapboxgl.LngLatBounds): number {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const latDiff = Math.abs(ne.lat - sw.lat);
  const lngDiff = Math.abs(ne.lng - sw.lng);
  const maxDiff = Math.max(latDiff, lngDiff);

  if (maxDiff < 0.01) {return 15;}
  else if (maxDiff < 0.05) {return 13;}
  else if (maxDiff < 0.1) {return 12;}
  else if (maxDiff < 0.5) {return 10;}
  else {return 9;}
}
