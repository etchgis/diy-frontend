import { useGeneralStore } from "@/stores/general";
import { fetchTransitData } from "./fetchTransitDestinationData";
import { formatTime, formatDuration } from "@/utils/formats";

export async function getDestinationData(
  destList: { name: string; coordinates: { lat: number; lng: number } }[],
  slideId: string,
  setDestinationData: (slideId: string, data: any[]) => void,
  setDataError: (slideId: string, error: boolean) => void,
  currentDestinationData: any[] = []
) {
  if (!Array.isArray(currentDestinationData)) currentDestinationData = [];
  if (destList.length === 0) return;
  const coordinates = useGeneralStore.getState().coordinates || null;
  if (!coordinates) return;

  let updatedDestinationData = [...currentDestinationData];

  if (updatedDestinationData.length > 0) {
    updatedDestinationData = updatedDestinationData.filter((d) =>
      destList.some((dl) => dl.name === d.name)
    );

    destList.forEach((dl, idx) => {
      if (!updatedDestinationData.some((d) => d.name === dl.name)) {
        updatedDestinationData.push({
          name: dl.name,
          coordinates: dl.coordinates,
          arrival: null,
          departure: null,
          route: null,
          legs: null,
          travel: null,
          dark: idx % 2 === 0,
        });
      }
    });
  } else {
    updatedDestinationData = destList.map((dl, idx) => ({
      name: dl.name,
      coordinates: dl.coordinates,
      arrival: null,
      departure: null,
      route: null,
      legs: null,
      travel: null,
      dark: idx % 2 === 0,
    }));
  }

  setDestinationData(slideId, updatedDestinationData);

  const results = await Promise.allSettled(
    destList.map(async (dest) => {
      const origin = `${coordinates.lat},${coordinates.lng}`;
      const destination = `${dest.coordinates.lat},${dest.coordinates.lng}`;
      return fetchTransitData(origin, destination);
    })
  );

  const enrichedDestinations = results.map((res, index) => {
    const previousData = updatedDestinationData[index];
    if (res.status === "fulfilled" && res.value) {
      const data = res.value;
      return {
        name: destList[index].name,
        route: data.route || "N/A",
        departure: data.startTime ? formatTime(data.startTime) : null,
        arrival: data.endTime ? formatTime(data.endTime) : null,
        travel: typeof data.duration !== "undefined" && data.duration !== null ? formatDuration(data.duration) : null,
        legs: Array.isArray(data.legs) ? data.legs : [],
        coordinates: destList[index].coordinates,
        dark: index % 2 === 0,
      };
    } else if (previousData) {
      return {
        name: previousData.name || destList[index].name,
        route: previousData.route ?? null,
        departure: previousData.departure ?? null,
        arrival: previousData.arrival ?? null,
        travel: previousData.travel ?? null,
        legs: previousData.legs ?? null,
        coordinates: previousData.coordinates ?? destList[index].coordinates,
        dark: typeof previousData.dark === "boolean" ? previousData.dark : index % 2 === 0,
      };
    } else {
      return {
        name: destList[index].name,
        route: null,
        departure: null,
        arrival: null,
        travel: null,
        legs: null,
        coordinates: destList[index].coordinates,
        dark: index % 2 === 0,
      };
    }
  });

  const anySuccess = enrichedDestinations.some((d) =>
    (d.departure || d.arrival || d.travel) || (Array.isArray(d.legs) && d.legs.length > 0)
  );

  setDataError(slideId, !anySuccess);
  setDestinationData(slideId, enrichedDestinations);
}