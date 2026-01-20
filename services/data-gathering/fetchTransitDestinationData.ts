import { formatTripData } from "@/utils/formatTripData";

const OTP_URL = process.env.NEXT_PUBLIC_OTP_URL;
if (!OTP_URL) {
  throw new Error('NEXT_PUBLIC_OTP_URL environment variable is not configured');
}

export async function fetchTransitData(fromPlace: string, toPlace: string): Promise<any> {
  try {
    const baseUrl = `${OTP_URL}?`;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = `${hours % 12 || 12}:${minutes < 10 ? `0${minutes}` : minutes}${hours >= 12 ? 'pm' : 'am'}`;
    const date = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`;

    const query = `${baseUrl}fromPlace=${fromPlace}&toPlace=${toPlace}&time=${time}&date=${date}&arriveBy=false&showIntermediateStops=false&wheelchair=false&locale=en&walkSpeed=1.25&mode=TRANSIT,WALK,SUBWAY`;

    // Query for WALK-only mode
    const walkQuery = `${baseUrl}fromPlace=${fromPlace}&toPlace=${toPlace}&time=${time}&date=${date}&arriveBy=false&showIntermediateStops=false&wheelchair=false&locale=en&walkSpeed=1.25&mode=WALK`;

    const response = await fetch(query);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! Status: ${response.status}, StatusText: ${response.statusText}, URL: ${query}, Response Body: ${errorBody}`
      );
    }

    const data = await response.json();

    console.log(data);

    const allData: any = [];
    data.plan.itineraries.forEach((result: any) => {
      allData.push(result);
    });

    // Fetch WALK-only itinerary and add if under 20 minutes
    let walkItinerary = null;
    try {
      const walkResponse = await fetch(walkQuery);
      if (walkResponse.ok) {
        const walkData = await walkResponse.json();
        if (walkData?.plan?.itineraries && walkData.plan.itineraries.length > 0) {
          walkItinerary = walkData.plan.itineraries[0];
          // Check if duration is under 20 minutes (1200 seconds)
          if (walkItinerary.duration < 1200) {
            allData.push(walkItinerary);
          }
        }
      }
    } catch (walkError) {
      // Silently fail if walk query doesn't work, we still have transit data
      console.warn('Walk-only query failed:', walkError);
    }

    if ((!data || !data.plan) && !walkItinerary ) {
      throw new Error("There is currently no good trip for this destination.");
    }


    const formattedData = formatTripData(allData);

    return formattedData;
  } catch (error: any) {
    throw error;
  }
}