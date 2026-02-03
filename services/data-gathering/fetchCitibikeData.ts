import { useGeneralStore } from "@/stores/general";
import { useCitibikeStore, CitibikeStation } from "@/stores/citibike";

const STATION_INFO_URL = "https://gbfs.citibikenyc.com/gbfs/en/station_information.json";
const STATION_STATUS_URL = "https://gbfs.citibikenyc.com/gbfs/en/station_status.json";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
    const [infoResponse, statusResponse] = await Promise.all([
      fetch(STATION_INFO_URL),
      fetch(STATION_STATUS_URL),
    ]);

    if (!infoResponse.ok) throw new Error(`Station info API error: ${infoResponse.status}`);
    if (!statusResponse.ok) throw new Error(`Station status API error: ${statusResponse.status}`);

    const infoData = await infoResponse.json();
    const statusData = await statusResponse.json();

    const infoStations: any[] = infoData.data.stations;
    const statusStations: any[] = statusData.data.stations;

    // Build status lookup by station_id
    const statusMap = new Map<string, any>();
    for (const s of statusStations) {
      statusMap.set(s.station_id, s);
    }

    // Merge, calculate distance, filter
    const merged: CitibikeStation[] = [];
    for (const info of infoStations) {
      const status = statusMap.get(info.station_id);
      if (!status) continue;
      if (!status.is_installed || !status.is_renting) continue;

      const dist = haversineDistance(lat, lng, info.lat, info.lon);
      if (dist > searchRadius) continue;

      merged.push({
        stationId: info.station_id,
        name: info.name,
        lat: info.lat,
        lon: info.lon,
        bikesAvailable: status.num_bikes_available,
        ebikesAvailable: status.num_ebikes_available,
        docksAvailable: status.num_docks_available,
        distance: Math.round(dist * 100) / 100,
      });
    }

    // Sort by distance
    merged.sort((a, b) => a.distance - b.distance);

    useCitibikeStore.getState().setStationData(slideId, merged);
    useCitibikeStore.getState().setDataError(slideId, false);

    console.log(`[CITIBIKE] Data fetched: ${merged.length} stations within ${searchRadius} mi for slide ${slideId}`);
  } catch (error) {
    console.error("[CITIBIKE] Failed to fetch citibike data:", error);
    useCitibikeStore.getState().setDataError(slideId, true);
  }
}
