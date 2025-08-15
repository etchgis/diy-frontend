// Types for route timetable API
interface RouteTimetableResponse {
  route: {
    id: string;
    shortName: string;
    longName: string;
    color: string;
    textColor: string;
  };
  stops: StopTimetable[];
  direction?: string;
}

interface StopTimetable {
  stopId: string;
  stopName: string;
  stopLat: number;
  stopLon: number;
  departures: StopDeparture[];
}

interface StopDeparture {
  tripId: string;
  headsign: string;
  departTime: number;
  arriveTime: number;
  realtime: boolean;
  patternId: string;
}

interface RoutePattern {
  id: string;
  headsign: string;
  direction: number;
  stops: string[] | number; // Array of stop IDs or count
  coordinates: Array<[number, number]>; // [lon, lat] pairs for map display
}

interface RouteData {
  id: string;
  type: string;
  shortName: string;
  longName: string;
  service: string;
  color: string;
  textColor: string;
  patterns: RoutePattern[];
}

interface PatternDetails {
  id: string;
  color: string;
  textColor: string;
  headsign: string;
  direction: number;
  stops: Array<{
    id: string;
    name: string;
    lat: number;
    lon: number;
  }>;
  coordinates: Array<[number, number]>;
  stopTimes?: any;
  vehicles?: any[];
}

/**
 * Fetches all routes for an organization with optional geometry and stops
 * @param organizationId - Organization GUID
 * @param serviceIds - Optional array of service IDs to filter by
 * @param includeGeometry - Whether to include route geometry (default: true)
 * @param includeStops - Whether to include stop details (default: true)
 * @returns Promise with array of route data
 */
export async function fetchRouteData(
  organizationId: string,
  serviceIds?: string[],
  includeGeometry: boolean = true,
  includeStops: boolean = true
): Promise<RouteData[]> {
  try {
    let url = `https://api-stage.etch.app/skids/feed/routes?geometry=${includeGeometry}&stops=${includeStops}&nysdot=true`;

    if (serviceIds && serviceIds.length > 0) {
      url += `&serviceIds=${serviceIds.join(',')}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': organizationId,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! Status: ${response.status}, StatusText: ${response.statusText}, Response Body: ${errorBody}`
      );
    }

    const data = await response.json();
    return data.routes || [];
  } catch (error: any) {
    console.error('Error fetching route data:', error.message || error);
    throw error;
  }
}

/**
 * Fetches detailed pattern data for a specific route pattern
 * @param serviceId - Service ID
 * @param patternId - Pattern ID (format: routeId:patternIndex)
 * @param organizationId - Organization GUID
 * @param timestamp - Optional timestamp for stop times (defaults to current time)
 * @returns Promise with pattern details including stops and geometry
 */
export async function fetchPatternDetails(
  serviceId: string,
  patternId: string,
  organizationId: string,
  timestamp?: number
): Promise<PatternDetails | null> {
  try {
    let url = `https://api-stage.etch.app/skids/feed/${serviceId}/patterns/${patternId}`;

    if (timestamp) {
      url += `?timestamp=${timestamp}&nysdot=true`;
    } else {
      url += `?timestamp=${Date.now()}&nysdot=true`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': organizationId,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch pattern details for ID: ${patternId}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching pattern details:', error.message || error);
    return null;
  }
}

/**
 * Fetches route data for a specific route by searching for it
 * @param routeName - Route short name or long name to search for
 * @param organizationId - Organization GUID
 * @param serviceIds - Optional service IDs to filter by
 * @returns Promise with matching route data including geometry
 */
export async function fetchSpecificRoute(
  routeName: string,
  organizationId: string,
  serviceIds?: string[]
): Promise<RouteData | null> {
  try {
    const routes = await fetchRouteData(organizationId, serviceIds, true, true);

    // Find the route by short name or long name (case insensitive)
    const matchingRoute = routes.find(route =>
      route.shortName?.toLowerCase() === routeName.toLowerCase() ||
      route.longName?.toLowerCase().includes(routeName.toLowerCase())
    );

    return matchingRoute || null;
  } catch (error) {
    console.error('Error fetching specific route:', error);
    return null;
  }
}

/**
 * Helper function to get all coordinates for a route (combines all patterns)
 * @param route - Route data object
 * @returns Combined array of coordinates from all patterns
 */
export function getAllRouteCoordinates(route: RouteData): Array<[number, number]> {
  const allCoordinates: Array<[number, number]> = [];

  route.patterns.forEach(pattern => {
    if (pattern.coordinates && Array.isArray(pattern.coordinates)) {
      allCoordinates.push(...pattern.coordinates);
    }
  });

  return allCoordinates;
}

/**
 * Helper function to get all stops for a route (combines all patterns)
 * @param route - Route data object
 * @returns Array of unique stop IDs
 */
export function getAllRouteStops(route: RouteData): string[] {
  const allStops = new Set<string>();

  route.patterns.forEach(pattern => {
    if (Array.isArray(pattern.stops)) {
      pattern.stops.forEach(stopId => allStops.add(stopId));
    }
  });

  return Array.from(allStops);
}

/**
 * Helper function to format route color for CSS
 * @param color - Hex color string from API
 * @returns Formatted color string with # prefix
 */
export function formatRouteColor(color: string): string {
  if (!color) {return '#0074D9';}
  return color.startsWith('#') ? color : `#${color}`;
}

/**
 * Helper function to format text color for CSS
 * @param textColor - Hex color string from API
 * @returns Formatted color string with # prefix
 */
export function formatTextColor(textColor: string): string {
  if (!textColor) {return '#FFFFFF';}
  return textColor.startsWith('#') ? textColor : `#${textColor}`;
}

/**
 * Fetches a comprehensive timetable for a route within a time range
 * @param organizationId - Organization GUID
 * @param serviceId - Service ID
 * @param routeId - Route ID
 * @param startTime - Start time in JavaScript milliseconds
 * @param endTime - End time in JavaScript milliseconds
 * @param direction - Optional direction filter (0 = Outbound, 1 = Inbound)
 * @returns Promise with route timetable organized by stops with departure times
 */
export async function fetchRouteTimetable(
  organizationId: string,
  serviceId: string,
  routeId: string,
  startTime: number,
  endTime: number,
  direction?: number
): Promise<RouteTimetableResponse> {
  try {
    // Validate time parameters
    if (!startTime || !endTime || startTime >= endTime) {
      throw new Error('Invalid time range: startTime must be less than endTime');
    }

    // Build URL with query parameters
    let url = `https://api-stage.etch.app/skids/feed/${serviceId}/routes/${routeId}/timetable?` +
      `startTime=${startTime}&endTime=${endTime}&nysdot=true`;

    if (direction !== undefined) {
      url += `&direction=${direction}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': organizationId,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! Status: ${response.status}, StatusText: ${response.statusText}, Response Body: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching route timetable:', error.message || error);
    throw error;
  }
}

/**
 * Helper function to group timetable departures by pattern
 * Useful for distinguishing between different service patterns (e.g., express vs local)
 * @param timetable - Route timetable response
 * @returns Departures grouped by pattern ID
 */
export function groupDeparturesByPattern(
  timetable: RouteTimetableResponse
): Map<string, StopDeparture[]> {
  const patternGroups = new Map<string, StopDeparture[]>();

  timetable.stops.forEach(stop => {
    stop.departures.forEach(departure => {
      if (!patternGroups.has(departure.patternId)) {
        patternGroups.set(departure.patternId, []);
      }
      patternGroups.get(departure.patternId)!.push(departure);
    });
  });

  // Sort departures within each pattern
  patternGroups.forEach(departures => {
    departures.sort((a, b) => a.departTime - b.departTime);
  });

  return patternGroups;
}

/**
 * Helper function to get next departures from a specific stop
 * @param timetable - Route timetable response
 * @param stopId - Stop ID to filter by
 * @param currentTime - Current time in milliseconds (defaults to now)
 * @param limit - Maximum number of departures to return
 * @returns Next departures from the specified stop
 */
export function getNextDeparturesFromStop(
  timetable: RouteTimetableResponse,
  stopId: string,
  currentTime: number = Date.now(),
  limit: number = 5
): StopDeparture[] {
  const stop = timetable.stops.find(s => s.stopId === stopId);

  if (!stop) {
    return [];
  }

  return stop.departures
    .filter(dep => dep.departTime >= currentTime)
    .slice(0, limit);
}

/**
 * Helper function to format departure time for display
 * @param departureTime - Departure time in milliseconds
 * @param currentTime - Current time in milliseconds
 * @returns Formatted string (e.g., "2 min", "10:30 AM")
 */
export function formatDepartureTime(
  departureTime: number,
  currentTime: number = Date.now()
): string {
  const diffMs = departureTime - currentTime;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 0) {
    return 'Departed';
  } else if (diffMinutes === 0) {
    return 'Now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  } else {
    // Show actual time for departures more than an hour away
    const date = new Date(departureTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }
}

/**
 * Helper function to filter timetable for real-time updates only
 * @param timetable - Route timetable response
 * @returns Timetable with only real-time updated departures
 */
export function filterRealtimeDepartures(
  timetable: RouteTimetableResponse
): RouteTimetableResponse {
  return {
    ...timetable,
    stops: timetable.stops.map(stop => ({
      ...stop,
      departures: stop.departures.filter(dep => dep.realtime),
    })).filter(stop => stop.departures.length > 0),
  };
}
