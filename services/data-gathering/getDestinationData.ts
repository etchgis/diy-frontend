import { useGeneralStore } from "@/stores/general";
import { fetchTransitData } from "./fetchTransitDestinationData";
import { formatTime, formatDuration } from "@/utils/formats";

export async function getDestinationData(
  destList: { name: string; coordinates: { lat: number; lng: number } }[],
  slideId: string,
  setDestinationData: (slideId: string, data: any[]) => void,
  setDataError: (slideId: string, error: boolean) => void
) {
  console.log('hit');
  const coordinates = useGeneralStore.getState().coordinates || null;
  if (!coordinates) {
    return;
  }

  const results = await Promise.allSettled(
    destList.map(async (dest) => {
      const origin = `${coordinates.lat},${coordinates.lng}`;
      const destination = `${dest.coordinates.lat},${dest.coordinates.lng}`;
      return fetchTransitData(origin, destination);
    })
  );

  const enrichedDestinations = results
    .map((res, index) => {
      if (res.status === "fulfilled") {
        const data = res.value;
        return {
          name: destList[index].name,
          route: "N/A",
          departure: formatTime(data.startTime),
          arrival: formatTime(data.endTime),
          travel: formatDuration(data.duration),
          legs: data.legs,
          coordinates: destList[index].coordinates,
          dark: index % 2 === 0,
        };
      }
      return null; // ignore failed fetches
    })
    .filter(Boolean);

  if (enrichedDestinations.length === 0) {
    setDataError(slideId, true);
    throw new Error("All destination fetches failed");
  } else {
    setDataError(slideId, false);
  }

  setDestinationData(slideId, enrichedDestinations);
}