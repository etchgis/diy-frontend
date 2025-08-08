import { formatTime, formatDuration } from "@/utils/formats";

function findStatus(realtime: boolean, arrive: number, arriveScheduled: number) {
  const currentTime = Date.now();
  const timeDiff = arrive - currentTime;
  const scheduledTimeDiff = arrive - arriveScheduled;
  if (!realtime) {
    return 'Scheduled'
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
      const endpoint = `https://api-stage.etch.app/skids/feed/${serviceId}/patterns/${train.id}`;
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
  const formattedData = {
    station: data.name,
    trains: data.arrivals.map((train: any) => ({
      destination: train.headsign,
      arrivalTime: formatTime(Math.round((train.arrive))),
      arrival: formatDuration(Math.round((train.arriveScheduled - Date.now()) / 1000)),
      status: findStatus(train.realtime, train.arrive, train.arriveScheduled),
    })),
  }

  const trainDetails = await fetchTrainDetails(data.arrivals, serviceId, organizationId);
  formattedData.trains.forEach((train: any, index: number) => {
    train.details = trainDetails[index];
  });

  return formattedData;
}

export async function fetchStopData(stopId: string, serviceId: string, organizationId: string) {
  try {
    console.log("serviceId:", serviceId);
    console.log("stopId:", stopId);
    console.log("organizationId:", organizationId);
    const endpoint = `https://api-stage.etch.app/skids/feed/${serviceId}/stops/${stopId}?timestamp=${Date.now()}&n=7&nysdot=true`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Organization-Id': `${organizationId}`,
    };
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: headers,
    })

    console.log(response)

    if (!response.ok) {
      throw new Error(`Failed to fetch stop data: ${response.statusText}`);
    }


    const result = await response.json();

    const formattedData = await formatBusData(result, serviceId, organizationId);

    console.log(formattedData);

    return formattedData;

  } catch (error) {
    console.error('Error fetching stop data:', error);
  }
}