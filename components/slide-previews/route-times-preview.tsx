import { useRouteTimesStore } from '@/stores/routeTimes';
import { useEffect, useState, useRef } from 'react';
import { formatDepartureTime } from '@/services/data-gathering/fetchRouteData';
import { formatTime12Hour } from '@/utils/timeFormatters';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { renderRouteOnMap, calculateStopBounds, calculateZoomFromBounds } from '@/services/map/renderRouteOnMap';
import type { RouteDataItem, TripData, StopInfo, Departure, StopWithDepartures, PatternStop } from '@/types/route-times';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY;

export default function RouteTimesPreview({ slideId }: { slideId: string }) {
  const slideData = useRouteTimesStore((state) => state.slides[slideId]);

  const backgroundColor = slideData?.backgroundColor || '#192F51';
  const titleColor = slideData?.titleColor || '#FFFFFF';
  const tableColor = slideData?.tableColor || '#FFFFFF';
  const tableTextColor = slideData?.tableTextColor || '#000000';
  const bgImage = slideData?.bgImage || '';
  const logoImage = slideData?.logoImage || '';
  const routeName = slideData?.routeName || '';
  const description = slideData?.description || '';
  const selectedRoute = slideData?.selectedRoute;
  const viewMode = slideData?.viewMode || 'map';
  const routeData: any = slideData?.routeData || [];
  const patternData = slideData?.patternData;
  const isLoading = slideData?.isLoading || false;
  const isShowingNextDay = slideData?.isShowingNextDay || false;
  const isShowingLaterToday = slideData?.isShowingLaterToday || false;

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapIdRef = useRef<string>(`map-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Initialize map when in map view
  useEffect(() => {
    setMapLoaded(false);

    if (viewMode !== 'map') {
      // Clean up map when switching away from map view
      if (mapRef.current) {
        try {
          markersRef.current.forEach(marker => marker.remove());
          markersRef.current = [];
          mapRef.current.remove();
          mapRef.current = null;
        } catch (e) {
          console.error('Error cleaning up map:', e);
          mapRef.current = null;
        }
      }
      return;
    }

    // Wait for container to be available
    if (!mapContainer) {
      return;
    }

    // Clean up any existing map
    if (mapRef.current) {
      try {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        mapRef.current.remove();
      } catch (e) {
        console.error('Error removing existing map:', e);
      }
      mapRef.current = null;
    }

    // Calculate initial center from pattern data if available
    let initialCenter: [number, number] = [-73.7562, 42.6526]; // Default to Albany
    let initialZoom = 12;

    if (patternData?.stops && patternData.stops.length > 0) {
      const bounds = calculateStopBounds(patternData.stops);
      if (bounds) {
        const center = bounds.getCenter();
        initialCenter = [center.lng, center.lat];
        initialZoom = calculateZoomFromBounds(bounds);
      }
    }

    try {
      // Create new map
      const map = new mapboxgl.Map({
        container: mapContainer,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
      });

      // Store reference
      mapRef.current = map;

      // Disable interactions for preview
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.dragRotate.disable();
      map.keyboard.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();

      // Force a resize and mark as loaded after map loads
      map.once('load', () => {
        map.resize();
        setMapLoaded(true);

        // Add route and stops data if available
        if (patternData) {
          const newMarkers = renderRouteOnMap({
            map,
            patternData,
            selectedRoute,
            markers: markersRef.current,
          });
          markersRef.current = newMarkers;
        }
      });
    } catch (e) {
      console.error('Error creating map:', e);
    }

    return () => {
      setMapLoaded(false);
      if (mapRef.current) {
        try {
          markersRef.current.forEach(marker => marker.remove());
          markersRef.current = [];
          mapRef.current.remove();
          mapRef.current = null;
        } catch (e) {
          console.error('Error in cleanup:', e);
          mapRef.current = null;
        }
      }
    };
  }, [viewMode, slideId, mapContainer, patternData, selectedRoute]);

  // Update map with pattern data changes
  useEffect(() => {
    if (!mapRef.current || viewMode !== 'map' || !patternData) {return;}

    const updateMapData = () => {
      if (!mapRef.current) {return;}

      // Render route and stops
      const newMarkers = renderRouteOnMap({
        map: mapRef.current,
        patternData,
        selectedRoute,
        markers: markersRef.current,
      });
      markersRef.current = newMarkers;

      // Update bounds if we have stops
      if (patternData.stops && patternData.stops.length > 0) {
        const bounds = calculateStopBounds(patternData.stops);
        if (bounds) {
          mapRef.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15,
          });
        }
      }
    };

    // Wait for map to be loaded before updating
    if (mapRef.current.loaded()) {
      updateMapData();
    } else {
      mapRef.current.once('load', updateMapData);
    }
  }, [patternData, selectedRoute, viewMode]);


  // Get unique trips for timetable view
  const getUniqueTrips = (): TripData[] => {
    if (!routeData || routeData.length === 0) {return [];}

    const tripsMap = new Map<string, TripData>();

    // Process timetable data format (from fetchRouteTimetable)
    (routeData as RouteDataItem[]).forEach(item => {
      // Check if this is timetable format with stops array containing departures
      if (item.stops && item.stops[0] && 'departures' in item.stops[0]) {
        const stop = item.stops[0] as StopWithDepartures;
        const stopId = stop.stopId || stop.stop_id;

        stop.departures?.forEach((dep: Departure) => {
          if (!tripsMap.has(dep.tripId)) {
            tripsMap.set(dep.tripId, {
              tripId: dep.tripId,
              headsign: dep.headsign,
              stops: new Map(),
            });
          }
          const tripData = tripsMap.get(dep.tripId);
          if (tripData) {
            tripData.stops.set(stopId, dep);
          }
        });
      }
    });

    // Sort trips by first departure time
    const trips = Array.from(tripsMap.values());
    trips.sort((a, b) => {
      const aFirstDep = Array.from(a.stops.values())[0] as Departure | undefined;
      const bFirstDep = Array.from(b.stops.values())[0] as Departure | undefined;
      return (aFirstDep?.departTime || 0) - (bFirstDep?.departTime || 0);
    });

    // If no upcoming trips, show all trips (they'll be for tomorrow)
    const upcomingTrips = trips.filter(trip => {
      const firstDep = Array.from(trip.stops.values())[0] as Departure | undefined;
      return firstDep && firstDep.departTime >= currentTime;
    });

    // Return upcoming trips if available, otherwise return all trips (next day's schedule)
    return upcomingTrips.length > 0 ? upcomingTrips : trips;
  };

  // Get all stops for timetable columns
  const getAllStops = (): StopInfo[] => {
    // First try patternData stops
    if (patternData?.stops && patternData.stops.length > 0) {
      return patternData.stops.map((stop: PatternStop) => ({
        id: stop.stopId || stop.id || '',
        name: stop.name || stop.stopName || '',
      }));
    }

    // Fall back to routeData if available
    if (routeData && routeData.length > 0) {
      return (routeData as RouteDataItem[]).map((item) => {
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

    return (
      <div className="flex h-full">
        {/* Left Panel - Stop Times */}
        <div className="w-[30%] border-r border-gray-200 overflow-y-auto" style={{ backgroundColor: tableColor }}>
          <div className="p-4">
            <h3 className="font-semibold mb-3" style={{ color: tableTextColor }}>Stop Times</h3>
            <div className="space-y-3">
              {stops.map((stop: PatternStop, index: number) => {
                // Find departures for this stop - check both stop.id and stop.stopId
                const stopId = stop.stopId || stop.id;
                const stopData = (routeData as RouteDataItem[]).find(rd => {
                  const firstStop = rd.stops[0];
                  return firstStop && (
                    firstStop.stop_id === stopId ||
                    ('stopId' in firstStop && (firstStop as StopWithDepartures).stopId === stopId)
                  );
                });

                const stopDepartures = stopData?.stops[0] && 'departures' in stopData.stops[0]
                  ? (stopData.stops[0] as StopWithDepartures).departures
                  : [];

                // Get next 4 upcoming departures
                const upcomingDepartures = stopDepartures
                  .filter((dep: Departure) => dep.departTime >= currentTime)
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
                            {upcomingDepartures.map((dep: Departure, depIndex: number) => (
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
        <div className="flex-1 relative" style={{ minHeight: '400px' }}>
          <div
            ref={setMapContainer}
            id={mapIdRef.current}
            className="absolute inset-0"
            style={{
              width: '100%',
              height: '100%',
              visibility: mapLoaded ? 'visible' : 'hidden',
            }}
          />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mx-auto mb-2" />
                <p className="text-gray-500">Loading map...</p>
              </div>
            </div>
          )}
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

    // Check if there are no trips at all
    const hasNoTrips = trips.length === 0;

    return (
      <div className="h-full overflow-auto p-4" style={{ backgroundColor: tableColor }}>
        {(isShowingNextDay || isShowingLaterToday) && (
          <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm font-medium">
              {isShowingLaterToday
                ? '🌙 Showing schedule for later today'
                : '📅 Showing tomorrow\'s schedule - no more departures today'}
            </p>
          </div>
        )}

        {hasNoTrips ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2" style={{ color: tableTextColor }}>
                No Schedule Available
              </p>
              <p className="text-sm opacity-75" style={{ color: tableTextColor }}>
                No departure times are currently available for this route.
              </p>
            </div>
          </div>
        ) : (
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
                  {displayStops.map((stop: StopInfo) => (
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
                {trips.slice(0, 10).map((trip: TripData, tripIndex: number) => (
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
                    {displayStops.map((stop: StopInfo) => {
                      const departure = trip.stops.get(stop.id);
                      return (
                        <td
                          key={stop.id || `stop-${stop.name}`}
                          className="text-center p-3 border-b"
                          style={{ color: tableTextColor }}
                        >
                          {departure ? formatTime12Hour(departure.departTime) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {stops.length > 5 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Showing first 5 stops only. Timetable view works best with fewer stops.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="h-full flex flex-col relative"
      style={{
        backgroundColor: !bgImage ? backgroundColor : undefined,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >

      {/* Header */}
      <div className="p-4 relative z-10">
        {logoImage && (
          <img
            src={logoImage}
            alt="Logo"
            className="absolute top-4 right-4 max-h-12 object-contain"
          />
        )}

        <h1 className="text-2xl font-bold pr-20" style={{ color: titleColor }}>
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
