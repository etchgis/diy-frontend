/**
 * Shared utility for fetching route data consistently across components
 */

import { fetchRouteData, fetchRouteTimetable } from '../data-gathering/fetchRouteData';
import { processRoutePatterns, formatTimetableData } from '../data-gathering/processRoutePatterns';
import { calculateTimeWindow } from './timeWindowCalculator';

export interface RouteInfo {
  route_id: string;
  route_short_name?: string;
  route_long_name?: string;
  services: Array<{
    organization_guid?: string;
    organization_id?: string;
    service_guid?: string;
    service_id?: string;
  }>;
}

export interface FetchRouteDataResult {
  patternData?: any;
  timetableData: any[];
  isNextDay: boolean;
  isLaterToday: boolean;
}

/**
 * Extract organization and service IDs from a route object
 */
export function extractRouteIds(route: RouteInfo) {
  const service = route.services[0];
  const organizationId = service.organization_guid || service.organization_id || '';
  const serviceId = service.service_guid || service.service_id || '';
  return { organizationId, serviceId };
}

/**
 * Find a specific route from an array of route data
 */
export function findSpecificRoute(routeDataArray: any[], route: RouteInfo) {
  return routeDataArray.find(r =>
    r.id === route.route_id ||
    r.shortName === route.route_short_name
  );
}

/**
 * Fetch route patterns and geometry data
 */
export async function fetchRoutePatterns(
  route: RouteInfo
): Promise<any | null> {
  const { organizationId, serviceId } = extractRouteIds(route);

  const routeDataArray = await fetchRouteData(
    organizationId,
    [serviceId],
    true,
    true
  );

  const specificRoute = findSpecificRoute(routeDataArray, route);

  if (specificRoute && specificRoute.patterns && specificRoute.patterns.length > 0) {
    return processRoutePatterns(specificRoute.patterns);
  }

  return null;
}

/**
 * Fetch route timetable data with automatic next-period fallback
 */
export async function fetchRouteTimetableWithFallback(
  route: RouteInfo,
  fetchNextPeriod: boolean = false
): Promise<FetchRouteDataResult> {
  const { organizationId, serviceId } = extractRouteIds(route);
  const timeWindow = calculateTimeWindow(fetchNextPeriod);

  let timetableData = await fetchRouteTimetable(
    organizationId,
    serviceId,
    route.route_id,
    timeWindow.startTime,
    timeWindow.endTime
  );

  // If no data and we haven't tried next period yet, try it
  if (!fetchNextPeriod && (!timetableData || formatTimetableData(timetableData).length === 0)) {
    // Recursively fetch next period
    return fetchRouteTimetableWithFallback(route, true);
  }

  return {
    patternData: null,
    timetableData: timetableData ? formatTimetableData(timetableData) : [],
    isNextDay: timeWindow.isNextDay,
    isLaterToday: timeWindow.isLaterToday,
  };
}

/**
 * Complete route data fetch including patterns and timetable
 */
export async function fetchCompleteRouteData(
  route: RouteInfo,
  skipPatterns: boolean = false
): Promise<FetchRouteDataResult> {
  let patternData = null;

  if (!skipPatterns) {
    patternData = await fetchRoutePatterns(route);
  }

  const timetableResult = await fetchRouteTimetableWithFallback(route, false);

  return {
    ...timetableResult,
    patternData,
  };
}
