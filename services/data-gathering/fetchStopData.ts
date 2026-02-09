import { formatTime, formatDuration } from '@/utils/formats';
import { set } from 'react-hook-form';

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


async function fetchTrainDetails(arrivals: any[], serviceId: string, organizationId: string) {
  const trainDetails = await Promise.all(
    arrivals.map(async (train: any) => {
      const endpoint = `${SKIDS_URL}/feed/${serviceId}/patterns/${train.id}?nysdot=true`;
      const headers = {
        'Content-Type': 'application/json',
        'X-Organization-Id': organizationId,
      };
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers,
      });
      if (!response.ok) {
        console.error(`Failed to fetch train details for ID: ${train.id}`);
        return null;
      }
      return response.json();
    })
  );

  return trainDetails;
}

async function formatBusData(data: any, serviceId: string, organizationId: string) {
  // Filter out arrivals that are in the past (negative duration)
  const currentTime = Date.now();
  const futureArrivals = data.arrivals.filter((train: any) => {
    const durationSeconds = Math.round((train.arriveScheduled - currentTime) / 1000);
    return durationSeconds >= 0;
  });

  const formattedData = {
    station: data.name,
    trains: futureArrivals.map((train: any) => ({
      destination: train.headsign,
      routeId: train.routeId,
      arrivalTime: formatTime(Math.round((train.arrive))),
      arrival: formatDuration(Math.round((train.arriveScheduled - currentTime) / 1000)),
      status: findStatus(train.realtime, train.arrive, train.arriveScheduled),
    })),
  };

  const trainDetails = await fetchTrainDetails(futureArrivals, serviceId, organizationId);
  formattedData.trains.forEach((train: any, index: number) => {
    train.details = trainDetails[index];
  });

  return formattedData;
}

export async function fetchStopData(stopId: string, serviceId: string, organizationId: string, slideId: string, setDataError: (slideId: string, error: boolean) => void) {
  try {

    console.log(serviceId, organizationId);


    const endpoint = `${SKIDS_URL}/feed/${serviceId}/stops/${stopId}?timestamp=${Date.now()}&n=7&nysdot=true`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Organization-Id': `${organizationId}`,
    };
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: headers,
    });

    console.log(response);

    if (!response.ok) {
      setDataError(slideId, true);
      throw new Error(`Failed to fetch stop data: ${response.statusText}`);
    } else {
      setDataError(slideId, false);
    }


    const result = await response.json();
    console.log(result);

    const formattedData = await formatBusData(result, serviceId, organizationId);



    return formattedData;

  } catch (error) {
    console.error('Error fetching stop data:', error);
  }
}
