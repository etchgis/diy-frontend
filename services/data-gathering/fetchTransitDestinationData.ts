import { formatTripData } from "@/utils/formatTripData";

export async function fetchTransitData(fromPlace: string, toPlace: string): Promise<any> {
  try {
    const baseUrl = 'https://511ny.etch.app/opentripplanner/otp/routers/default/plan?';

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = `${hours % 12 || 12}:${minutes < 10 ? `0${minutes}` : minutes}${hours >= 12 ? 'pm' : 'am'}`;
    const date = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`;

    const query = `${baseUrl}fromPlace=${fromPlace}&toPlace=${toPlace}&time=${time}&date=${date}&arriveBy=false&showIntermediateStops=false&wheelchair=false&locale=en&walkSpeed=1.25&mode=TRANSIT,WALK`;



    const response = await fetch(query);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! Status: ${response.status}, StatusText: ${response.statusText}, URL: ${query}, Response Body: ${errorBody}`
      );
    }

    const data = await response.json();

    const allData: any = [];
    if (!data || !data.plan ) {
      throw new Error("There is currently no good trip for this destination.");
    }
    data.plan.itineraries.forEach((result: any) => {
      allData.push(result);
    });
    const formattedData = formatTripData(allData);

    return formattedData;
  } catch (error: any) {
    throw error;
  }
}