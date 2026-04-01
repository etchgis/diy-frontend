import type { NormalizedApiResponse, Stop, ServiceInfo } from '../types/nysdot-stops';

/**
 * Expands normalized API response into denormalized stop objects.
 */
export function expandStops(data: NormalizedApiResponse): Stop[] {
  const { stops, _services, _routes } = data;

  function expandServiceRef(svcRef: { ref: string; headsigns_by_route?: Record<string, string[]> }): ServiceInfo | null {
    const service = _services[svcRef.ref];
    if (!service) {
      console.warn(`[expandStops] Missing service ref: ${svcRef.ref}`);
      return null;
    }

    const routes = service.routes.map((routeKey) => {
      const route = _routes[routeKey];
      if (!route) {
        console.warn(`[expandStops] Missing route ref: ${routeKey}`);
      }
      return route;
    }).filter(Boolean);

    return {
      service_guid: service.service_guid,
      organization_guid: service.organization_guid,
      agency_name: service.agency_name,
      routes,
      headsigns_by_route: svcRef.headsigns_by_route,
    };
  }

  return stops.map(stop => ({
    ...stop,
    services: stop.services.map(expandServiceRef).filter((s): s is ServiceInfo => s !== null),
    complex_stops: stop.complex_stops?.map((cs) => ({
      ...cs,
      services: cs.services.map(expandServiceRef).filter((s): s is ServiceInfo => s !== null),
    })),
  }));
}
