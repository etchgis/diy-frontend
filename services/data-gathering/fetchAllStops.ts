import { expandStops } from '@/utils/expandStops';

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

    // New format: { stops: [...], refs: { services: { [serviceId]: {...} }, routes: { ["serviceId:routeId"]: {...} } } }
    if (Array.isArray(data?.stops)) {
      const serviceRefs: Record<string, any> = data?.refs?.services || {};
      const routeRefs: Record<string, any> = data?.refs?.routes || {};

      const normalizeService = (svc: any) => {
        const ref = serviceRefs[svc.serviceId] || {};
        return {
          id: svc.serviceId,
          organizationId: ref.organizationId || '',
          agencyName: ref.agencyName || '',
          routes: (svc.routes || []).map((r: any) => {
            const routeId = r.routeId || r.route_id || r.id;
            const routeRef = routeRefs[`${svc.serviceId}:${routeId}`] || {};
            return {
              id: routeId,
              shortName: routeRef.shortName || r.shortName || routeId,
              longName: routeRef.longName || r.longName || '',
              color: routeRef.color || r.color || '',
              textColor: routeRef.textColor || r.textColor || '',
              headsigns: r.headsigns || [],
            };
          }),
        };
      };

      const normalizeStop = (stop: any) => ({
        ...stop,
        // keep both old and new field names for compatibility
        stop_id: stop.id || stop.stop_id,
        stop_name: stop.name || stop.stop_name,
        stop_lat: stop.lat ?? stop.stop_lat,
        stop_lon: stop.lon ?? stop.stop_lon,
        location_type: stop.locationType ?? stop.location_type ?? 0,
        services: (stop.services || []).map(normalizeService),
        linkedStops: (stop.linkedStops || []).map((ls: any) => ({
          ...ls,
          stop_id: ls.id || ls.stop_id,
          stop_name: ls.name || ls.stop_name,
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
        id: svc.serviceId || svc.service_guid || svc.id,
        organizationId: svc.organizationId || svc.organization_guid || '',
        agencyName: svc.agencyName || svc.agency_name || '',
        routes: (svc.routes || []).map((r: any) => ({
          id: r.routeId || r.route_id || r.id,
          shortName: r.shortName || r.route_short_name || r.routeId || r.route_id || '',
          longName: r.longName || r.route_long_name || '',
          color: r.color || r.route_color || '',
          textColor: r.textColor || r.route_text_color || '',
          headsigns: r.headsigns || [],
        })),
      })),
    }));
  } catch (error: any) {
    console.error('Error fetching stops:', error.message || error);
    throw error;
  }
}
