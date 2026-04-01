const NYSDOT_STOPS_URL = process.env.NEXT_PUBLIC_NYSDOT_STOPS_URL;
if (!NYSDOT_STOPS_URL) {
  throw new Error('NEXT_PUBLIC_NYSDOT_STOPS_URL environment variable is not configured');
}

interface FetchStopsOptions {
  coordinates: {lat: number, lng: number};
  radius?: number; // in meters, default 1000
  search?: string; // search term for filtering
}

function expandStops(data: { stops: any[]; _services: Record<string, any>; _routes: Record<string, any> }): any[] {
  const { stops, _services, _routes } = data;

  function expandServiceRef(svcRef: { ref: string; headsigns_by_route?: Record<string, string[]> }) {
    const service = _services[svcRef.ref];
    if (!service) {
      console.warn(`[fetchAllStops] Missing service ref: ${svcRef.ref}`);
      return null;
    }

    const routes = service.routes.map((routeKey: string) => {
      const route = _routes[routeKey];
      if (!route) {
        console.warn(`[fetchAllStops] Missing route ref: ${routeKey}`);
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
    services: stop.services.map(expandServiceRef).filter(Boolean),
    complex_stops: stop.complex_stops?.map((cs: any) => ({
      ...cs,
      services: cs.services.map(expandServiceRef).filter(Boolean),
    })),
  }));
}

export async function fetchAllStops(options: FetchStopsOptions | {lat: number, lng: number}): Promise<any> {
  try {
    // Handle both old signature (coordinates only) and new signature (options object)
    const coordinates = 'coordinates' in options ? options.coordinates : options;
    const radius = 'radius' in options ? options.radius : undefined;
    const search = 'search' in options ? options.search : undefined;

    let url = `${NYSDOT_STOPS_URL}/nearby-stops?lat=${coordinates.lat}&lon=${coordinates.lng}`;

    if (radius !== undefined) {
      url += `&radius=${radius}`;
    }

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! Status: ${response.status}, StatusText: ${response.statusText}, Response Body: ${errorBody}`
      );
    }

    const data = await response.json();
    // Normalize to array
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.stops)) return data.stops;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    console.warn('fetchAllStops: unexpected response shape', data);
    return [];
  } catch (error: any) {
    console.error('Error fetching stops:', error.message || error);
    throw error;
  }
}
