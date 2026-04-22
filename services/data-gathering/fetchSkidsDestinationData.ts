const SKIDS_URL = process.env.NEXT_PUBLIC_SKIDS_URL;

interface SkidsResponse {
  origin: {
    coordinate: { lat: number; lon: number };
    candidateStops: { id: string; name: string; distanceMeters: number; routeCount: number }[];
  };
  results: SkidsResult[];
  date: string;
  metadata: {
    routingTimeMs: number;
    usingPrebuiltGraph: boolean;
    usingRealtimeData: boolean;
    region?: string;
    timezone?: string;
  };
}

interface SkidsItinerary {
  arrivalTime?: number;
  duration?: number;
  numberOfTransfers?: number;
  legs?: SkidsLeg[];
}

interface SkidsResult {
  destinationName: string;
  destinationCoordinate: { lat: number; lon: number };
  reachable: boolean;
  reason?: string;
  arrivalTime?: number;
  duration?: number;
  numberOfTransfers?: number;
  resolvedStop?: { id: string; name: string; distanceMeters: number };
  candidateStops?: { id: string; name: string; distanceMeters: number; routeCount: number }[];
  legs?: SkidsLeg[];
  itineraries?: SkidsItinerary[]; // multiple itinerary options when numItineraries > 1
}

interface SkidsTransitLeg {
  type: 'transit';
  route: {
    shortName: string;
    longName: string;
    type: number;
    mode: string;
    color?: string;
    textColor?: string;
    serviceId: string;
    agencyId?: string;    // GTFS agency_id (e.g., "MTA NYCT")
    agencyName?: string;  // Full agency name
  };
  boardStop: { id: string; name: string };
  alightStop: { id: string; name: string };
  boardTime: number;
  alightTime: number;
  headsign: string;
  stops: string[];
}

interface SkidsTransferLeg {
  type: 'transfer';
  fromStop: { id: string; name: string };
  toStop: { id: string; name: string };
  duration: number;
  distanceMeters?: number;
}

type SkidsLeg = SkidsTransitLeg | SkidsTransferLeg;

/** Transformed leg format expected by the UI */
export interface TransformedLeg {
  mode: string;
  duration: number;
  distanceMeters?: number;
  from: { id: string; name: string };
  to: { id: string; name: string };
  routeShortName?: string;
  routeColor?: string;
  routeTextColor?: string;
  routeType?: number;
  agencyId?: string;
  agencyName?: string;
  headsign?: string;
  boardTime?: number;
  alightTime?: number;
}

export interface TransformedItinerary {
  routeSignature: string[];   // ordered transit route short names, used for matching
  route: string | null;
  departure: string | null;
  arrival: string | null;
  travel: string | null;
  legs: TransformedLeg[];
}

/** Transformed destination format expected by the UI */
export interface TransformedDestination {
  name: string;
  route: string | null;
  departure: string | null;
  arrival: string | null;
  travel: string | null;
  legs: TransformedLeg[];
  coordinates?: { lat: number; lng: number };
  dark: boolean;
  originStop?: { id: string; name: string; distanceMeters: number } | null;
  allItineraries?: TransformedItinerary[]; // populated when numItineraries > 1
}

/**
 * Format seconds-since-midnight directly as a time string.
 * This bypasses all Date/timezone conversion issues since the seconds
 * already represent the wall-clock time in the agency's timezone.
 */
function formatSecondsAsTime(secondsSinceMidnight: number): string {
  // Handle times past midnight (GTFS can have times like 25:00:00)
  const hours = Math.floor(secondsSinceMidnight / 3600) % 24;
  const minutes = Math.floor((secondsSinceMidnight % 3600) / 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Transform a Skids leg to the format expected by the UI
 */
function transformLeg(leg: SkidsLeg): TransformedLeg {
  if (leg.type === 'transfer') {
    return {
      mode: 'WALK',
      duration: leg.duration,
      distanceMeters: leg.distanceMeters,
      from: leg.fromStop,
      to: leg.toStop,
    };
  }

  const duration = leg.alightTime - leg.boardTime;

  return {
    mode: leg.route.mode,
    duration,
    routeShortName: leg.route.shortName,
    routeColor: leg.route.color,
    routeTextColor: leg.route.textColor,
    routeType: leg.route.type,
    agencyId: leg.route.agencyId,      // GTFS agency_id (e.g., "MTA NYCT")
    agencyName: leg.route.agencyName,  // Full agency name
    from: leg.boardStop,
    to: leg.alightStop,
    headsign: leg.headsign,
    boardTime: leg.boardTime,
    alightTime: leg.alightTime,
  };
}

/**
 * Format duration in seconds to "X hr Y min" or "Y min" format
 */
function formatDurationSeconds(durationInSeconds: number): string {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  return `${hours > 0 ? `${hours} hr ` : ''}${minutes} min`;
}

/**
 * Transform a raw itinerary into a TransformedItinerary.
 */
function transformItinerary(
  rawLegs: SkidsLeg[],
  arrivalTime: number | undefined,
  duration: number | undefined,
  allowedModes?: string[]
): TransformedItinerary | null {
  const allLegs = rawLegs.map(transformLeg);

  const modeFilteredLegs = allowedModes && allowedModes.length > 0
    ? allLegs.filter((l) => {
        if (l.mode === 'WALK') return allowedModes.includes('WALK');
        return allowedModes.some((m) => m.toUpperCase() === l.mode?.toUpperCase());
      })
    : allLegs;

  const hasTransit = modeFilteredLegs.some((l) => l.mode !== 'WALK');
  if (allowedModes && allowedModes.length > 0 && !hasTransit) return null;

  const displayLegs = modeFilteredLegs.filter((l) => !(l.mode === 'WALK' && l.duration < 240));
  const routeStr = displayLegs.map((l) => (l.mode === 'WALK' ? 'Walk' : l.routeShortName)).join(' > ');
  const routeSignature = displayLegs
    .filter((l) => l.mode !== 'WALK' && l.routeShortName)
    .map((l) => l.routeShortName!);

  const firstTransitRaw = rawLegs.find((l) => l.type === 'transit') as SkidsTransitLeg | undefined;
  const departure = firstTransitRaw?.boardTime != null ? formatSecondsAsTime(firstTransitRaw.boardTime) : null;
  const arrival = arrivalTime != null ? formatSecondsAsTime(arrivalTime) : null;
  const travel = duration != null ? formatDurationSeconds(duration) : null;

  return { routeSignature, route: routeStr || null, departure, arrival, travel, legs: displayLegs };
}

/**
 * Transform Skids response to the format expected by the UI.
 * Returns pre-formatted departure/arrival strings to avoid browser timezone issues.
 * Populates allItineraries when multiple itineraries are returned by the API.
 */
export function transformSkidsResponse(
  response: SkidsResponse,
  destinations: { name: string; coordinates: { lat: number; lng: number } }[],
  allowedModes?: string[]
): TransformedDestination[] {
  return response.results.map((result, index) => {
    const destCoord = destinations[index]?.coordinates;

    if (!result.reachable) {
      return { name: result.destinationName, route: null, departure: null, arrival: null, travel: null, legs: [], coordinates: destCoord, dark: index % 2 === 0 };
    }

    const rawItineraries: { legs: SkidsLeg[]; arrivalTime?: number; duration?: number }[] =
      result.itineraries && result.itineraries.length > 0
        ? result.itineraries.map((it) => ({ legs: it.legs || [], arrivalTime: it.arrivalTime, duration: it.duration }))
        : [{ legs: result.legs || [], arrivalTime: result.arrivalTime, duration: result.duration }];

    const transformedItineraries = rawItineraries
      .map((it) => transformItinerary(it.legs, it.arrivalTime, it.duration, allowedModes))
      .filter((it): it is TransformedItinerary => it !== null);

    if (transformedItineraries.length === 0) {
      return { name: result.destinationName, route: null, departure: null, arrival: null, travel: null, legs: [], coordinates: destCoord, dark: index % 2 === 0 };
    }

    const primary = transformedItineraries[0];
    return {
      name: result.destinationName,
      route: primary.route,
      departure: primary.departure,
      arrival: primary.arrival,
      travel: primary.travel,
      legs: primary.legs,
      coordinates: destCoord,
      dark: index % 2 === 0,
      originStop: response.origin?.candidateStops?.[0] || null,
      allItineraries: transformedItineraries.length > 1 ? transformedItineraries : undefined,
    };
  });
}

export interface SkidsFetchOptions {
  allowedModes?: string[];        // e.g. ['BUS', 'SUBWAY', 'WALK']
  numItineraries?: number;        // request multiple itineraries per destination (default 1)
  maxWalkDistanceMeters?: number;
}

/**
 * Fetch transit routing data from Skids API for multiple destinations
 */
export async function fetchSkidsTransitData(
  origin: { lat: number; lng: number },
  destinations: { name: string; coordinates: { lat: number; lng: number } }[],
  options?: SkidsFetchOptions
): Promise<TransformedDestination[]> {
  if (!SKIDS_URL) {
    throw new Error('NEXT_PUBLIC_SKIDS_URL environment variable is not configured');
  }

  const apiOptions: any = { maxTransfers: 3 };
  if (options?.maxWalkDistanceMeters != null) {
    apiOptions.maxWalkDistanceMeters = options.maxWalkDistanceMeters;
  }
  if (options?.allowedModes && options.allowedModes.length > 0) {
    apiOptions.allowedModes = options.allowedModes;
  }
  if (options?.numItineraries && options.numItineraries > 1) {
    apiOptions.numItineraries = options.numItineraries;
  }

  const response = await fetch(`${SKIDS_URL}/api/transit/route/coordinates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { lat: origin.lat, lon: origin.lng },
      destinations: destinations.map((d) => ({
        name: d.name,
        coordinate: { lat: d.coordinates.lat, lon: d.coordinates.lng },
      })),
      options: apiOptions,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Skids API error: ${response.status} - ${errorBody}`);
  }

  const data: SkidsResponse = await response.json();
  return transformSkidsResponse(data, destinations, options?.allowedModes);
}
