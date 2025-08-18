import { useRouteTimesStore } from '@/stores/routeTimes';
import { useEffect, useState, useRef } from 'react';
import { formatDepartureTime } from '@/services/data-gathering/fetchRouteData';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY;

export default function RouteTimesPreview({ slideId }: { slideId: string }) {
  const slideData = useRouteTimesStore((state) => state.slides[slideId]);

  const backgroundColor = slideData?.backgroundColor || '#192F51';
  const titleColor = slideData?.titleColor || '#FFFFFF';
  const tableColor = slideData?.tableColor || '#FFFFFF';
  const tableTextColor = slideData?.tableTextColor || '#000000';
  const bgImage = slideData?.bgImage || '';
  const routeName = slideData?.routeName || '';
  const description = slideData?.description || '';
  const selectedRoute = slideData?.selectedRoute;
  const viewMode = slideData?.viewMode || 'map';
  const routeData = slideData?.routeData || [];
  const patternData = slideData?.patternData;
  const isLoading = slideData?.isLoading || false;

  const [currentTime, setCurrentTime] = useState(Date.now());
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Initialize map when in map view
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current || mapRef.current) {return;}

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-73.7562, 42.6526], // Default to Albany, NY
      zoom: 12,
      attributionControl: false,
    });

    // Disable interactions for preview
    mapRef.current.dragPan.disable();
    mapRef.current.scrollZoom.disable();
    mapRef.current.boxZoom.disable();
    mapRef.current.dragRotate.disable();
    mapRef.current.keyboard.disable();
    mapRef.current.doubleClickZoom.disable();
    mapRef.current.touchZoomRotate.disable();

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [viewMode]);

  // Update map with route data
  useEffect(() => {
    if (!mapRef.current || viewMode !== 'map' || !patternData) {return;}

    const updateMap = () => {
      if (!mapRef.current) {return;}

      // Clear existing markers and layers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Remove existing route layer if it exists
      if (mapRef.current.getLayer('route-line')) {
        mapRef.current.removeLayer('route-line');
      }
      if (mapRef.current.getSource('route')) {
        mapRef.current.removeSource('route');
      }

      // Add route line if we have coordinates
      if (patternData.coordinates && patternData.coordinates.length > 0) {
        mapRef.current.addSource('route', {
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

      mapRef.current.addLayer({
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
      const bounds = new mapboxgl.LngLatBounds();

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
        `;
        markerEl.textContent = (index + 1).toString();

        const marker = new mapboxgl.Marker({
          element: markerEl,
          anchor: 'center',
        })
          .setLngLat([lon, lat])
          .addTo(mapRef.current);

        markersRef.current.push(marker);
        bounds.extend([lon, lat]);
      });

      // Fit map to show all stops
      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
        });
      }
    }
    };

    // Check if map is loaded, if not wait for it
    if (mapRef.current.isStyleLoaded()) {
      updateMap();
    } else {
      mapRef.current.once('load', updateMap);
    }
  }, [viewMode, patternData, selectedRoute]);

  // Helper function to format time for timetable view
  const formatTimetableTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Get unique trips for timetable view
  const getUniqueTrips = () => {
    if (!routeData || routeData.length === 0) {return [];}

    const tripsMap = new Map();

    // Process timetable data format (from fetchRouteTimetable)
    routeData.forEach(item => {
      // Check if this is timetable format with stops array containing departures
      if (item.stops && item.stops[0]?.departures) {
        const stop = item.stops[0];
        const stopId = stop.stopId || stop.stop_id;

        stop.departures.forEach((dep: any) => {
          if (!tripsMap.has(dep.tripId)) {
            tripsMap.set(dep.tripId, {
              tripId: dep.tripId,
              headsign: dep.headsign,
              stops: new Map(),
            });
          }
          tripsMap.get(dep.tripId).stops.set(stopId, dep);
        });
      }
    });

    // Sort trips by first departure time
    const trips = Array.from(tripsMap.values());
    trips.sort((a, b) => {
      const aFirstDep = Array.from(a.stops.values())[0];
      const bFirstDep = Array.from(b.stops.values())[0];
      return (aFirstDep?.departTime || 0) - (bFirstDep?.departTime || 0);
    });

    return trips;
  };

  // Get all stops for timetable columns
  const getAllStops = () => {
    // First try patternData stops
    if (patternData?.stops && patternData.stops.length > 0) {
      return patternData.stops.map((stop: any) => ({
        id: stop.stopId || stop.id,
        name: stop.name || stop.stopName,
      }));
    }

    // Fall back to routeData if available
    if (routeData && routeData.length > 0) {
      return routeData.map((item: any) => {
        const stop = item.stops?.[0];
        return {
          id: stop?.stopId || stop?.stop_id || '',
          name: stop?.stopName || stop?.stop_name || '',
        };
      });
    }

    return [];
  };

  const renderMapView = () => {
    const stops = patternData?.stops || [];
    const departures = routeData[0]?.stops[0]?.departures || [];

    return (
      <div className="flex h-full">
        {/* Left Panel - Stop Times */}
        <div className="w-[30%] border-r border-gray-200 overflow-y-auto" style={{ backgroundColor: tableColor }}>
          <div className="p-4">
            <h3 className="font-semibold mb-3" style={{ color: tableTextColor }}>Stop Times</h3>
            <div className="space-y-3">
              {stops.map((stop: any, index: number) => {
                // Find departures for this stop - check both stop.id and stop.stopId
                const stopId = stop.stopId || stop.id;
                const stopDepartures = routeData.find(rd =>
                  rd.stops[0]?.stop_id === stopId || rd.stops[0]?.stopId === stopId
                )?.stops[0]?.departures || [];

                // Get next 4 upcoming departures
                const upcomingDepartures = stopDepartures
                  .filter((dep: any) => dep.departTime >= currentTime)
                  .slice(0, 4);

                return (
                  <div key={stopId || `stop-${index}`} className="border-b border-gray-100 pb-3">
                    <div className="flex items-start gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          backgroundColor: selectedRoute?.route_color ? `#${selectedRoute.route_color}` : '#0074D9',
                          color: selectedRoute?.route_text_color ? `#${selectedRoute.route_text_color}` : '#FFFFFF',
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1" style={{ color: tableTextColor }}>
                          {stop.name}
                        </div>
                        {upcomingDepartures.length > 0 ? (
                          <div className="flex flex-wrap gap-x-2 gap-y-1">
                            {upcomingDepartures.map((dep: any, depIndex: number) => (
                              <div
                                key={`${dep.tripId}-${depIndex}`}
                                className="text-xs"
                                style={{
                                  color: tableTextColor,
                                  opacity: depIndex === 0 ? 1 : 0.7,
                                }}
                              >
                                <span className={depIndex === 0 ? 'font-semibold' : ''}>
                                  {formatDepartureTime(dep.departTime, currentTime)}
                                </span>
                                {dep.realtime && depIndex === 0 && (
                                  <span className="ml-1 text-green-600">●</span>
                                )}
                                {depIndex < upcomingDepartures.length - 1 && (
                                  <span className="mx-1">•</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs" style={{ color: tableTextColor, opacity: 0.5 }}>
                            No upcoming departures
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 relative">
          <div
            ref={mapContainerRef}
            className="absolute inset-0"
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      </div>
    );
  };

  const renderTimetableView = () => {
    const stops = getAllStops();
    const trips = getUniqueTrips();

    // Limit to first 5 stops for display
    const displayStops = stops.slice(0, 5);

    // Check if there are different headsigns
    const uniqueHeadsigns = new Set(trips.map(trip => trip.headsign));
    const showTripColumn = uniqueHeadsigns.size > 1;

    return (
      <div className="h-full overflow-auto p-4" style={{ backgroundColor: tableColor }}>
        <div className="min-w-max">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {showTripColumn && (
                  <th
                    className="text-left p-3 border-b-2 font-semibold"
                    style={{ color: tableTextColor, borderColor: tableTextColor }}
                  >
                    Trip
                  </th>
                )}
                {displayStops.map((stop: any) => (
                  <th
                    key={stop.id}
                    className="text-center p-3 border-b-2 font-semibold"
                    style={{ color: tableTextColor, borderColor: tableTextColor }}
                  >
                    {stop.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trips.slice(0, 10).map((trip: any, tripIndex: number) => (
                <tr key={trip.tripId} className={tripIndex % 2 === 0 ? 'bg-gray-50' : ''}>
                  {showTripColumn && (
                    <td
                      className="p-3 border-b font-medium"
                      style={{ color: tableTextColor }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-1 text-xs font-bold rounded"
                          style={{
                            backgroundColor: selectedRoute?.route_color ? `#${selectedRoute.route_color}` : '#0074D9',
                            color: selectedRoute?.route_text_color ? `#${selectedRoute.route_text_color}` : '#FFFFFF',
                          }}
                        >
                          {selectedRoute?.route_short_name || 'Route'}
                        </span>
                        <span className="text-sm">{trip.headsign}</span>
                      </div>
                    </td>
                  )}
                  {displayStops.map((stop: any) => {
                    const departure = trip.stops.get(stop.id);
                    return (
                      <td
                        key={stop.id || `stop-${stop.name}`}
                        className="text-center p-3 border-b"
                        style={{ color: tableTextColor }}
                      >
                        {departure ? formatTimetableTime(departure.departTime) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stops.length > 5 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              ⚠️ Showing first 5 stops only. Timetable view works best with fewer stops.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="h-full flex flex-col relative"
      style={{ backgroundColor }}
    >
      {bgImage && (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Header */}
      <div className="p-4 relative z-10">
        <h1 className="text-2xl font-bold" style={{ color: titleColor }}>
          {selectedRoute ? (
            <>
              {selectedRoute.route_short_name && (
                <span
                  className="inline-block px-3 py-1 mr-3 rounded"
                  style={{
                    backgroundColor: selectedRoute.route_color ? `#${selectedRoute.route_color}` : '#0074D9',
                    color: selectedRoute.route_text_color ? `#${selectedRoute.route_text_color}` : '#FFFFFF',
                  }}
                >
                  {selectedRoute.route_short_name}
                </span>
              )}
              {selectedRoute.route_long_name || routeName}
            </>
          ) : (
            routeName || 'Select a Route'
          )}
        </h1>
        {description && (
          <p className="mt-2 text-sm" style={{ color: titleColor, opacity: 0.9 }}>
            {description}
          </p>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 relative z-10 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto mb-4" />
              <p style={{ color: titleColor }}>Loading route data...</p>
            </div>
          </div>
        ) : selectedRoute ? (
          viewMode === 'map' ? renderMapView() : renderTimetableView()
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Please select a route to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
