const NYSDOT_STOPS_URL = process.env.NEXT_PUBLIC_NYSDOT_STOPS_URL;
if (!NYSDOT_STOPS_URL) {
  throw new Error('NEXT_PUBLIC_NYSDOT_STOPS_URL environment variable is not configured');
}

interface FetchStopsOptions {
  coordinates: {lat: number, lng: number};
  radius?: number; // in meters, default 1000
  search?: string; // search term for filtering
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

    console.log('[fetchAllStops] refs:', JSON.stringify(data?.refs).slice(0, 500));

    // New format: { stops: [...], refs: { services: { [serviceId]: {...} }, ... } }
    if (Array.isArray(data?.stops)) {
      const serviceRefs: Record<string, any> = data?.refs?.services || {};

      const normalizeService = (svc: any) => {
        const ref = serviceRefs[svc.serviceId] || {};
        return {
          service_guid: svc.serviceId,
          organization_guid: ref.organizationId || ref.organization_guid || svc.serviceId,
          agency_name: ref.agencyName || ref.agency_name || '',
          routes: (svc.routes || []).map((r: any) => ({
            route_id: r.routeId || r.route_id,
            route_short_name: r.routeId || r.route_id,
            headsigns_by_route: r.headsigns,
          })),
          headsigns_by_route: svc.routes?.reduce((acc: any, r: any) => {
            acc[r.routeId || r.route_id] = r.headsigns || [];
            return acc;
          }, {}),
        };
      };

      const normalizeStop = (stop: any) => ({
        ...stop,
        stop_id: stop.id || stop.stop_id,
        stop_name: stop.name || stop.stop_name,
        stop_lat: stop.lat ?? stop.stop_lat,
        stop_lon: stop.lon ?? stop.stop_lon,
        location_type: stop.locationType ?? stop.location_type ?? 0,
        services: (stop.services || []).map(normalizeService),
        complex_stops: (stop.linkedStops || stop.complex_stops || []).map((ls: any) => ({
          ...ls,
          stop_id: ls.id || ls.stop_id,
          stop_name: ls.name || ls.stop_name,
          stop_lat: ls.lat ?? ls.stop_lat,
          stop_lon: ls.lon ?? ls.stop_lon,
          location_type: ls.locationType ?? ls.location_type ?? 0,
          services: (ls.services || []).map(normalizeService),
        })),
      });

      return data.stops.map(normalizeStop);
    }

    // Legacy flat array
    const raw: any[] = Array.isArray(data) ? data
      : Array.isArray(data?.data) ? data.data
      : Array.isArray(data?.results) ? data.results
      : null;

    if (!raw) {
      console.warn('fetchAllStops: unexpected response shape', data);
      return [];
    }

    return raw.map((stop: any) => ({
      ...stop,
      stop_id: stop.id || stop.stop_id,
      stop_name: stop.name || stop.stop_name,
      stop_lat: stop.lat ?? stop.stop_lat,
      stop_lon: stop.lon ?? stop.stop_lon,
      location_type: stop.locationType ?? stop.location_type ?? 0,
      services: (stop.services || []).map((svc: any) => ({
        service_guid: svc.serviceId || svc.service_guid,
        organization_guid: svc.organizationId || svc.organization_guid || svc.serviceId,
        agency_name: svc.agencyName || svc.agency_name || '',
        routes: (svc.routes || []).map((r: any) => ({
          route_id: r.routeId || r.route_id,
          route_short_name: r.routeId || r.route_id,
        })),
      })),
    }));
  } catch (error: any) {
    console.error('Error fetching stops:', error.message || error);
    throw error;
  }
}
