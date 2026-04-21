import { formatTime } from '@/utils/formats';

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

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Format arrival as duration for same-day, or day + date for future dates.
 * - Same day: "4 hr 24 min" or "45 min"
 * - Future: "Tue 4/22", "Wed 4/23", etc.
 */
function formatSmartDuration(arrivalTimestamp: number, currentTime: number): string {
  const arrivalDate = new Date(arrivalTimestamp);
  const currentDate = new Date(currentTime);

  // Get calendar dates (midnight) for comparison
  const arrivalDay = new Date(arrivalDate.getFullYear(), arrivalDate.getMonth(), arrivalDate.getDate());
  const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

  if (arrivalDay.getTime() === currentDay.getTime()) {
    // Same day - show duration
    const durationSeconds = Math.round((arrivalTimestamp - currentTime) / 1000);
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    return `${hours > 0 ? `${hours} hr ` : ''}${minutes} min`;
  } else {
    // Future day - show day name + date (e.g., "Tue 4/22")
    const dayName = DAY_NAMES[arrivalDate.getDay()];
    const month = arrivalDate.getMonth() + 1;
    const day = arrivalDate.getDate();
    return `${dayName} ${month}/${day}`;
  }
}

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
  });

  return {
    station: data.name,
    trains: futureArrivals.map((train: any) => ({
      destination: train.headsign,
      routeId: train.routeId || train.id?.split(':')[0] || '',
      routeShortName: train.shortName || train.routeId || train.id?.split(':')[0] || '',
      routeType: train.routeType,
      routeColor: train.color || DEFAULT_ROUTE_COLOR,
      routeTextColor: train.textColor || DEFAULT_ROUTE_TEXT_COLOR,
      arrivalTime: formatTime(Math.round(train.arrive)),
      arrivalTimestamp: Math.round(train.arrive),  // Raw timestamp for sorting
      arrival: formatSmartDuration(train.arriveScheduled, currentTime),
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
  console.log(endpoint, headers);
  return fetch(endpoint, { method: 'GET', headers });
}

export async function fetchStopData(stopId: string, serviceId: string, organizationId: string) {
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
    throw new Error(`Failed to fetch stop data: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  console.log(result);
  const formattedData = formatBusData(result);
  console.log(formattedData);

  return formattedData;
}
