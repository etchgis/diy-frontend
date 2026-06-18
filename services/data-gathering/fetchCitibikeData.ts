import { useGeneralStore } from "@/stores/general";
import { useCitibikeStore } from "@/modules/citibike/store";

export async function fetchCitibikeData(slideId: string) {
  const coordinates = useGeneralStore.getState().coordinates;
  if (!coordinates) {
    console.error("[CITIBIKE] No coordinates available");
    useCitibikeStore.getState().setDataError(slideId, true);
    useCitibikeStore.getState().setDataLoaded(slideId, true);
    return;
  }

  useCitibikeStore.getState().setDataLoaded(slideId, false);

  const { lat, lng } = coordinates;
  const slide = useCitibikeStore.getState().slides[slideId];
  const searchRadius = slide?.searchRadius || 0.5;
  const systemId = slide?.selectedProvider?.id ?? 'citibike-nyc';

  try {
    const response = await fetch(
      `/api/skids-gbfs?lat=${lat}&lon=${lng}&radius=${searchRadius}&system=${encodeURIComponent(systemId)}`
    );

    if (!response.ok) {
      throw new Error(`GBFS API error: ${response.status}`);
    }

    const data = await response.json();

    useCitibikeStore.getState().setStationData(slideId, data.stations);
    useCitibikeStore.getState().setDataError(slideId, false);
    useCitibikeStore.getState().setDataLoaded(slideId, true);
  } catch (error) {
    console.error("[CITIBIKE] Failed to fetch citibike data:", error);
    useCitibikeStore.getState().setDataError(slideId, true);
    useCitibikeStore.getState().setDataLoaded(slideId, true);
  }
}
