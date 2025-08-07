import { useGeneralStore } from "@/stores/general";
import { fetchTransitData } from "./fetchTransitDestinationData";
import { formatTime, formatDuration } from "@/utils/formats";

export async function getDestinationData (destList: { name: string, coordinates: { lat: number, lng: number } }[], slideId: string, setDestinationData: (slideId: string, data: any[]) => void) {
  const coordinates = useGeneralStore.getState().coordinates || null;
    if (!coordinates) {
      return;
    }
    try {
      const enrichedDestinations = await Promise.all(
        destList.map(async (dest, index) => {
          const origin = `${coordinates.lat},${coordinates.lng}`;
          const destination = `${dest.coordinates.lat},${dest.coordinates.lng}`;

          const data = await fetchTransitData(origin, destination);

          return {
            name: dest.name,
            route: "N/A",
            departure: formatTime(data.startTime),
            arrival: formatTime(data.endTime),
            travel: formatDuration(data.duration),
            legs: data.legs,
            coordinates: dest.coordinates,
            dark: index % 2 === 0,
          };
        })
      );

      setDestinationData(slideId, enrichedDestinations);
    } catch (error: any) {
      throw new Error(`Error fetching destination data: ${error.message || error}`);

    }
  };