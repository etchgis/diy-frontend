/**
 * Process route patterns to extract all unique stops and select the best pattern for route line
 */
export function processRoutePatterns(patterns: any[]) {
  if (!patterns || patterns.length === 0) {
    return null;
  }

  // Collect all unique stops from all patterns
  const allStops = new Map();
  let longestPattern = patterns[0];
  let maxStopCount = 0;

  patterns.forEach((pattern: any) => {
    // Track pattern with most stops for route line
    const stopCount = pattern.stops ? pattern.stops.length : 0;
    if (stopCount > maxStopCount) {
      maxStopCount = stopCount;
      longestPattern = pattern;
    }

    // Add stops from this pattern
    if (pattern.stops) {
      pattern.stops.forEach((stop: any) => {
        const stopId = stop.stopId || stop.id;
        if (!allStops.has(stopId)) {
          allStops.set(stopId, {
            id: stopId,
            stopId: stopId,
            name: stop.name || stop.stopName,
            stopName: stop.name || stop.stopName,
            coordinates: stop.coordinates || [stop.lon, stop.lat],
            lon: stop.lon || (stop.coordinates ? stop.coordinates[0] : undefined),
            lat: stop.lat || (stop.coordinates ? stop.coordinates[1] : undefined),
          });
        }
      });
    }
  });

  return {
    stops: Array.from(allStops.values()),
    coordinates: longestPattern.coordinates || [],
  };
}

/**
 * Format timetable data from API response
 */
export function formatTimetableData(timetableData: any) {
  if (!timetableData || !timetableData.stops) {
    return [];
  }

  return timetableData.stops.map((stop: any) => ({
    trip_id: 'timetable',
    stops: [{
      stopId: stop.stopId,
      stop_id: stop.stopId,
      stopName: stop.stopName,
      stop_name: stop.stopName,
      stop_lat: stop.stopLat,
      stop_lon: stop.stopLon,
      arrival_time: null,
      departure_time: null,
      stop_sequence: 0,
      departures: stop.departures,
    }],
  }));
}
