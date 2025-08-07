export async function fetchAllStops(coordinates: {lat: number, lng: number}): Promise<any> {
  try {

    const url = `https://api.etch.app/nysdot-stops/nearby-stops?lat=${coordinates.lat}&lon=${coordinates.lng}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! Status: ${response.status}, StatusText: ${response.statusText}, Response Body: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching stops:", error.message || error);
    throw error;
  }
}