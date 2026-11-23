import { formatTripData } from "@/utils/formatTripData";
import { isOtpPlanBody } from "@/lib/arrivalsFreshness";

const MAX_TRIP_SECONDS = 3 * 60 * 60;

const OTP_URL = process.env.NEXT_PUBLIC_OTP_URL;
if (!OTP_URL) {
  throw new Error('NEXT_PUBLIC_OTP_URL environment variable is not configured');
}

const ALL_TRANSIT_MODES = ['BUS', 'SUBWAY', 'RAIL', 'TRAM'];

function buildOtpModeString(allowedModes?: string[], includeWalk?: boolean): string {
  const hasWalk = includeWalk !== false && (!allowedModes || allowedModes.includes('WALK'));
  const transitModes = allowedModes
    ? allowedModes.filter((m) => m !== 'WALK')
    : ALL_TRANSIT_MODES;
  const parts = [...transitModes];
  if (hasWalk) parts.push('WALK');
  return parts.length > 0 ? parts.join(',') : 'TRANSIT,WALK';
}

export async function fetchTransitData(
  fromPlace: string,
  toPlace: string,
  allowedModes?: string[],
  maxWalkDistance?: number,
  // The published screen asks for a plain no-trip result instead of an error.
  options?: { allowNoTrip?: boolean }
): Promise<any> {
  try {
    const baseUrl = `${OTP_URL}?`;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = `${hours % 12 || 12}:${minutes < 10 ? `0${minutes}` : minutes}${hours >= 12 ? 'pm' : 'am'}`;
    const date = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`;

    const modeString = buildOtpModeString(allowedModes);
    const walkParam = maxWalkDistance != null ? `&maxWalkDistance=${maxWalkDistance}` : '';
    const query = `${baseUrl}fromPlace=${fromPlace}&toPlace=${toPlace}&time=${time}&date=${date}&arriveBy=false&showIntermediateStops=false&wheelchair=false&locale=en&walkSpeed=1.25&numItineraries=5&mode=${modeString}${walkParam}`;

    const walkAllowed = !allowedModes || allowedModes.includes('WALK');
    const walkQuery = walkAllowed
      ? `${baseUrl}fromPlace=${fromPlace}&toPlace=${toPlace}&time=${time}&date=${date}&arriveBy=false&showIntermediateStops=false&wheelchair=false&locale=en&walkSpeed=1.25&mode=WALK${walkParam}`
      : null;

    const response = await fetch(query);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! Status: ${response.status}, StatusText: ${response.statusText}, URL: ${query}, Response Body: ${errorBody}`
      );
    }

    const data = await response.json();

    if (!isOtpPlanBody(data)) {
      throw new Error('Trip response has no itineraries list');
    }

    const allData: any = [...(data.plan?.itineraries ?? [])];

    // Fetch WALK-only itinerary and add if under 20 minutes (only when walk is allowed)
    let walkItinerary = null;
    if (walkQuery) {
      try {
        const walkResponse = await fetch(walkQuery);
        if (walkResponse.ok) {
          const walkData = await walkResponse.json();
          if (walkData?.plan?.itineraries && walkData.plan.itineraries.length > 0) {
            walkItinerary = walkData.plan.itineraries[0];
            if (walkItinerary.duration < 1200) {
              allData.push(walkItinerary);
            }
          }
        }
      } catch (walkError) {
        console.warn('Walk-only query failed:', walkError);
      }
    }

    // A good answer with no trip is not a failure; the row just has no times.
    if (!allData.some((it: any) => it.duration <= MAX_TRIP_SECONDS)) {
      if (options?.allowNoTrip) return { noTrip: true };
      throw new Error('There is currently no good trip for this destination.');
    }

    const formattedData = formatTripData(allData);

    return formattedData;
  } catch (error: any) {
    throw error;
  }
}