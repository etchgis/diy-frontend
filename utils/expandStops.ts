import type {
  ApiResponse,
  Stop,
  ServiceAtStop,
  LinkedStop,
  ServiceRef,
  RouteRef,
  ExpandedStop,
  ExpandedService,
  ExpandedRoute,
  ExpandedLinkedStop,
} from '../types/nysdot-stops';

/**
 * Expands normalized API response into denormalized stop objects.
 * Attaches full service and route details from refs lookup tables.
 */
export function expandStops(data: ApiResponse): ExpandedStop[] {
  const { stops, refs } = data;

  /**
   * Expands a ServiceAtStop by looking up service details and route details from refs
   */
  function expandService(serviceAtStop: ServiceAtStop): ExpandedService {
    const serviceRef: ServiceRef | undefined = refs.services[serviceAtStop.serviceId];

    if (!serviceRef) {
      console.warn(`[expandStops] Missing service ref: ${serviceAtStop.serviceId}`);
    }

    // Expand each route with full details
    const expandedRoutes: ExpandedRoute[] = serviceAtStop.routes.map((routeAtStop) => {
      // Route key format: serviceId:routeId
      const routeKey = `${serviceAtStop.serviceId}:${routeAtStop.routeId}`;
      const routeRef: RouteRef | undefined = refs.routes[routeKey];

      if (routeRef) {
        return {
          id: routeRef.id,
          shortName: routeRef.shortName,
          longName: routeRef.longName,
          color: routeRef.color,
          textColor: routeRef.textColor,
          headsigns: routeAtStop.headsigns,
        };
      }

      // Fallback: create minimal route object if lookup fails
      console.warn(`[expandStops] Missing route in refs.routes: ${routeKey}, creating fallback`);
      const shortName = routeAtStop.routeId.split('-')[0];
      return {
        id: routeAtStop.routeId,
        shortName,
        headsigns: routeAtStop.headsigns,
      };
    });

    return {
      id: serviceAtStop.serviceId,
      organizationId: serviceRef?.organizationId ?? '',
      agencyName: serviceRef?.agencyName ?? 'Unknown Agency',
      routes: expandedRoutes,
    };
  }

  /**
   * Expands a LinkedStop by expanding its services
   */
  function expandLinkedStop(linkedStop: LinkedStop): ExpandedLinkedStop {
    return {
      id: linkedStop.id,
      name: linkedStop.name,
      services: linkedStop.services.map(expandService),
    };
  }

  /**
   * Expands a Stop by expanding its services and linked stops
   */
  function expandStop(stop: Stop): ExpandedStop {
    return {
      id: stop.id,
      name: stop.name,
      lat: stop.lat,
      lon: stop.lon,
      locationType: stop.locationType,
      services: stop.services.map(expandService),
      linkedStops: stop.linkedStops?.map(expandLinkedStop),
    };
  }

  return stops.map(expandStop);
}
