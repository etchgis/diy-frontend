interface FetchStopsOptions {
  coordinates: {lat: number, lng: number};
  radius?: number; // in meters, default 1000
  search?: string; // search term for filtering
}

export async function fetchAllStops(options: FetchStopsOptions | {lat: number, lng: number}): Promise<any> {
  try {
    // Handle both old signature (coordinates only) and new signature (options object)
    const coordinates = 'coordinates' in options ? options.coordinates : options;
    const radius = 'radius' in options ? options.radius : undefined;
    const search = 'search' in options ? options.search : undefined;

    let url = `https://api.etch.app/nysdot-stops/nearby-stops?lat=${coordinates.lat}&lon=${coordinates.lng}`;

    if (radius !== undefined) {
      url += `&radius=${radius}`;
    }

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

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
    console.error('Error fetching stops:', error.message || error);
    throw error;
  }
}
