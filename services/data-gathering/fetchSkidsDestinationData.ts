const SKIDS_URL = process.env.NEXT_PUBLIC_SKIDS_URL;
const SKIDS_REGION = process.env.NEXT_PUBLIC_SKIDS_REGION;

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
  itineraries?: SkidsItinerary[];
}

interface SkidsStopInfo {
  id: string;
  name: string;
  lat?: number;
  lon?: number;
}

interface SkidsStopInfo {
  id: string;
  name: string;
  lat?: number;
  lon?: number;
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
    agencyId?: string;    
    agencyName?: string; 
  };
  boardStop: SkidsStopInfo;
  alightStop: SkidsStopInfo;
  boardTime: number;
  alightTime: number;
  headsign: string;
  stops: string[];
  legGeometry?: {
    points: string; 
  };
}

interface SkidsTransferLeg {
  type: 'transfer';
  fromStop: SkidsStopInfo;
  toStop: SkidsStopInfo;
  duration: number;
  distanceMeters?: number;
}

interface SkidsWalkLeg {
  type: 'walk';
  duration: number;
  distanceMeters: number;
  fromCoordinate: { lat: number; lon: number };
  toCoordinate: { lat: number; lon: number };
}

type SkidsLeg = SkidsTransitLeg | SkidsTransferLeg | SkidsWalkLeg;

/** Transformed leg format expected by the UI */
export interface TransformedLeg {
  mode: string;
  duration: number;
  distanceMeters?: number;
  from?: { id: string; name: string };
  to?: { id: string; name: string };
  routeShortName?: string;
  routeColor?: string;
  routeTextColor?: string;
  routeType?: number;
  agencyId?: string;
  agencyName?: string;
  headsign?: string;
  boardTime?: number;
  alightTime?: number;
  legGeometry?: {
    points: string;  
  };
}

export interface TransformedItinerary {
  routeSignature: string[];  
  route: string | null;
  departure: string | null;
  arrival: string | null;
  travel: string | null;
  legs: TransformedLeg[];
}

export interface TransformedItinerary {
  routeSignature: string[]; 
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
  allItineraries?: TransformedItinerary[]; 
  reason?: string;
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

  if (leg.type === 'walk') {
    return {
      mode: 'WALK',
      duration: leg.duration,
      distanceMeters: leg.distanceMeters,
    };
  }

  const duration = leg.alightTime - leg.boardTime;

  return {
    mode: leg.route.mode,
    duration,
    routeShortName: leg.route.shortName,
    routeColor: leg.route.color?.replace(/^#/, ''),
    routeTextColor: leg.route.textColor?.replace(/^#/, ''),
    routeType: leg.route.type,
    agencyId: leg.route.agencyId,
    agencyName: leg.route.agencyName,
    from: leg.boardStop,
    to: leg.alightStop,
    headsign: leg.headsign,
    boardTime: leg.boardTime,
    alightTime: leg.alightTime,
    legGeometry: leg.legGeometry,
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
): TransformedItinerary | null {
  const allLegs = rawLegs.map(transformLeg);
  const displayLegs = allLegs.filter((l) => l.duration > 0 && !(l.mode === 'WALK' && l.duration < 240));
  const routeStr = displayLegs.map((l) => (l.mode === 'WALK' ? 'Walk' : l.routeShortName)).join(' > ');
  const routeSignature = displayLegs
    .filter((l) => l.mode !== 'WALK' && l.routeShortName)
    .map((l) => l.routeShortName!);

  const firstTransitRaw = rawLegs.find((l) => l.type === 'transit') as SkidsTransitLeg | undefined;
  const departureSeconds = firstTransitRaw?.boardTime ?? (arrivalTime != null && duration != null ? arrivalTime - duration : undefined);
  const departure = departureSeconds != null ? formatSecondsAsTime(departureSeconds) : null;
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
): TransformedDestination[] {
  return response.results.map((result, index) => {
    const destCoord = destinations[index]?.coordinates;

    if (!result.reachable) {
      return { name: result.destinationName, route: null, departure: null, arrival: null, travel: null, legs: [], coordinates: destCoord, dark: index % 2 === 0, reason: result.reason };
    }

    const rawItineraries: { legs: SkidsLeg[]; arrivalTime?: number; duration?: number }[] =
      result.itineraries && result.itineraries.length > 0
        ? result.itineraries.map((it) => ({ legs: it.legs || [], arrivalTime: it.arrivalTime, duration: it.duration }))
        : [{ legs: result.legs || [], arrivalTime: result.arrivalTime, duration: result.duration }];

    const transformedItineraries = rawItineraries
      .map((it) => transformItinerary(it.legs, it.arrivalTime, it.duration))
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
  numItineraries?: number;  
  maxWalkMeters?: number;
}

/**
 * Fetch transit routing data from Skids API for multiple destinations
 */
export async function fetchSkidsTransitData(
  origin: { lat: number; lng: number },
  destinations: { name: string; coordinates: { lat: number; lng: number }; allowedModes?: string[] }[],
  options?: SkidsFetchOptions
): Promise<TransformedDestination[]> {
  if (!SKIDS_URL) {
    throw new Error('NEXT_PUBLIC_SKIDS_URL environment variable is not configured');
  }

  const apiOptions: any = { maxTransfers: 3 };
  if (SKIDS_REGION) {
    apiOptions.region = SKIDS_REGION;
  }
  if (options?.maxWalkMeters != null) {
    apiOptions.maxWalkMeters = options.maxWalkMeters;
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
        ...(d.allowedModes && d.allowedModes.length > 0 ? { allowedModes: d.allowedModes } : {}),
      })),
      options: apiOptions,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Skids API error: ${response.status} - ${errorBody}`);
  }

  const data: SkidsResponse = await response.json();
  console.log('[SKIDS] raw response:', JSON.stringify(data, null, 2));
  const transformed = transformSkidsResponse(data, destinations);
  console.log('[SKIDS] transformed response:', JSON.stringify(transformed, null, 2));
  return transformed;
}
