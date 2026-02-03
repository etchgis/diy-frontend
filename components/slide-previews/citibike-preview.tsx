import { useCitibikeStore, type CitibikeStation } from "@/stores/citibike";
import { useGeneralStore } from "@/stores/general";
import { fetchCitibikeData } from "@/services/data-gathering/fetchCitibikeData";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Footer from "../shared-components/footer";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY as string;

const EMPTY_STATIONS: CitibikeStation[] = [];

export default function CitibikePreview({
  slideId,
  previewMode = false,
}: {
  slideId: string;
  previewMode?: boolean;
}) {
  const pathname = usePathname();
  const isEditor = pathname.includes("/editor") && !previewMode;
  const hasFetched = useRef(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isMapLoadedRef = useRef(false);

  const title = useCitibikeStore((state) => state.slides[slideId]?.title || "");
  const setTitle = useCitibikeStore((state) => state.setTitle);
  const backgroundColor = useCitibikeStore(
    (state) => state.slides[slideId]?.backgroundColor || "#192F51"
  );
  const bgImage = useCitibikeStore(
    (state) => state.slides[slideId]?.bgImage || ""
  );
  const titleColor = useCitibikeStore(
    (state) => state.slides[slideId]?.titleColor || "#ffffff"
  );
  const textColor = useCitibikeStore(
    (state) => state.slides[slideId]?.textColor || "#ffffff"
  );
  const logoImage = useCitibikeStore(
    (state) => state.slides[slideId]?.logoImage || ""
  );
  const stationData = useCitibikeStore(
    (state) => state.slides[slideId]?.stationData ?? EMPTY_STATIONS
  );
  const dataError = useCitibikeStore(
    (state) => state.slides[slideId]?.dataError || false
  );

  const coordinates = useGeneralStore((state) => state.coordinates);

  // Fetch data on mount in editor mode
  useEffect(() => {
    if (isEditor && coordinates && !hasFetched.current) {
      hasFetched.current = true;
      fetchCitibikeData(slideId);
    }
  }, [isEditor, coordinates, slideId]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !coordinates) return;
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [coordinates.lng, coordinates.lat],
      zoom: 14,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.AttributionControl({
        compact: true,
        customAttribution: "© Mapbox © OpenStreetMap",
      }),
      "top-right"
    );

    map.dragPan.disable();
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
    map.keyboard.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();

    map.on("load", () => {
      isMapLoadedRef.current = true;
      addMarkers();
    });

    mapRef.current = map;

    // ResizeObserver
    if (mapContainerRef.current && "ResizeObserver" in window) {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (mapRef.current) {
          setTimeout(() => mapRef.current?.resize(), 100);
        }
      });
      resizeObserverRef.current.observe(mapContainerRef.current);
    }

    const handleWindowResize = () => {
      if (mapRef.current) {
        setTimeout(() => mapRef.current?.resize(), 100);
      }
    };
    window.addEventListener("resize", handleWindowResize);

    return () => {
      resizeObserverRef.current?.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      isMapLoadedRef.current = false;
    };
  }, [coordinates]);

  // Update markers when station data changes
  useEffect(() => {
    if (isMapLoadedRef.current) {
      addMarkers();
    }
  }, [stationData]);

  function getMarkerColor(bikes: number): string {
    if (bikes === 0) return "#EF4444";
    if (bikes <= 5) return "#EAB308";
    return "#22C55E";
  }

  function addMarkers() {
    if (!mapRef.current || !coordinates) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Origin marker
    const originEl = document.createElement("div");
    originEl.style.cssText = `
      width: 20px;
      height: 20px;
      background: #FF4444;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    `;
    const originMarker = new mapboxgl.Marker({
      element: originEl,
      anchor: "center",
    })
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(mapRef.current);
    markersRef.current.push(originMarker);

    // Station markers
    for (const station of stationData) {
      const color = getMarkerColor(station.bikesAvailable);
      const el = document.createElement("div");
      el.style.cssText = `
        width: 28px;
        height: 28px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 11px;
        color: white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: default;
      `;
      el.textContent = String(station.bikesAvailable);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([station.lon, station.lat])
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    }

    // Fit bounds
    if (stationData.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([coordinates.lng, coordinates.lat]);
      for (const s of stationData) {
        bounds.extend([s.lon, s.lat]);
      }
      mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 16 });
    }
  }

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden relative"
      style={{
        backgroundColor: !bgImage ? backgroundColor : undefined,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor,
      }}
    >
      {/* Title + Logo */}
      <div className="p-3 border-b border-white/20 flex-shrink-0 flex items-center">
        <div
          className={`flex-1 rounded px-4 ${
            isEditor ? "border-2 border-[#11d1f7] py-2" : ""
          }`}
        >
          {isEditor ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(slideId, e.target.value)}
              placeholder="Type title here"
              className="w-full bg-transparent outline-none text-4xl font-light placeholder-white/50"
              style={{ color: titleColor }}
            />
          ) : (
            <div
              className="w-full bg-transparent font-light"
              style={{
                color: titleColor,
                fontSize: "clamp(1.5rem, 6vh, 8rem)",
                lineHeight: "1.2",
              }}
            >
              {title || ""}
            </div>
          )}
        </div>
        {logoImage && (
          <img
            src={logoImage}
            alt="Logo"
            className="max-h-16 object-contain ml-4 flex-shrink-0"
          />
        )}
      </div>

      {/* Content: Map + Station List */}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 relative" style={{ width: "75%" }}>
          {dataError ? (
            <div className="w-full h-full flex items-center justify-center">
              <p
                style={{
                  color: textColor,
                  opacity: 0.7,
                  fontSize: isEditor ? "1rem" : "3vh",
                }}
              >
                Unable to load Citibike data. Please check your location.
              </p>
            </div>
          ) : (
            <div
              ref={mapContainerRef}
              className="absolute inset-0"
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </div>

        <div
          className="overflow-y-auto"
          style={{
            width: "25%",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          {stationData.length === 0 && !dataError ? (
            <div
              className="p-3 text-center"
              style={{
                opacity: 0.7,
                fontSize: isEditor ? "0.8rem" : "1.8vh",
              }}
            >
              {coordinates ? "Loading stations..." : "No location set"}
            </div>
          ) : (
            <div className="p-2">
              <div
                className="font-medium mb-2 pb-1"
                style={{
                  fontSize: isEditor ? "0.85rem" : "2.2vh",
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                Nearby Stations
              </div>
              {stationData.map((station) => (
                <div
                  key={station.stationId}
                  className="mb-2 pb-2"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="font-medium"
                    style={{ fontSize: isEditor ? "0.75rem" : "1.8vh" }}
                  >
                    {station.name}
                  </div>
                  <div
                    className="flex justify-between mt-1"
                    style={{
                      fontSize: isEditor ? "0.65rem" : "1.5vh",
                      opacity: 0.8,
                    }}
                  >
                    <span
                      style={{
                        color:
                          station.bikesAvailable === 0
                            ? "#EF4444"
                            : station.bikesAvailable <= 5
                            ? "#EAB308"
                            : "#22C55E",
                        fontWeight: 600,
                      }}
                    >
                      {station.bikesAvailable} bikes
                    </span>
                    <span>{station.distance} mi</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
