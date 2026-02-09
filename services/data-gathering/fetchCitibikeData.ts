import { useGeneralStore } from "@/stores/general";
import { useCitibikeStore } from "@/stores/citibike";

const SKIDS_URL = "https://api-stage.etch.app/skids";

export async function fetchCitibikeData(slideId: string) {
  const coordinates = useGeneralStore.getState().coordinates;
  if (!coordinates) {
    console.error("[CITIBIKE] No coordinates available");
    useCitibikeStore.getState().setDataError(slideId, true);
    return;
  }

  const { lat, lng } = coordinates;
  const searchRadius = useCitibikeStore.getState().slides[slideId]?.searchRadius || 0.5;

  try {
    const response = await fetch(
      `${SKIDS_URL}/api/gbfs/stations/nearby?lat=${lat}&lon=${lng}&radius=${searchRadius}&system=citibike-nyc`
    );

    if (!response.ok) {
      throw new Error(`GBFS API error: ${response.status}`);
    }

    const data = await response.json();

    // Response already matches CitibikeStation interface, sorted by distance
    useCitibikeStore.getState().setStationData(slideId, data.stations);
    useCitibikeStore.getState().setDataError(slideId, false);

    console.log(`[CITIBIKE] Data fetched: ${data.stations.length} stations within ${searchRadius} mi for slide ${slideId}`);
  } catch (error) {
    console.error("[CITIBIKE] Failed to fetch citibike data:", error);
    useCitibikeStore.getState().setDataError(slideId, true);
  }
}
