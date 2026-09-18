import { useGeneralStore } from "@/stores/general";
import { useCitibikeStore, KNOWN_PROVIDERS } from "@/modules/citibike/store";

const SKIDS_URL = process.env.NEXT_PUBLIC_SKIDS_URL;

export async function fetchCitibikeData(slideId: string) {
  const coordinates = useGeneralStore.getState().coordinates;
  if (!coordinates) {
    useCitibikeStore.getState().setDataError(slideId, true);
    useCitibikeStore.getState().setDataLoaded(slideId, true);
    return;
  }

  const { lat, lng } = coordinates;
  const slide = useCitibikeStore.getState().slides[slideId];
  const searchRadius = slide?.searchRadius || 0.5;

  const providers = resolveProviders(slide);

  const hasExistingData = !!slide?.stationData?.length;
  if (!hasExistingData) {
    useCitibikeStore.getState().setDataLoaded(slideId, false);
  }

  try {
    const results = await Promise.allSettled(
      providers.map((p) =>
        fetch(
          `${SKIDS_URL}/api/gbfs/stations/nearby?lat=${lat}&lon=${lng}&radius=${searchRadius}&system=${encodeURIComponent(p.id)}`
        ).then((r) => {
          if (!r.ok) throw new Error(`GBFS API error: ${r.status}`);
          return r.json();
        })
      )
    );

    const combined: import("@/modules/citibike/store").RentalStation[] = [];
    let anyError = false;

    for (let i = 0; i < providers.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        const stations = result.value.stations ?? [];
        useCitibikeStore.getState().setProviderData(slideId, providers[i].id, stations);
        combined.push(...stations);
      } else {
        useCitibikeStore.getState().setProviderData(slideId, providers[i].id, []);
        anyError = true;
      }
    }

    useCitibikeStore.getState().setStationData(slideId, combined);
    useCitibikeStore.getState().setDataError(slideId, anyError && combined.length === 0);
    useCitibikeStore.getState().setDataLoaded(slideId, true);
  } catch (error) {
    console.error("[CITIBIKE] Failed to fetch data:", error);
    if (!hasExistingData) {
      useCitibikeStore.getState().setDataError(slideId, true);
      useCitibikeStore.getState().setDataLoaded(slideId, true);
    }
  }
}

function resolveProviders(slide: ReturnType<typeof useCitibikeStore.getState>['slides'][string] | undefined) {
  if (!slide) return [KNOWN_PROVIDERS[0]];
  if (slide.selectedProviders?.length) return slide.selectedProviders;
  const legacy = (slide as any).selectedProvider;
  if (legacy) return [legacy];
  return [KNOWN_PROVIDERS[0]];
}
