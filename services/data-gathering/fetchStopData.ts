import { formatTime, formatDuration } from '@/utils/formats';

// Maximum number of arrivals to display per slide
export const MAX_ARRIVALS_PER_SLIDE = 6;

const SKIDS_URL = process.env.NEXT_PUBLIC_SKIDS_URL;
if (!SKIDS_URL) {
  throw new Error('NEXT_PUBLIC_SKIDS_URL environment variable is not configured');
}

function findStatus(realtime: boolean, arrive: number, arriveScheduled: number) {
  const currentTime = Date.now();
  const timeDiff = arrive - currentTime;
  const scheduledTimeDiff = arrive - arriveScheduled;
  if (!realtime) {
    return 'Scheduled';
  }
  if (timeDiff < 60000) {
    // 1 minute
    return 'Arriving';
  }
  if (scheduledTimeDiff > 300000) {
    // 5 minutes
    return 'Delayed';
  } else {
    return 'On Time';
  }
}

// Default colors when route colors are not available from API
const DEFAULT_ROUTE_COLOR = '0074D9';
const DEFAULT_ROUTE_TEXT_COLOR = 'FFFFFF';

function formatBusData(data: any) {
  const currentTime = Date.now();
  const stationName = (data.name || '').toLowerCase().trim();

  const futureArrivals = data.arrivals.filter((train: any) => {
    // Filter out arrivals in the past
    const durationSeconds = Math.round((train.arriveScheduled - currentTime) / 1000);
    if (durationSeconds < 0) return false;
    // Filter out trains terminating at this station (headsign matches station name)
    const headsign = (train.headsign || '').toLowerCase().trim();
    if (headsign && headsign === stationName) return false;
    return true;
  }).slice(0, MAX_ARRIVALS_PER_SLIDE);

  return {
    station: data.name,
    trains: futureArrivals.map((train: any) => ({
      destination: train.headsign,
      routeId: train.routeId || '',              // Actual GTFS route_id for filtering
      routeShortName: train.shortName || train.routeId || '',  // Display name for UI
      routeType: train.routeType,
      routeColor: train.color || DEFAULT_ROUTE_COLOR,
      routeTextColor: train.textColor || DEFAULT_ROUTE_TEXT_COLOR,
      arrivalTime: formatTime(Math.round(train.arrive)),
      arrivalTimestamp: Math.round(train.arrive),  // Raw timestamp for sorting
      arrival: formatDuration(Math.round((train.arriveScheduled - currentTime) / 1000)),
      status: findStatus(train.realtime, train.arrive, train.arriveScheduled),
    })),
  };
}

async function fetchStopById(stopId: string, serviceId: string, organizationId: string) {
  const endpoint = `${SKIDS_URL}/feed/${serviceId}/stops/${stopId}?timestamp=${Date.now()}&n=20&nysdot=true`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Organization-Id': organizationId,
    'X-Skids-Route-Key': serviceId,
  };
  return fetch(endpoint, { method: 'GET', headers });
}

export async function fetchStopData(stopId: string, serviceId: string, organizationId: string, slideId: string, setDataError: (slideId: string, error: boolean) => void) {
  try {
    let response = await fetchStopById(stopId, serviceId, organizationId);

    // If the stop ID has no directional suffix and the API rejects it,
    // automatically retry with N and S variants
    if (response.status === 400 && !/[NSEW]$/.test(stopId)) {
      const fallbacks = [`${stopId}N`, `${stopId}S`];
      for (const fallbackId of fallbacks) {
        const fallbackResponse = await fetchStopById(fallbackId, serviceId, organizationId);
        if (fallbackResponse.ok) {
          response = fallbackResponse;
          break;
        }
      }
    }

    if (!response.ok) {
      if (response.status >= 400 && response.status < 500) {
        return undefined;
      }
      setDataError(slideId, true);
      throw new Error(`Failed to fetch stop data: ${response.statusText}`);
    } else {
      setDataError(slideId, false);
    }

    const result = await response.json();

    console.log(result);
    const formattedData = formatBusData(result);
    console.log(formattedData);

    return formattedData;
  } catch (error) {
    console.error('Error fetching stop data:', error);
  }
}
