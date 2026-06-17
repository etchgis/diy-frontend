import { useCitibikeStore, KNOWN_PROVIDERS, type RentalStation } from "./store";
import { useGeneralStore } from "@/stores/general";
import { fetchCitibikeData } from "@/services/data-gathering/fetchCitibikeData";
import { fetchAllStops } from "@/services/data-gathering/fetchAllStops";
import { useResScale } from "@/hooks/useResScale";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Footer from "@/components/shared-components/footer";
import HtmlTextEditor from "@/components/shared-components/html-text-editor";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY as string;
if (typeof window !== 'undefined') mapboxgl.prewarm();

const EMPTY_STATIONS: RentalStation[] = [];

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
  const transitMarkersRef = useRef<mapboxgl.Marker[]>([]);
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
  const selectedProvider = useCitibikeStore(
    (state) => state.slides[slideId]?.selectedProvider ?? KNOWN_PROVIDERS[0]
  );
  const dataError = useCitibikeStore(
    (state) => state.slides[slideId]?.dataError || false
  );
  const dataLoaded = useCitibikeStore(
    (state) => state.slides[slideId]?.dataLoaded ?? false
  );
  const vehicleMarkerColor = useCitibikeStore(
    (state) => state.slides[slideId]?.vehicleMarkerColor || '#22C55E'
  );
  const mutedMap = useCitibikeStore(
    (state) => state.slides[slideId]?.mutedMap !== false
  );
  const showTransitStops = useCitibikeStore(
    (state) => state.slides[slideId]?.showTransitStops !== false
  );
  const showTitle = useCitibikeStore(
    (state) => state.slides[slideId]?.showTitle !== false
  );
  const titleTextSize = useCitibikeStore(
    (state) => state.slides[slideId]?.titleTextSize || 5
  );
  const contentTextSize = useCitibikeStore(
    (state) => state.slides[slideId]?.contentTextSize || 5
  );

  const coordinates = useGeneralStore((state) => state.coordinates);
  const defaultFontFamily = useGeneralStore((state) => state.defaultFontFamily);
  const showFooter = useGeneralStore((state) => state.slides.find((s) => s.id === slideId)?.showFooter ?? true);
  const logoBaseHeight = useGeneralStore((state) => state.logoBaseHeight);
  const resolution = useGeneralStore((state) => state.resolution);
  const resScale = useResScale(resolution);
  const logoHeight = isEditor ? logoBaseHeight : logoBaseHeight * resScale;

  // Convert 1-10 scale to multiplier (5 = 1.0x, 1 = 0.6x, 10 = 1.5x)
  const titleSizeMultiplier = 0.5 + titleTextSize * 0.1;
  const contentSizeMultiplier = 0.5 + contentTextSize * 0.1;

  // Fetch data on mount in editor mode
  useEffect(() => {
    if (isEditor && coordinates && !hasFetched.current) {
      hasFetched.current = true;
      fetchCitibikeData(slideId);
    }
  }, [isEditor, coordinates, slideId]);

  // Initialize map — defer until the container has real pixel dimensions
  useEffect(() => {
    if (!mapContainerRef.current || !coordinates) return;
    if (mapRef.current) return;

    const container = mapContainerRef.current;
    let initObserver: ResizeObserver | null = null;

    const handleWindowResize = () => {
      if (mapRef.current) setTimeout(() => mapRef.current?.resize(), 100);
    };

    const initMap = () => {
      if (mapRef.current) return;
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;

      initObserver?.disconnect();
      initObserver = null;

      const map = new mapboxgl.Map({
        container,
        style: mutedMap ? "mapbox://styles/mapbox/light-v11" : "mapbox://styles/mapbox/streets-v12",
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
        addTransitStopMarkers();
      });

      mapRef.current = map;

      if ("ResizeObserver" in window) {
        resizeObserverRef.current = new ResizeObserver(() => {
          if (mapRef.current) setTimeout(() => mapRef.current?.resize(), 100);
        });
        resizeObserverRef.current.observe(container);
      }

      window.addEventListener("resize", handleWindowResize);
    };

    initMap();
    if (!mapRef.current && "ResizeObserver" in window) {
      initObserver = new ResizeObserver(initMap);
      initObserver.observe(container);
    }

    return () => {
      initObserver?.disconnect();
      resizeObserverRef.current?.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      transitMarkersRef.current.forEach((m) => m.remove());
      transitMarkersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      isMapLoadedRef.current = false;
    };
  }, [coordinates]);

  // Update markers when station data or marker color changes
  useEffect(() => {
    if (isMapLoadedRef.current) {
      addMarkers();
    }
  }, [stationData, vehicleMarkerColor]);

  useEffect(() => {
    if (!mapRef.current) return;
    const style = mutedMap ? "mapbox://styles/mapbox/light-v11" : "mapbox://styles/mapbox/streets-v12";
    mapRef.current.setStyle(style);
    mapRef.current.once("style.load", () => { addMarkers(); addTransitStopMarkers(); });
  }, [mutedMap]);

  useEffect(() => {
    if (isMapLoadedRef.current) addTransitStopMarkers();
  }, [showTransitStops]);

  function getMarkerColor(bikes: number): string {
    if (bikes === 0) return "#DC2626";
    if (bikes <= 5) return "#D97706";
    return "#16a34a";
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

    // Station/vehicle markers
    const isScooter = selectedProvider.vehicleType === 'scooter';
    for (const station of stationData) {
      const el = document.createElement("div");
      if (isScooter) {
        // const rangeMiles = station.currentRangeMeters != null
        //   ? Math.round(station.currentRangeMeters / 1609.34)
        //   : null;
        el.style.cssText = `
          width: 14px;
          height: 14px;
          background: ${vehicleMarkerColor};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
          cursor: default;
        `;
        // if (rangeMiles != null) {
        //   el.textContent = `${rangeMiles}mi`;
        // }
      } else {
        const totalBikes = station.bikesAvailable;
        const color = getMarkerColor(totalBikes);
        const scale = isEditor ? 1 : Math.max(resScale * 1.25, 1.1);
        const size = Math.round(48 * scale);
        const font = Math.round(15 * scale);
        const border = Math.round(3 * scale);
        el.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: ${border}px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: ${font}px;
          color: white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.5);
          cursor: default;
        `;
        el.textContent = String(totalBikes);
      }

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

  async function addTransitStopMarkers() {
    transitMarkersRef.current.forEach((m) => m.remove());
    transitMarkersRef.current = [];
    if (!mapRef.current || !coordinates || !showTransitStops) return;

    try {
      const stops = await fetchAllStops({ coordinates, radius: 600 });
      if (!Array.isArray(stops) || !mapRef.current) return;

      const clusters = new Map<string, {
        lat: number; lon: number;
        routes: { shortName: string; color: string; textColor: string }[];
      }>();

      for (const stop of stops) {
        if (!stop.lat || !stop.lon) continue;
        const key = `${stop.lat.toFixed(3)}_${stop.lon.toFixed(3)}`;
        if (!clusters.has(key)) clusters.set(key, { lat: stop.lat, lon: stop.lon, routes: [] });
        const cluster = clusters.get(key)!;

        for (const service of (stop.services || [])) {
          const agency = service.agencyName || '';
          const isCommuterRail = /long island rail road|lirr|metro.north railroad|staten island railway|nj transit rail|amtrak/i.test(agency);
          const isMTATransit = /mta new york city transit/i.test(agency);

          const commuterLabel = /long island rail road|lirr/i.test(agency) ? 'LIRR'
            : /metro.north/i.test(agency) ? 'MNR'
            : /staten island railway/i.test(agency) ? 'SIR'
            : /nj transit/i.test(agency) ? 'NJT'
            : /amtrak/i.test(agency) ? 'AMT'
            : null;
          const commuterColor = /long island rail road|lirr/i.test(agency) ? '003DA5'
            : /metro.north/i.test(agency) ? '003DA5'
            : /nj transit/i.test(agency) ? '003DA5'
            : '444444';

          if (isCommuterRail && commuterLabel) {
            if (!cluster.routes.find((r) => r.shortName === commuterLabel)) {
              const firstRouteColor = (service.routes || [])[0]?.color || commuterColor;
              cluster.routes.push({
                shortName: commuterLabel,
                color: firstRouteColor,
                textColor: 'FFFFFF',
              });
            }
            continue;
          }

          for (const route of (service.routes || [])) {
            const sn = (route.shortName || '').trim();
            if (!sn || !route.color) continue;
            const isSubwayLine = isMTATransit && /^([1-7]|[ACEJZNSRLMGBDFWQ])$/.test(sn);
            if (!isSubwayLine) continue;
            if (cluster.routes.find((r) => r.shortName === sn)) continue;
            cluster.routes.push({
              shortName: sn,
              color: route.color,
              textColor: route.textColor || 'FFFFFF',
            });
          }
        }
      }

      const scale = isEditor ? 1 : Math.max(resScale, 1);
      const bulletSize = Math.round(22 * scale);
      const bulletFont = Math.round(12 * scale);
      const gap = Math.round(3 * scale);
      const triSize = Math.round(7 * scale);

      for (const cluster of clusters.values()) {
        if (cluster.routes.length === 0) continue;

        const el = document.createElement('div');
        el.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: none;
        `;

        const bubble = document.createElement('div');
        bubble.style.cssText = `
          background: rgba(255,255,255,0.6);
          border-radius: ${Math.round(6 * scale)}px;
          padding: ${Math.round(4 * scale)}px ${Math.round(5 * scale)}px;
          display: flex;
          gap: ${gap}px;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: ${Math.round(1.5 * scale)}px solid rgba(0,0,0,0.08);

        `;

        for (const route of cluster.routes.slice(0, 4)) {
          const bullet = document.createElement('div');
          bullet.style.cssText = `
            width: ${bulletSize}px;
            height: ${bulletSize}px;
            background: #${route.color};
            color: #${route.textColor};
            font-size: ${bulletFont}px;
            font-weight: 900;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: ${Math.round(2 * scale)}px solid white;
            line-height: 1;
            font-family: sans-serif;
            flex-shrink: 0;
          `;
          bullet.textContent = route.shortName;
          bubble.appendChild(bullet);
        }

        if (cluster.routes.length > 4) {
          const more = document.createElement('div');
          more.style.cssText = `
            font-size: ${Math.round(9 * scale)}px; font-weight: 700;
            color: #555; padding: 0 2px;
          `;
          more.textContent = `+${cluster.routes.length - 4}`;
          bubble.appendChild(more);
        }

        // Downward-pointing triangle
        const triangle = document.createElement('div');
        triangle.style.cssText = `
          width: 0;
          height: 0;
          border-left: ${triSize}px solid transparent;
          border-right: ${triSize}px solid transparent;
          border-top: ${triSize}px solid rgba(255,255,255,0.75);
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
        `;

        el.appendChild(bubble);
        el.appendChild(triangle);

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([cluster.lon, cluster.lat])
          .addTo(mapRef.current);
        // Lift the Mapbox wrapper above Citi Bike station circles
        const wrapper = el.parentElement;
        if (wrapper) wrapper.style.zIndex = '20';
        transitMarkersRef.current.push(marker);
      }
    } catch (err) {
      console.warn('[CitibikePreview] Transit stops fetch failed:', err);
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
        fontFamily: defaultFontFamily && defaultFontFamily !== 'System Default' ? defaultFontFamily : undefined,
      }}
    >
      {/* Title + Logo */}
      {showTitle && (
        <div className="p-3 border-b border-white/20 flex-shrink-0 flex items-center">
          <div
            className={`flex-1 rounded px-4 ${
              isEditor ? "border-2 border-[#11d1f7] py-2" : ""
            }`}
          >
            {isEditor ? (
              <HtmlTextEditor
                content={title}
                onChange={(html) => setTitle(slideId, html)}
                textColor={titleColor}
                fontSize={Math.round(36 * titleSizeMultiplier)}
                minHeight="1.4em"
              />
            ) : (
              <div
                className="w-full bg-transparent font-light rich-text-content"
                style={{
                  color: titleColor,
                  fontSize: `${6 * titleSizeMultiplier}cqh`,
                  lineHeight: "1.2",
                }}
                dangerouslySetInnerHTML={{ __html: title || "" }}
              />
            )}
          </div>
          {logoImage && (
            <img
              src={logoImage}
              alt="Logo"
              className="object-contain ml-4 flex-shrink-0"
              style={{ height: logoHeight }}
            />
          )}
        </div>
      )}

      {/* Content: Map + Station List */}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 relative" style={{ width: "75%" }}>
          {dataError ? (
            <div className="w-full h-full flex items-center justify-center">
              <p
                style={{
                  color: textColor,
                  opacity: 0.7,
                  fontSize: isEditor ? `${16 * contentSizeMultiplier}px` : `${3 * contentSizeMultiplier}cqh`,
                }}
              >
                Unable to load {selectedProvider.name} data. Please check your location.
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
                fontSize: isEditor ? `${12.8 * contentSizeMultiplier}px` : `${1.8 * contentSizeMultiplier}cqh`,
              }}
            >
              {!coordinates
                ? "No location set"
                : !dataLoaded
                ? "Loading..."
                : `No ${selectedProvider.vehicleType === 'scooter' ? 'scooters' : 'stations'} found nearby. Try increasing the search radius.`}
            </div>
          ) : selectedProvider.vehicleType === 'scooter' ? (
            <div className="p-2">
              <div
                className="font-medium mb-2 pb-1"
                style={{
                  fontSize: isEditor ? `${24 * contentSizeMultiplier}px` : `${3 * contentSizeMultiplier}cqh`,
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {selectedProvider.name}
              </div>
              <div
                className="mt-3"
                style={{ fontSize: isEditor ? `${40 * contentSizeMultiplier}px` : `${5 * contentSizeMultiplier}cqh`, fontWeight: 700 }}
              >
                {stationData.length}
              </div>
              <div
                style={{
                  fontSize: isEditor ? `${16 * contentSizeMultiplier}px` : `${2.2 * contentSizeMultiplier}cqh`,
                  opacity: 0.75,
                  marginTop: "2px",
                }}
              >
                scooters nearby
              </div>
              {stationData[0] && (
                <div
                  className="mt-3"
                  style={{ fontSize: isEditor ? `${15 * contentSizeMultiplier}px` : `${2 * contentSizeMultiplier}cqh` }}
                >
                  <div style={{ opacity: 0.7 }}>Nearest</div>
                  <div style={{ fontWeight: 600 }}>{stationData[0].distance} mi</div>
                </div>
              )}
              <div
                className="mt-3 pt-2"
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                  fontSize: isEditor ? `${14 * contentSizeMultiplier}px` : `${1.9 * contentSizeMultiplier}cqh`,
                }}
              >
                {[
                  { label: "Within 0.1 mi",         fn: (d: number) => d <= 0.1 },
                  { label: "0.1 mi – 0.25 mi",       fn: (d: number) => d > 0.1 && d <= 0.25 },
                  { label: "Further than 0.25 mi",   fn: (d: number) => d > 0.25 },
                ].map(({ label, fn }) => {
                  const count = stationData.filter((s) => fn(s.distance)).length;
                  return (
                    <div key={label} className="flex justify-between mb-1" style={{ opacity: 0.85 }}>
                      <span>{label}</span>
                      <span style={{ fontWeight: 600 }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-2">
              <div
                className="font-medium mb-2 pb-1"
                style={{
                  fontSize: isEditor ? `${24 * contentSizeMultiplier}px` : `${3 * contentSizeMultiplier}cqh`,
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {selectedProvider.name}
              </div>
              {stationData.map((station) => {
                const total = station.vehiclesAvailable ?? station.bikesAvailable;
                const regularBikes = station.bikesAvailable - station.ebikesAvailable;
                return (
                  <div
                    key={station.stationId}
                    className="mb-2 pb-2"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <div
                      className="font-medium"
                      style={{ fontSize: isEditor ? `${13.6 * contentSizeMultiplier}px` : `${2 * contentSizeMultiplier}cqh` }}
                    >
                      {station.name}
                    </div>
                    <div
                      className="mt-1"
                      style={{
                        fontSize: isEditor ? `${11.2 * contentSizeMultiplier}px` : `${1.7 * contentSizeMultiplier}cqh`,
                        opacity: 0.8,
                      }}
                    >
                      <div className="flex justify-between">
                        <span>Bikes: {regularBikes} | E-Bikes: {station.ebikesAvailable}</span>
                        <span>{station.distance} mi</span>
                      </div>
                      <div
                        style={{
                          color: total === 0 ? "#DC2626" : total <= 5 ? "#D97706" : "#16a34a",
                          fontWeight: 600,
                          marginTop: "2px",
                        }}
                      >
                        Total: {total}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {showFooter && <Footer previewMode={previewMode} />}
    </div>
  );
}
