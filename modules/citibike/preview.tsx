import { proxyImageUrl } from "@/utils/proxyImageUrl";
import { useCitibikeStore, KNOWN_PROVIDERS, type GbfsProvider, type RentalStation } from "./store";
import { useGeneralStore } from "@/stores/general";
import { fetchCitibikeData } from "@/services/data-gathering/fetchCitibikeData";
import { fetchAllStops } from "@/services/data-gathering/fetchAllStops";
import { useResScale } from "@/hooks/useResScale";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Footer from "@/components/shared-components/footer";
import HtmlTextEditor from "@/components/shared-components/html-text-editor";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY as string;
if (typeof window !== 'undefined') mapboxgl.prewarm();

const EMPTY_STATIONS: RentalStation[] = [];
const EMPTY_PROVIDER_DATA: Record<string, RentalStation[]> = {};

function resolveProviders(slide: any): GbfsProvider[] {
  if (slide?.selectedProviders?.length) return slide.selectedProviders;
  const legacy = slide?.selectedProvider;
  if (legacy) return [legacy];
  return [KNOWN_PROVIDERS[0]];
}

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
  const addMarkersRef = useRef<() => void>(() => {});
  const addTransitStopMarkersRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const title = useCitibikeStore((state) => state.slides[slideId]?.title || "");
  const setTitle = useCitibikeStore((state) => state.setTitle);
  const backgroundColor = useCitibikeStore((state) => state.slides[slideId]?.backgroundColor || "#192F51");
  const bgImage = useCitibikeStore((state) => state.slides[slideId]?.bgImage || "");
  const titleColor = useCitibikeStore((state) => state.slides[slideId]?.titleColor || "#ffffff");
  const textColor = useCitibikeStore((state) => state.slides[slideId]?.textColor || "#ffffff");
  const logoImage = useCitibikeStore((state) => state.slides[slideId]?.logoImage || "");
  const stationData = useCitibikeStore((state) => state.slides[slideId]?.stationData ?? EMPTY_STATIONS);
  const providerData = useCitibikeStore((state) => state.slides[slideId]?.providerData ?? EMPTY_PROVIDER_DATA);
  const slideRaw = useCitibikeStore((state) => state.slides[slideId]);
  const selectedProviders = resolveProviders(slideRaw);
  const dataError = useCitibikeStore((state) => state.slides[slideId]?.dataError || false);
  const dataLoaded = useCitibikeStore((state) => state.slides[slideId]?.dataLoaded ?? false);
  const mutedMap = useCitibikeStore((state) => state.slides[slideId]?.mutedMap !== false);
  const showTransitStops = useCitibikeStore((state) => state.slides[slideId]?.showTransitStops !== false);
  const showTitle = useCitibikeStore((state) => state.slides[slideId]?.showTitle !== false);
  const titleTextSize = useCitibikeStore((state) => state.slides[slideId]?.titleTextSize || 5);
  const contentTextSize = useCitibikeStore((state) => state.slides[slideId]?.contentTextSize || 5);

  const coordinates = useGeneralStore(
    (state) => state.coordinates,
    (a, b) => a?.lat === b?.lat && a?.lng === b?.lng
  );
  const defaultFontFamily = useGeneralStore((state) => state.defaultFontFamily);
  const showFooter = useGeneralStore((state) => state.slides.find((s) => s.id === slideId)?.showFooter ?? true);
  const logoBaseHeight = useGeneralStore((state) => state.logoBaseHeight);
  const resolution = useGeneralStore((state) => state.resolution);
  const resScale = useResScale(resolution);
  const logoHeight = isEditor ? logoBaseHeight : logoBaseHeight * resScale;

  const titleSizeMultiplier = 0.5 + titleTextSize * 0.1;
  const contentSizeMultiplier = 0.5 + contentTextSize * 0.1;

  useEffect(() => {
    if (isEditor && coordinates && !hasFetched.current) {
      hasFetched.current = true;
      fetchCitibikeData(slideId);
    }
  }, [isEditor, coordinates, slideId]);

  useEffect(() => {
    if (!mapContainerRef.current || !coordinates) return;
    if (mapRef.current) return;

    const container = mapContainerRef.current;
    let initObserver: ResizeObserver | null = null;
    let destroyed = false;

    const handleWindowResize = () => {
      if (mapRef.current) setTimeout(() => mapRef.current?.resize(), 100);
    };

    const initMap = () => {
      if (destroyed) return;
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
        new mapboxgl.AttributionControl({ compact: true, customAttribution: "© Mapbox © OpenStreetMap" }),
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
        if (destroyed) { map.remove(); return; }
        isMapLoadedRef.current = true;
        addMarkersRef.current();
        addTransitStopMarkersRef.current();
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
      destroyed = true;
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

  useEffect(() => {
    if (isMapLoadedRef.current) addMarkers();
  }, [stationData, providerData]);

  useEffect(() => {
    if (!mapRef.current) return;
    const style = mutedMap ? "mapbox://styles/mapbox/light-v11" : "mapbox://styles/mapbox/streets-v12";
    mapRef.current.setStyle(style);
    mapRef.current.once("style.load", () => { addMarkersRef.current(); addTransitStopMarkersRef.current(); });
  }, [mutedMap]);

  useEffect(() => {
    if (isMapLoadedRef.current) addTransitStopMarkers();
  }, [showTransitStops]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.resize();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  function getBikeMarkerColor(bikes: number): string {
    if (bikes === 0) return "#DC2626";
    if (bikes <= 5) return "#D97706";
    return "#16a34a";
  }

  function getProviderInitial(providerId: string): string {
    if (providerId.startsWith('citibike')) return 'C';
    if (providerId.startsWith('bird')) return 'B';
    if (providerId.startsWith('lime')) return 'L';
    if (providerId.startsWith('veo')) return 'V';
    return '?';
  }

  function addMarkers() {
    if (!mapRef.current || !coordinates) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const originEl = document.createElement("div");
    originEl.style.cssText = `
      width: 20px; height: 20px;
      background: #FF4444;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    `;
    markersRef.current.push(
      new mapboxgl.Marker({ element: originEl, anchor: "center" })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(mapRef.current)
    );

    const scale = isEditor ? 1 : Math.max(resScale * 1.25, 1.1);

    for (const provider of selectedProviders) {
      const stations = providerData[provider.id] ?? [];
      const initial = getProviderInitial(provider.id);

      for (const station of stations) {
        const el = document.createElement("div");

        if (provider.vehicleType === 'scooter') {
          const dotSize = Math.round(22 * scale);
          const fontSize = Math.round(11 * scale);
          el.style.cssText = `
            width: ${dotSize}px; height: ${dotSize}px;
            background: ${provider.brandColor};
            border: ${Math.round(2 * scale)}px solid white;
            border-radius: 50%;
            box-shadow: 0 1px 4px rgba(0,0,0,0.4);
            cursor: default;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: ${fontSize}px; font-weight: 700;
            font-family: sans-serif; line-height: 1;
          `;
          el.textContent = initial;
        } else {
          const totalBikes = station.bikesAvailable;
          const color = getBikeMarkerColor(totalBikes);
          const size = Math.round(48 * scale);
          const font = Math.round(15 * scale);
          const border = Math.round(3 * scale);
          el.style.cssText = `
            width: ${size}px; height: ${size}px;
            background: ${color};
            border: ${border}px solid white;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: ${font}px;
            color: white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.5);
            cursor: default;
          `;
          el.textContent = String(totalBikes);
        }

        markersRef.current.push(
          new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([station.lon, station.lat])
            .addTo(mapRef.current!)
        );
      }
    }

    if (stationData.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([coordinates.lng, coordinates.lat]);
      for (const s of stationData) bounds.extend([s.lon, s.lat]);
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
              cluster.routes.push({ shortName: commuterLabel, color: firstRouteColor, textColor: 'FFFFFF' });
            }
            continue;
          }

          for (const route of (service.routes || [])) {
            const sn = (route.shortName || '').trim();
            if (!sn || !route.color) continue;
            const isSubwayLine = isMTATransit && /^([1-7]|[ACEJZNSRLMGBDFWQ])$/.test(sn);
            if (!isSubwayLine) continue;
            if (cluster.routes.find((r) => r.shortName === sn)) continue;
            cluster.routes.push({ shortName: sn, color: route.color, textColor: route.textColor || 'FFFFFF' });
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
        el.style.cssText = `display: flex; flex-direction: column; align-items: center; pointer-events: none;`;

        const bubble = document.createElement('div');
        bubble.style.cssText = `
          background: rgba(255,255,255,0.6);
          border-radius: ${Math.round(6 * scale)}px;
          padding: ${Math.round(4 * scale)}px ${Math.round(5 * scale)}px;
          display: flex; gap: ${gap}px; align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: ${Math.round(1.5 * scale)}px solid rgba(0,0,0,0.08);
        `;

        for (const route of cluster.routes.slice(0, 4)) {
          const bullet = document.createElement('div');
          const isCircle = route.shortName.length === 1;
          const fontSize = route.shortName.length >= 4 ? Math.round(bulletFont * 0.8) : bulletFont;
          bullet.style.cssText = `
            ${isCircle
              ? `width: ${bulletSize}px; height: ${bulletSize}px;`
              : `height: ${bulletSize}px; padding: 0 ${Math.round(4 * scale)}px;`}
            background: #${route.color};
            color: #${route.textColor};
            font-size: ${fontSize}px; font-weight: 900;
            border-radius: ${isCircle ? '50%' : `${Math.round(bulletSize / 4)}px`};
            display: flex; align-items: center; justify-content: center;
            border: ${Math.round(2 * scale)}px solid white;
            line-height: 1; font-family: sans-serif;
            flex-shrink: 0; white-space: nowrap;
          `;
          bullet.textContent = route.shortName;
          bubble.appendChild(bullet);
        }

        if (cluster.routes.length > 4) {
          const more = document.createElement('div');
          more.style.cssText = `font-size: ${Math.round(9 * scale)}px; font-weight: 700; color: #555; padding: 0 2px;`;
          more.textContent = `+${cluster.routes.length - 4}`;
          bubble.appendChild(more);
        }

        const triangle = document.createElement('div');
        triangle.style.cssText = `
          width: 0; height: 0;
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
        const wrapper = el.parentElement;
        if (wrapper) wrapper.style.zIndex = '20';
        transitMarkersRef.current.push(marker);
      }
    } catch (err) {
      console.warn('[CitibikePreview] Transit stops fetch failed:', err);
    }
  }

  addMarkersRef.current = addMarkers;
  addTransitStopMarkersRef.current = addTransitStopMarkers;

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden relative"
      style={{
        backgroundColor: !bgImage ? backgroundColor : undefined,
        backgroundImage: bgImage ? `url(${proxyImageUrl(bgImage)})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor,
        fontFamily: defaultFontFamily && defaultFontFamily !== 'System Default' ? defaultFontFamily : undefined,
      }}
    >
      {showTitle && (
        <div className="p-3 border-b border-white/20 flex-shrink-0 flex items-center">
          <div className={`flex-1 rounded px-4 ${isEditor ? "border-2 border-[#11d1f7] py-2" : ""}`}>
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
                style={{ color: titleColor, fontSize: `${6 * titleSizeMultiplier}cqh`, lineHeight: "1.2" }}
                dangerouslySetInnerHTML={{ __html: title || "" }}
              />
            )}
          </div>
          {logoImage && (
            <img
              src={proxyImageUrl(logoImage)}
              alt="Logo"
              className="object-contain ml-4 flex-shrink-0"
              style={{ height: logoHeight }}
            />
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 relative" style={{ width: "75%" }}>
          {dataError ? (
            <div className="w-full h-full flex items-center justify-center">
              <p style={{
                color: textColor, opacity: 0.7,
                fontSize: isEditor ? `${16 * contentSizeMultiplier}px` : `${3 * contentSizeMultiplier}cqh`,
              }}>
                Unable to load data for one or more providers.
              </p>
            </div>
          ) : (
            <div ref={mapContainerRef} className="absolute inset-0" style={{ width: "100%", height: "100%" }} />
          )}
        </div>

        <div className="overflow-y-auto" style={{ width: "25%", backgroundColor: "rgba(0,0,0,0.3)" }}>
          {stationData.length === 0 && !dataError ? (
            <div
              className="p-3 text-center"
              style={{
                opacity: 0.7,
                fontSize: isEditor ? `${12.8 * contentSizeMultiplier}px` : `${1.8 * contentSizeMultiplier}cqh`,
              }}
            >
              {!coordinates ? "No location set" : !dataLoaded ? "Loading..." : "No vehicles found nearby. Try increasing the search radius."}
            </div>
          ) : (
            <MergedStationList
              selectedProviders={selectedProviders}
              providerData={providerData}
              isEditor={isEditor}
              contentSizeMultiplier={contentSizeMultiplier}
            />
          )}
        </div>
      </div>

      {showFooter && <Footer previewMode={previewMode} />}
    </div>
  );
}

type TaggedStation = RentalStation & { provider: GbfsProvider };

function MergedStationList({
  selectedProviders,
  providerData,
  isEditor,
  contentSizeMultiplier,
}: {
  selectedProviders: GbfsProvider[];
  providerData: Record<string, RentalStation[]>;
  isEditor: boolean;
  contentSizeMultiplier: number;
}) {
  const nameSize = isEditor ? `${13 * contentSizeMultiplier}px` : `${1.9 * contentSizeMultiplier}cqh`;
  const smallSize = isEditor ? `${11 * contentSizeMultiplier}px` : `${1.6 * contentSizeMultiplier}cqh`;

  const merged: TaggedStation[] = [];
  for (const provider of selectedProviders) {
    for (const station of (providerData[provider.id] ?? [])) {
      merged.push({ ...station, provider });
    }
  }
  merged.sort((a, b) => a.distance - b.distance);

  return (
    <div className="p-2">
      {merged.map((station, i) => {
        const isBike = station.provider.vehicleType === 'bike';
        const total = station.vehiclesAvailable ?? station.bikesAvailable;
        const regularBikes = station.bikesAvailable - station.ebikesAvailable;
        const availColor = total === 0 ? "#DC2626" : total <= 5 ? "#D97706" : "#16a34a";

        return (
          <div
            key={`${station.provider.id}-${station.stationId}-${i}`}
            className="pb-2 mb-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-start justify-between gap-1">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate" style={{ fontSize: nameSize }}>
                  {isBike ? station.name : "Scooter"}
                </div>
                <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: smallSize, opacity: 0.7 }}>
                  <span
                    style={{
                      display: 'inline-block', width: '0.6em', height: '0.6em',
                      borderRadius: '50%', background: station.provider.brandColor, flexShrink: 0,
                    }}
                  />
                  {station.provider.name}
                </div>
              </div>
              <div className="flex-shrink-0 text-right" style={{ fontSize: smallSize }}>
                <div style={{ fontWeight: 600 }}>{station.distance} mi</div>
              </div>
            </div>

            {isBike && (
              <div className="mt-1" style={{ fontSize: smallSize }}>
                <span style={{ color: availColor, fontWeight: 600 }}>{total} available</span>
                <span style={{ opacity: 0.65 }}> · {regularBikes} bike{regularBikes !== 1 ? 's' : ''} · {station.ebikesAvailable} e-bike{station.ebikesAvailable !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
