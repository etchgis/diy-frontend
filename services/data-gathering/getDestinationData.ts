import { useGeneralStore } from "@/stores/general";
import { fetchTransitData } from "./fetchTransitDestinationData";
import { fetchSkidsTransitData } from "./fetchSkidsDestinationData";
import { formatTime, formatDuration } from "@/utils/formats";

// use Skids API by default, set to 'false' to use OTP
const USE_SKIDS = process.env.NEXT_PUBLIC_USE_SKIDS !== 'false';

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

  // Only set initial empty data if there's no existing data
  if (!currentDestinationData || currentDestinationData.length === 0) {
    const initialData = destList.map((dl, idx) => ({
      name: dl.name,
      coordinates: dl.coordinates,
      arrival: null,
      departure: null,
      route: null,
      legs: [],
      travel: null,
      dark: idx % 2 === 0,
    }));
    setDestinationData(slideId, initialData);
  }

  try {
    if (USE_SKIDS) {
      // Skids provides single request for all destinations
      // Response already has pre-formatted departure/arrival/travel strings
      const results = await fetchSkidsTransitData(
        { lat: coordinates.lat, lng: coordinates.lng },
        destList
      );

      const enrichedDestinations = results.map((data, index) => ({
        name: data.name ?? destList[index].name,
        route: data.route ?? null,
        departure: data.departure ?? null,
        arrival: data.arrival ?? null,
        travel: data.travel ?? null,
        legs: Array.isArray(data.legs) ? data.legs : [],
        coordinates: destList[index].coordinates,
        dark: index % 2 === 0,
        originStop: data.originStop ?? null,
      }));

      const anySuccess = enrichedDestinations.some(
        (d) => d.departure ?? d.arrival ?? d.travel ?? (Array.isArray(d.legs) && d.legs.length > 0)
      );

      setDataError(slideId, !anySuccess);
      setDestinationData(slideId, enrichedDestinations);
    } else {
      // OTP: Original implementation (N separate requests)
      await fetchOtpDestinations(destList, slideId, setDestinationData, setDataError, coordinates, currentDestinationData);
    }
  } catch (error) {
    console.error('Skids fetch failed:', error);

    // Try OTP fallback if Skids fails
    if (USE_SKIDS) {
      try {
        console.log('Falling back to OTP...');
        await fetchOtpDestinations(destList, slideId, setDestinationData, setDataError, coordinates, currentDestinationData);
        return;
      } catch (otpError) {
        console.error('OTP fallback also failed:', otpError);
      }
    }

    setDataError(slideId, true);
  }
}

/**
 * Original OTP implementation is used as fallback or when Skids is disabled
 */
async function fetchOtpDestinations(
  destList: { name: string; coordinates: { lat: number; lng: number } }[],
  slideId: string,
  setDestinationData: (slideId: string, data: any[]) => void,
  setDataError: (slideId: string, error: boolean) => void,
  coordinates: { lat: number; lng: number },
  currentDestinationData: any[] = []
) {
  const results = await Promise.allSettled(
    destList.map(async (dest) => {
      const origin = `${coordinates.lat},${coordinates.lng}`;
      const destination = `${dest.coordinates.lat},${dest.coordinates.lng}`;
      return fetchTransitData(origin, destination);
    })
  );

  const enrichedDestinations = results.map((res, index) => {
    const previousData = currentDestinationData.find((d) => d.name === destList[index].name);
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
    }
    // Fall back to previous data if available
    if (previousData) {
      return {
        name: previousData.name || destList[index].name,
        route: previousData.route ?? null,
        departure: previousData.departure ?? null,
        arrival: previousData.arrival ?? null,
        travel: previousData.travel ?? null,
        legs: Array.isArray(previousData.legs) ? previousData.legs : [],
        coordinates: previousData.coordinates ?? destList[index].coordinates,
        dark: typeof previousData.dark === "boolean" ? previousData.dark : index % 2 === 0,
      };
    }
    return {
      name: destList[index].name,
      route: null,
      departure: null,
      arrival: null,
      travel: null,
      legs: [],
      coordinates: destList[index].coordinates,
      dark: index % 2 === 0,
    };
  });

  const anySuccess = enrichedDestinations.some(
    (d) => d.departure || d.arrival || d.travel || (Array.isArray(d.legs) && d.legs.length > 0)
  );

  setDataError(slideId, !anySuccess);
  setDestinationData(slideId, enrichedDestinations);
}
