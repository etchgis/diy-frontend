import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight } from "lucide-react"
import TrafficCorridorPreview from "./preview"
import { useEffect, useRef, useState, useCallback } from "react"
import { useTrafficCorridorStore, type Corridor, type TableLayout } from "./store"
import { useGeneralStore } from "@/stores/general"
import { deleteImage } from "@/services/deleteImage"
import { uploadImage } from "@/services/uploadImage"
import { fetchTrafficData } from "@/services/data-gathering/fetchTrafficData"
import { fetchSkidsTransitData } from "@/services/data-gathering/fetchSkidsDestinationData"
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY as string;

const EMPTY_TABLE = { destination: '', corridors: [] };
const DEFAULT_TABLES = [EMPTY_TABLE, EMPTY_TABLE, EMPTY_TABLE, EMPTY_TABLE];

const TABLE_COLORS = ['#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b'];

const routeAltCache: Record<string, Record<number, { label: string; minutes: number; pathCoords: [number, number][] }[]>> = {};
const selectedAltCache: Record<string, Record<number, number>> = {};

type MapMode = 'origin' | 'dest-0' | 'dest-1' | 'dest-2' | 'dest-3';

interface FetchedAlt {
  label: string;
  minutes: number;
  pathCoords: [number, number][];
}

export default function TrafficCorridorSlide({
  slideId,
  handleDelete,
  handlePreview,
  handlePublish,
}: {
  slideId: string;
  handleDelete: (id: string) => void;
  handlePreview: () => void;
  handlePublish: () => void;
}) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isBgUploading, setIsBgUploading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const renderCount = useRef(0);

  const showTitle = useTrafficCorridorStore((state) => state.slides[slideId]?.showTitle !== false);
  const setShowTitle = useTrafficCorridorStore((state) => state.setShowTitle);
  const backgroundColor = useTrafficCorridorStore((state) => state.slides[slideId]?.backgroundColor || '#192F51');
  const setBackgroundColor = useTrafficCorridorStore((state) => state.setBackgroundColor);
  const tableHeaderColor = useTrafficCorridorStore((state) => state.slides[slideId]?.tableHeaderColor || '#78B1DD');
  const setTableHeaderColor = useTrafficCorridorStore((state) => state.setTableHeaderColor);
  const rowColor = useTrafficCorridorStore((state) => state.slides[slideId]?.rowColor || '#192F51');
  const setRowColor = useTrafficCorridorStore((state) => state.setRowColor);
  const titleColor = useTrafficCorridorStore((state) => state.slides[slideId]?.titleColor || '#ffffff');
  const setTitleColor = useTrafficCorridorStore((state) => state.setTitleColor);
  const textColor = useTrafficCorridorStore((state) => state.slides[slideId]?.textColor || '#ffffff');
  const setTextColor = useTrafficCorridorStore((state) => state.setTextColor);
  const bgImage = useTrafficCorridorStore((state) => state.slides[slideId]?.bgImage || '');
  const setBgImage = useTrafficCorridorStore((state) => state.setBgImage);
  const logoImage = useTrafficCorridorStore((state) => state.slides[slideId]?.logoImage || '');
  const setLogoImage = useTrafficCorridorStore((state) => state.setLogoImage);
  const titleTextSize = useTrafficCorridorStore((state) => state.slides[slideId]?.titleTextSize || 5);
  const setTitleTextSize = useTrafficCorridorStore((state) => state.setTitleTextSize);
  const contentTextSize = useTrafficCorridorStore((state) => state.slides[slideId]?.contentTextSize || 5);
  const setContentTextSize = useTrafficCorridorStore((state) => state.setContentTextSize);
  const tables = useTrafficCorridorStore((state) => state.slides[slideId]?.tables || DEFAULT_TABLES);
  const setTables = useTrafficCorridorStore((state) => state.setTables);
  const storedOrigin = useTrafficCorridorStore((state) => state.slides[slideId]?.origin);
  const setOrigin = useTrafficCorridorStore((state) => state.setOrigin);
  const tableLayout: TableLayout = useTrafficCorridorStore((state) =>
    state.slides[slideId]?.tableLayout ??
    (state.slides[slideId]?.showSecondTable ? 'dual' : 'single')
  );
  const setTableLayout = useTrafficCorridorStore((state) => state.setTableLayout);

  const shortcode = useGeneralStore((state) => state.shortcode || '');
  const coordinates = useGeneralStore((state) => state.coordinates || { lat: 0, lng: 0 });

  const tableCount = tableLayout === 'quad' ? 4 : tableLayout === 'triple' ? 3 : tableLayout === 'dual' ? 2 : 1;

  const [mapMode, setMapMode] = useState<MapMode>('dest-0');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [fetchedAlts, setFetchedAlts] = useState<Record<number, FetchedAlt[]>>(() => routeAltCache[slideId] ?? {});
  const [isFetchingRoutes, setIsFetchingRoutes] = useState<Record<number, boolean>>({});
  const [selectedAltIdx, setSelectedAltIdx] = useState<Record<number, number>>(() => selectedAltCache[slideId] ?? {});

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destMarkersRef = useRef<(mapboxgl.Marker | null)[]>([null, null, null, null]);
  const routeLayersRef = useRef<string[]>([]);
  const mapModeRef = useRef<MapMode>(mapMode);
  const handleOriginChangeRef = useRef<((newOrigin: [number, number]) => void) | null>(null);
  const MAPBOX_KEY = process.env.NEXT_PUBLIC_MAPBOX_KEY;
  const NY_BBOX = '-79.7624,40.4774,-71.7517,45.0153';

  const [queries, setQueries] = useState(() =>
    [0, 1, 2, 3].map(i => tables[i]?.destination || '')
  );
  const [suggestions, setSuggestions] = useState<any[][]>([[], [], [], []]);
  const justSelectedRef = useRef([false, false, false, false]);
  const searchTimeoutsRef = useRef<(NodeJS.Timeout | null)[]>([null, null, null, null]);

  useEffect(() => { mapModeRef.current = mapMode; }, [mapMode]);

  // Geocoding

  const fetchSuggestions = async (query: string, signal: AbortSignal, onResult: (s: any[]) => void) => {
    const poiUrl = `https://api.mapbox.com/search/searchbox/v1/forward?q=${encodeURIComponent(query)}&access_token=${MAPBOX_KEY}&limit=10&types=poi&proximity=-74.0060,40.7128`;
    const generalUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?autocomplete=true&bbox=${NY_BBOX}&limit=10&access_token=${MAPBOX_KEY}`;
    try {
      const [poiRes, generalRes] = await Promise.all([
        fetch(poiUrl, { signal }),
        fetch(generalUrl, { signal }),
      ]);
      const poiData = await poiRes.json();
      const generalData = await generalRes.json();
      const merged = [
        ...(poiData.features || []),
        ...(generalData.features || []).filter((f: any) => !(poiData.features || []).find((p: any) => p.id === f.id)),
      ];
      onResult(merged.slice(0, 5));
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error(err);
    }
  };

  const reverseGeocode = async (lng: number, lat: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_KEY}&limit=1`
      );
      const data = await res.json();
      return data.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  const handleQueryChange = (idx: number, value: string) => {
    setQueries(prev => { const n = [...prev]; n[idx] = value; return n; });
    if (searchTimeoutsRef.current[idx]) clearTimeout(searchTimeoutsRef.current[idx]!);
    if (value.length < 3) {
      setSuggestions(prev => { const n = [...prev]; n[idx] = []; return n; });
      return;
    }
    justSelectedRef.current[idx] = false;
    const controller = new AbortController();
    searchTimeoutsRef.current[idx] = setTimeout(() =>
      fetchSuggestions(value, controller.signal, (s) =>
        setSuggestions(prev => { const n = [...prev]; n[idx] = s; return n; })
      ), 300);
  };

  // Traffic routing 

  const fetchRoutesForTable = useCallback(async (
    tableIdx: number,
    destCoords: [number, number],
    overrideOrigin?: [number, number]
  ) => {
    const effectiveOrigin = overrideOrigin
      ?? useTrafficCorridorStore.getState().slides[slideId]?.origin
      ?? (coordinates.lat && coordinates.lng ? [coordinates.lng, coordinates.lat] as [number, number] : null);
    if (!effectiveOrigin) return;

    setIsFetchingRoutes(prev => ({ ...prev, [tableIdx]: true }));
    try {
      const results = await fetchTrafficData(effectiveOrigin, [destCoords], true);
      const alternatives = results[0]?.alternatives ?? [];
      const alts = alternatives.map(alt => ({
        label: alt.label,
        minutes: alt.minutes,
        pathCoords: alt.pathCoords ?? [],
      }));
      setFetchedAlts(prev => {
        const next = { ...prev, [tableIdx]: alts };
        routeAltCache[slideId] = next;
        return next;
      });
      setSelectedAltIdx(prev => {
        const next = { ...prev, [tableIdx]: 0 };
        selectedAltCache[slideId] = next;
        return next;
      });
    } catch (err) {
      console.error(`Failed to fetch routes for table ${tableIdx}:`, err);
    } finally {
      setIsFetchingRoutes(prev => ({ ...prev, [tableIdx]: false }));
    }
  }, [slideId, coordinates]);

  const handleAddAlternative = (tableIdx: number, alt: FetchedAlt) => {
    const freshTables = useTrafficCorridorStore.getState().slides[slideId]?.tables ?? tables;
    const currentCorridors = freshTables[tableIdx]?.corridors ?? [];
    if (currentCorridors.length >= 3) return;
    const newCorridor: Corridor = {
      name: alt.label,
      time: `${alt.minutes} min`,
      apiLabel: alt.label,
    };
    setTables(slideId, freshTables.map((t, i) =>
      i === tableIdx ? { ...t, corridors: [...t.corridors, newCorridor] } : t
    ));
  };

  const handleRemoveAlternative = (tableIdx: number, apiLabel: string) => {
    const freshTables = useTrafficCorridorStore.getState().slides[slideId]?.tables ?? tables;
    setTables(slideId, freshTables.map((t, i) =>
      i === tableIdx ? { ...t, corridors: t.corridors.filter(c => c.apiLabel !== apiLabel) } : t
    ));
  };

  // Destination select

  const handleSelect = async (tableIdx: number, feature: any) => {
    const name = feature.place_name || `${feature.properties?.name}, ${feature.properties?.full_address}`;
    const coords: [number, number] | undefined = feature.geometry?.coordinates ?? feature.center;
    justSelectedRef.current[tableIdx] = true;
    setQueries(prev => { const n = [...prev]; n[tableIdx] = name; return n; });
    setSuggestions(prev => { const n = [...prev]; n[tableIdx] = []; return n; });

    const freshTables = useTrafficCorridorStore.getState().slides[slideId]?.tables ?? DEFAULT_TABLES;
    const padded = freshTables.length >= 4 ? [...freshTables] : [...freshTables, ...DEFAULT_TABLES].slice(0, 4);
    setTables(slideId, padded.map((t, i) =>
      i === tableIdx ? { ...t, destination: name, coordinates: coords, corridors: [] } : t
    ));

    if (coords) {
      placeDest(tableIdx, coords);
      await fetchRoutesForTable(tableIdx, coords);
      fetchTransitForTable(tableIdx, coords);
    }
  };

  const updateDestinationLabel = (tableIdx: number, destination: string) => {
    const freshTables = useTrafficCorridorStore.getState().slides[slideId]?.tables ?? DEFAULT_TABLES;
    setTables(slideId, freshTables.map((t, i) => i === tableIdx ? { ...t, destination } : t));
  };

  // Transit alternative

  const fetchTransitForTable = async (tableIdx: number, coords: [number, number]) => {
    try {
      const origin = { lat: coordinates.lat, lng: coordinates.lng };
      const dest = { name: '', coordinates: { lat: coords[1], lng: coords[0] } };
      const results = await fetchSkidsTransitData(origin, [dest]);
      const result = results[0];
      const transitAlternative = result?.travel
        ? { route: result.route, travel: result.travel, legs: result.legs ?? [] }
        : null;
      const freshTables = useTrafficCorridorStore.getState().slides[slideId]?.tables ?? tables;
      setTables(slideId, freshTables.map((t, i) => i === tableIdx ? { ...t, transitAlternative } : t));
    } catch (err: any) {
      const noStops = err?.message?.includes('No stops found') || err?.message?.includes('400');
      if (!noStops) console.error('Failed to fetch transit alternative:', err);
      const freshTables2 = useTrafficCorridorStore.getState().slides[slideId]?.tables ?? tables;
      setTables(slideId, freshTables2.map((t, i) => i === tableIdx ? { ...t, transitAlternative: null } : t));
    }
  };

  const handleTransitToggle = async (tableIdx: number, checked: boolean) => {
    const freshTables = useTrafficCorridorStore.getState().slides[slideId]?.tables ?? tables;
    setTables(slideId, freshTables.map((t, i) =>
      i === tableIdx ? { ...t, showTransitAlternative: checked, transitAlternative: checked ? t.transitAlternative : undefined } : t
    ));
    if (checked) {
      const coords = freshTables[tableIdx]?.coordinates;
      if (coords) await fetchTransitForTable(tableIdx, coords);
    }
  };

  handleOriginChangeRef.current = (newOrigin: [number, number]) => {
    setOrigin(slideId, newOrigin);
    const slide = useTrafficCorridorStore.getState().slides[slideId];
    const freshTables = slide?.tables ?? DEFAULT_TABLES;
    const layout = slide?.tableLayout ?? 'single';
    const count = layout === 'quad' ? 4 : layout === 'triple' ? 3 : layout === 'dual' ? 2 : 1;

    const updatedTables = freshTables.map((t, i) => {
      if (i >= count || !t.coordinates) return t;
      if ((t.corridors?.length ?? 0) > 0) {
        destMarkersRef.current[i]?.remove();
        destMarkersRef.current[i] = null;
        if (routeAltCache[slideId]) delete routeAltCache[slideId][i];
        if (selectedAltCache[slideId]) delete selectedAltCache[slideId][i];
        setFetchedAlts(prev => { const n = { ...prev }; delete n[i]; return n; });
        setSelectedAltIdx(prev => { const n = { ...prev }; delete n[i]; return n; });
        return { destination: '', corridors: [] };
      } else {
        fetchRoutesForTable(i, t.coordinates, newOrigin);
        return t;
      }
    });

    setTables(slideId, updatedTables);
    setQueries(prev => updatedTables.map((t, i) => t.coordinates ? prev[i] : ''));
  };

  // Map initialization

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const freshOrigin = useTrafficCorridorStore.getState().slides[slideId]?.origin;
    const center: [number, number] = freshOrigin
      ?? (coordinates.lng && coordinates.lat ? [coordinates.lng, coordinates.lat] : [-74.006, 40.712]);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 11,
      scrollZoom: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const container = mapContainerRef.current!;
    const enableScroll = () => map.scrollZoom.enable();
    const disableScroll = () => map.scrollZoom.disable();
    container.addEventListener('mouseenter', enableScroll);
    container.addEventListener('mouseleave', disableScroll);

    map.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      const mode = mapModeRef.current;
      if (mode === 'origin') {
        const originCoords: [number, number] = [lng, lat];
        placeOriginMarker(map, originCoords);
        handleOriginChangeRef.current!(originCoords);
      } else {
        const idx = parseInt(mode.replace('dest-', ''));
        const destCoords: [number, number] = [lng, lat];
        const name = await reverseGeocode(lng, lat);
        setQueries(prev => { const n = [...prev]; n[idx] = name; return n; });
        const freshTables = useTrafficCorridorStore.getState().slides[slideId]?.tables ?? DEFAULT_TABLES;
        const padded = freshTables.length >= 4 ? [...freshTables] : [...freshTables, ...DEFAULT_TABLES].slice(0, 4);
        setTables(slideId, padded.map((t, i) =>
          i === idx ? { ...t, destination: name, coordinates: destCoords, corridors: [] } : t
        ));
        placeDest(idx, destCoords);
        fetchRoutesForTable(idx, destCoords);
      }
    });

    map.on('load', () => {
      setMapLoaded(true);

      const slide = useTrafficCorridorStore.getState().slides[slideId];
      const freshCoords = useGeneralStore.getState().coordinates;
      const origin: [number, number] = slide?.origin
        ?? (freshCoords?.lng && freshCoords?.lat ? [freshCoords.lng, freshCoords.lat] : [-74.006, 40.712]);
      const layout = slide?.tableLayout ?? (slide?.showSecondTable ? 'dual' : 'single');
      const count = layout === 'quad' ? 4 : layout === 'triple' ? 3 : layout === 'dual' ? 2 : 1;
      const savedTables = slide?.tables ?? DEFAULT_TABLES;

      placeOriginMarker(map, origin);
      map.setCenter(origin);
      if (!slide?.origin) setOrigin(slideId, origin);

      savedTables.forEach((t, i) => {
        if (t.coordinates && i < count) placeDest(i, t.coordinates);
      });
    });
    mapRef.current = map;

    return () => {
      container.removeEventListener('mouseenter', enableScroll);
      container.removeEventListener('mouseleave', disableScroll);
      destMarkersRef.current.forEach(m => m?.remove());
      destMarkersRef.current = [null, null, null, null];
      originMarkerRef.current?.remove();
      originMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Marker helpers

  const makeMarkerEl = (label: string, color: string, icon?: string) => {
   
    const PH = 24; 
    const TH = 9;  
    const H = PH + TH;
    const W = Math.max(label.length * 7 + (icon ? 34 : 26), 56);
    const cx = W / 2;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.cssText = 'cursor:grab;display:block;overflow:visible;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));';

    // pill background
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', '0'); rect.setAttribute('y', '0');
    rect.setAttribute('width', String(W)); rect.setAttribute('height', String(PH));
    rect.setAttribute('rx', '10'); rect.setAttribute('fill', color);
    svg.appendChild(rect);

    // triangle
    const tri = document.createElementNS(ns, 'polygon');
    tri.setAttribute('points', `${cx - 7},${PH} ${cx + 7},${PH} ${cx},${H}`);
    tri.setAttribute('fill', color);
    svg.appendChild(tri);

    // icons
    if (icon) {
      const t = document.createElementNS(ns, 'text');
      t.setAttribute('x', '8'); t.setAttribute('y', String(PH / 2));
      t.setAttribute('dominant-baseline', 'central');
      t.setAttribute('fill', 'rgba(255,255,255,0.9)');
      t.setAttribute('font-size', '10'); t.setAttribute('font-family', 'sans-serif');
      t.textContent = icon;
      svg.appendChild(t);
    } else {
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx', '10'); dot.setAttribute('cy', String(PH / 2));
      dot.setAttribute('r', '3.5'); dot.setAttribute('fill', 'rgba(255,255,255,0.85)');
      svg.appendChild(dot);
    }

    // label text
    const txt = document.createElementNS(ns, 'text');
    txt.setAttribute('x', String(icon ? 21 : 18)); txt.setAttribute('y', String(PH / 2));
    txt.setAttribute('dominant-baseline', 'central');
    txt.setAttribute('fill', 'white'); txt.setAttribute('font-size', '11');
    txt.setAttribute('font-weight', '700'); txt.setAttribute('font-family', 'sans-serif');
    txt.textContent = label;
    svg.appendChild(txt);

    svg.addEventListener('mousedown', () => { svg.style.cursor = 'grabbing'; });
    svg.addEventListener('mouseup', () => { svg.style.cursor = 'grab'; });
    return svg as unknown as HTMLElement;
  };

  const placeOriginMarker = (map: mapboxgl.Map, coords: [number, number]) => {
    if (originMarkerRef.current) {
      originMarkerRef.current.setLngLat(coords);
    } else {
      originMarkerRef.current = new mapboxgl.Marker({ element: makeMarkerEl('Origin', '#22c55e', '✦'), anchor: 'bottom' })
        .setLngLat(coords)
        .setDraggable(true)
        .addTo(map);
      originMarkerRef.current.on('dragend', () => {
        const { lng, lat } = originMarkerRef.current!.getLngLat();
        handleOriginChangeRef.current!([lng, lat]);
      });
    }
  };

  const placeDest = (idx: number, coords: [number, number]) => {
    const map = mapRef.current;
    if (!map) return;
    if (destMarkersRef.current[idx]) {
      destMarkersRef.current[idx]!.setLngLat(coords);
    } else {
      destMarkersRef.current[idx] = new mapboxgl.Marker({ element: makeMarkerEl(`Dest ${idx + 1}`, TABLE_COLORS[idx]), anchor: 'bottom' })
        .setLngLat(coords)
        .setDraggable(true)
        .addTo(map);
      destMarkersRef.current[idx]!.on('dragend', () => {
        const { lng, lat } = destMarkersRef.current[idx]!.getLngLat();
        const dc: [number, number] = [lng, lat];
        reverseGeocode(lng, lat).then(name => {
          setQueries(prev => { const n = [...prev]; n[idx] = name; return n; });
        });
        const freshTables = useTrafficCorridorStore.getState().slides[slideId]?.tables ?? DEFAULT_TABLES;
        const padded = freshTables.length >= 4 ? [...freshTables] : [...freshTables, ...DEFAULT_TABLES].slice(0, 4);
        setTables(slideId, padded.map((t, i) =>
          i === idx ? { ...t, coordinates: dc, corridors: [] } : t
        ));
        fetchRoutesForTable(idx, dc);
      });
    }
    map.flyTo({ center: coords, zoom: Math.max(map.getZoom(), 11), duration: 600 });
  };


  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const origin: [number, number] = storedOrigin
      ?? (coordinates.lng && coordinates.lat ? [coordinates.lng, coordinates.lat] : [-74.006, 40.712]);
    placeOriginMarker(map, origin);
    if (!storedOrigin) setOrigin(slideId, origin);
  }, [mapLoaded, storedOrigin]);


  useEffect(() => {
    if (!mapLoaded) return;
    const slide = useTrafficCorridorStore.getState().slides[slideId];
    const layout = slide?.tableLayout ?? (slide?.showSecondTable ? 'dual' : 'single');
    const count = layout === 'quad' ? 4 : layout === 'triple' ? 3 : layout === 'dual' ? 2 : 1;
    (slide?.tables ?? DEFAULT_TABLES).forEach((t, i) => {
      if (t.coordinates && i < count) {
        placeDest(i, t.coordinates);
        if (!routeAltCache[slideId]?.[i]) fetchRoutesForTable(i, t.coordinates);
      }
    });
  }, [mapLoaded, tableLayout]);

  // Route polyline drawing

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Remove old layers 
    routeLayersRef.current.forEach(id => {
      try { if (map.getLayer(id)) map.removeLayer(id); } catch {}
      try { if (map.getSource(id)) map.removeSource(id); } catch {}
    });
    routeLayersRef.current = [];

    const allCoords: [number, number][] = [];

    Object.entries(fetchedAlts).forEach(([tableIdxStr, alts]) => {
      const tableIdx = parseInt(tableIdxStr);
      const tableColor = TABLE_COLORS[tableIdx % 4];
      const activeIdx = selectedAltIdx[tableIdx] ?? 0;
      const alt = alts[activeIdx];
      if (!alt?.pathCoords || alt.pathCoords.length < 2) return;

      const sourceId = `route-${tableIdx}`;
      const layerId = `route-layer-${tableIdx}`;
      // pathCoords from API is [lat, lon] needs swap to [lon, lat] for Mapbox
      const coords = alt.pathCoords.map(([lat, lon]) => [lon, lat] as [number, number]);
      allCoords.push(...coords);

      try {
        map.addSource(sourceId, {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': tableColor, 'line-width': 5, 'line-opacity': 0.9 },
        });
        routeLayersRef.current.push(layerId, sourceId);
      } catch (e) {
        console.warn('Route draw error:', e);
      }
    });

    if (allCoords.length > 1) {
      const bounds = allCoords.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(allCoords[0], allCoords[0])
      );
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 });
    }
  }, [fetchedAlts, selectedAltIdx, mapLoaded]);

  // Layout change helper

  const handleSetLayout = (layout: TableLayout) => {
    setTableLayout(slideId, layout);
    const targetCount = layout === 'quad' ? 4 : layout === 'triple' ? 3 : layout === 'dual' ? 2 : 1;
    const freshTables = useTrafficCorridorStore.getState().slides[slideId]?.tables ?? DEFAULT_TABLES;
    const padded = [...freshTables];
    while (padded.length < targetCount) padded.push({ destination: '', corridors: [] });
    setTables(slideId, padded);
    for (let i = targetCount; i < 4; i++) {
      // Remove marker
      destMarkersRef.current[i]?.remove();
      destMarkersRef.current[i] = null;
      setFetchedAlts(prev => { const n = { ...prev }; delete n[i]; return n; });
      setSelectedAltIdx(prev => { const n = { ...prev }; delete n[i]; return n; });
      if (routeAltCache[slideId]) delete routeAltCache[slideId][i];
      if (selectedAltCache[slideId]) delete selectedAltCache[slideId][i];
    }
  };

  // Save status

  useEffect(() => {
    renderCount.current += 1;
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev && renderCount.current <= 2) { setSaveStatus('saved'); return; }
    if (!isDev && renderCount.current === 1) { setSaveStatus('saved'); return; }
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSaveStatus('saved'), 600);
  }, [showTitle, tableLayout, backgroundColor, tableHeaderColor, rowColor, titleColor, textColor, bgImage, logoImage, titleTextSize, contentTextSize]);

  // Image upload

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'bg' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (target === 'bg' && fileInputRef.current) fileInputRef.current.value = '';
    else if (target === 'logo' && logoInputRef.current) logoInputRef.current.value = '';
    const currentImage = target === 'bg' ? bgImage : logoImage;
    const setImageFn = target === 'bg' ? setBgImage : setLogoImage;
    const setLoadingFn = target === 'bg' ? setIsBgUploading : setIsLogoUploading;
    setLoadingFn(true);
    uploadImage(shortcode, file).then((data) => {
      if (currentImage) deleteImage(currentImage).catch(console.error);
      setImageFn(slideId, data.url);
    }).catch(console.error).finally(() => setLoadingFn(false));
  };

  const handleRemoveImage = (target: 'bg' | 'logo') => {
    const currentImage = target === 'bg' ? bgImage : logoImage;
    const setImageFn = target === 'bg' ? setBgImage : setLogoImage;
    const inputRef = target === 'bg' ? fileInputRef : logoInputRef;
    if (currentImage) {
      deleteImage(currentImage).then(() => {
        setImageFn(slideId, '');
        if (inputRef.current) inputRef.current.value = '';
      }).catch(console.error);
    }
  };

  const handleRefreshRoutes = () => {
    delete routeAltCache[slideId];
    delete selectedAltCache[slideId];
    setFetchedAlts({});
    setSelectedAltIdx({});
    const slide = useTrafficCorridorStore.getState().slides[slideId];
    const layout = slide?.tableLayout ?? 'single';
    const count = layout === 'quad' ? 4 : layout === 'triple' ? 3 : layout === 'dual' ? 2 : 1;
    (slide?.tables ?? DEFAULT_TABLES).forEach((t, i) => {
      if (t.coordinates && i < count) fetchRoutesForTable(i, t.coordinates);
    });
  };

  // Render

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 bg-white overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 text-[#4a5568] mb-4">
            <span>Home</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium">Traffic Corridor</span>
          </div>

          <p className="text-[#606061] mb-3 text-sm">
            Set an origin and destination on the map to fetch route alternatives. Pick corridors from the alternatives panel and label them how you want.
          </p>

          {/* Map + Destinations split */}
          <div className="flex gap-4 mb-5" style={{ height: '500px' }}>

            {/* Left: map mode buttons + map */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className="text-xs text-gray-500">Click map to set:</span>
                <button
                  onClick={handleRefreshRoutes}
                  className="text-xs px-2.5 py-1 rounded border bg-white text-gray-600 border-gray-300 hover:bg-gray-50 ml-auto"
                >
                  ↻ Refresh Routes
                </button>
                <button
                  onClick={() => setMapMode('origin')}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    mapMode === 'origin'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ✦ Origin
                </button>
                {Array.from({ length: tableCount }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setMapMode(`dest-${i}` as MapMode)}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                      mapMode === `dest-${i}`
                        ? 'text-white border-transparent'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                    style={mapMode === `dest-${i}` ? { backgroundColor: TABLE_COLORS[i] } : {}}
                  >
                    ● Dest {i + 1}
                  </button>
                ))}
              </div>
              <div className="rounded border border-[#e2e8f0] overflow-hidden flex-1">
                <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
              </div>
            </div>

            {/* Right: destination inputs + alternatives, independently scrollable */}
            <div className="w-[410px] flex-shrink-0 overflow-y-auto flex flex-col gap-3 pr-0.5">
            {Array.from({ length: tableCount }, (_, i) => {
              const alts = fetchedAlts[i] ?? [];
              const currentCorridors = tables[i]?.corridors ?? [];
              const isCommitted = currentCorridors.length > 0;
              return (
                <div
                  key={i}
                  className={`rounded-lg p-3 border transition-colors ${
                    isCommitted
                      ? 'border-l-[3px] border-l-green-500 border-t-[#e2e8f0] border-r-[#e2e8f0] border-b-[#e2e8f0]'
                      : 'border border-[#e2e8f0]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: TABLE_COLORS[i] }} />
                    <span className="text-sm font-medium text-[#4a5568]">Destination {i + 1}</span>
                    {isCommitted && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,9 6,13 14,4" />
                        </svg>
                        Set
                      </span>
                    )}
                  </div>

                  {/* Search input*/}
                  <div className="relative mb-2">
                    <Input
                      placeholder="Search for a location..."
                      value={queries[i]}
                      onChange={(e) => handleQueryChange(i, e.target.value)}
                      onBlur={() => setTimeout(() => setSuggestions(prev => { const n = [...prev]; n[i] = []; return n; }), 200)}
                      autoComplete="off"
                      disabled={isCommitted}
                      className={`text-sm ${isCommitted ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                    />
                    {suggestions[i].length > 0 && (
                      <ul className="absolute z-20 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                        {suggestions[i].map((feature: any, idx: number) => (
                          <li
                            key={idx}
                            onMouseDown={() => handleSelect(i, feature)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black text-sm"
                          >
                            {feature.place_name || `${feature.properties?.name}, ${feature.properties?.full_address}`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Table header label */}
                  <p className="text-xs text-gray-500 mb-1">Header label:</p>
                  <Input
                    placeholder="Table header label..."
                    value={tables[i]?.destination || ''}
                    onChange={(e) => updateDestinationLabel(i, e.target.value)}
                    className="text-sm mb-3"
                  />

                  {/* Alternatives Panel */}
                  {isFetchingRoutes[i] && (
                    <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                      <div className="animate-spin w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full" />
                      Fetching routes...
                    </div>
                  )}
                  {!isFetchingRoutes[i] && alts.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5 font-medium">Route alternatives:</p>
                      {(() => {
                        const transitEnabled = tables[i]?.showTransitAlternative ?? false;
                        const totalRows = currentCorridors.length + (transitEnabled ? 1 : 0);
                        return (
                          <>
                            {alts.map((alt, altIdx) => {
                              const isAlreadyAdded = currentCorridors.some(c => c.apiLabel === alt.label);
                              const canAdd = !isAlreadyAdded && totalRows < 3;
                              const isActive = (selectedAltIdx[i] ?? 0) === altIdx;
                              return (
                                <div
                                  key={altIdx}
                                  onClick={() => setSelectedAltIdx(prev => ({ ...prev, [i]: altIdx }))}
                                  className={`flex items-center gap-2 p-2 mb-1.5 rounded border cursor-pointer transition-colors ${
                                    isActive ? 'border-transparent bg-white shadow-sm ring-2' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                  }`}
                                  style={isActive ? { boxShadow: `0 0 0 2px ${TABLE_COLORS[i]}` } : {}}
                                >
                                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: TABLE_COLORS[i] }} />
                                  <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                                    <span className="text-sm text-gray-800 truncate">{alt.label}</span>
                                    <span className="text-xs text-gray-400 flex-shrink-0">{alt.minutes} min</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isAlreadyAdded) handleRemoveAlternative(i, alt.label);
                                      else if (canAdd) handleAddAlternative(i, alt);
                                    }}
                                    disabled={!isAlreadyAdded && !canAdd}
                                    className={`text-xs px-2 py-1 rounded flex-shrink-0 transition-colors ${
                                      isAlreadyAdded
                                        ? 'bg-gray-200 text-gray-500 hover:bg-red-100 hover:text-red-600'
                                        : canAdd
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    {isAlreadyAdded ? 'Added' : '+ Add'}
                                  </button>
                                </div>
                              );
                            })}

                            {/* Transit alternative row */}
                            {(() => {
                              const transitAlt = tables[i]?.transitAlternative;
                              const transitUnavailable = transitAlt === null;
                              return (
                                <div className={`p-2 mb-1.5 rounded border border-gray-200 ${transitUnavailable ? 'bg-gray-50 opacity-60' : 'bg-gray-50'}`}>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                                      <span className="text-sm text-gray-800">Transit Alternative</span>
                                      {transitAlt?.travel && (
                                        <span className="text-xs text-gray-400 flex-shrink-0">{transitAlt.travel}</span>
                                      )}
                                      {transitUnavailable && (
                                        <span className="text-xs text-gray-400 flex-shrink-0 italic">Not available</span>
                                      )}
                                    </div>
                                    {transitUnavailable ? (
                                      <span className="text-xs text-gray-400 flex-shrink-0">—</span>
                                    ) : (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleTransitToggle(i, !transitEnabled); }}
                                        disabled={!transitEnabled && totalRows >= 3}
                                        className={`text-xs px-2 py-1 rounded flex-shrink-0 transition-colors ${
                                          transitEnabled
                                            ? 'bg-gray-200 text-gray-500 hover:bg-red-100 hover:text-red-600'
                                            : totalRows >= 3
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                      >
                                        {transitEnabled ? 'Added' : '+ Add'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                            {totalRows >= 3 && (
                              <p className="text-xs text-amber-600">Max 3 rows reached. Remove one in the preview to add more.</p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                  {!isFetchingRoutes[i] && alts.length === 0 && tables[i]?.coordinates && (
                    <p className="text-xs text-gray-400 italic">No routes returned for this destination.</p>
                  )}
                  {!tables[i]?.coordinates && (
                    <p className="text-xs text-gray-400 italic">Search above or click the map to set this destination.</p>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* Preview */}
          <div className="h-[550px] rounded-lg border border-[#e2e8f0] overflow-hidden">
            <TrafficCorridorPreview slideId={slideId} />
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 mt-4">
            <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePreview()}>Preview Screens</Button>
            <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePublish()}>Publish Screens</Button>
            {saveStatus !== 'idle' && (
              <div className="flex items-center text-xs text-gray-500 ml-2">
                {saveStatus === 'saving' ? (
                  <><div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse mr-2" />Saving...</>
                ) : (
                  <><div className="w-2 h-2 rounded-full bg-green-500 mr-2" />Saved Locally</>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4 overflow-y-auto">
        <div className="space-y-3 mb-4">

          <div>
            <label className="flex items-center gap-2 text-[#4a5568] font-medium text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showTitle}
                onChange={(e) => setShowTitle(slideId, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              Show Title
            </label>
          </div>

          {/* Layout Selector */}
          <div>
            <label className="block text-[#4a5568] font-medium mb-1.5 text-xs">Table Layout</label>
            <div className="flex gap-1">
              {(['single', 'dual', 'triple', 'quad'] as TableLayout[]).map((layout) => (
                <button
                  key={layout}
                  onClick={() => handleSetLayout(layout)}
                  className={`text-xs px-2 py-1.5 rounded border flex-1 transition-colors ${
                    tableLayout === layout
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {layout === 'single' ? '1' : layout === 'dual' ? '2' : layout === 'triple' ? '3' : '4'}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Color</label>
            <div className="flex items-center gap-2">
              <div className="colorContainer">
                <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(slideId, e.target.value)} className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none" />
              </div>
              <Input value={backgroundColor} className="flex-1 text-xs" onChange={(e) => setBackgroundColor(slideId, e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table Header Color</label>
            <div className="flex items-center gap-2">
              <div className="colorContainer">
                <input type="color" value={tableHeaderColor} onChange={(e) => setTableHeaderColor(slideId, e.target.value)} className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none" />
              </div>
              <Input value={tableHeaderColor} className="flex-1 text-xs" onChange={(e) => setTableHeaderColor(slideId, e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Row Color</label>
            <div className="flex items-center gap-2">
              <div className="colorContainer">
                <input type="color" value={rowColor} onChange={(e) => setRowColor(slideId, e.target.value)} className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none" />
              </div>
              <Input value={rowColor} className="flex-1 text-xs" onChange={(e) => setRowColor(slideId, e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Title Text Color</label>
            <div className="flex items-center gap-2">
              <div className="colorContainer">
                <input type="color" value={titleColor} onChange={(e) => setTitleColor(slideId, e.target.value)} className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none" />
              </div>
              <Input value={titleColor} className="flex-1 text-xs" onChange={(e) => setTitleColor(slideId, e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Text Color</label>
            <div className="flex items-center gap-2">
              <div className="colorContainer">
                <input type="color" value={textColor} onChange={(e) => setTextColor(slideId, e.target.value)} className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none" />
              </div>
              <Input value={textColor} className="flex-1 text-xs" onChange={(e) => setTextColor(slideId, e.target.value)} />
            </div>
          </div>

          {/* Text Sizes */}
          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Title Size: {titleTextSize}</label>
            <input type="range" min="1" max="10" value={titleTextSize} onChange={(e) => setTitleTextSize(slideId, Number(e.target.value))} className="w-full h-1.5 accent-blue-600" />
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Content Size: {contentTextSize}</label>
            <input type="range" min="1" max="10" value={contentTextSize} onChange={(e) => setContentTextSize(slideId, Number(e.target.value))} className="w-full h-1.5 accent-blue-600" />
          </div>

          {/* Background Image */}
          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Image</label>
            {bgImage ? (
              <div className="flex items-center gap-2">
                <img src={bgImage} alt="bg" className="w-10 h-7 object-cover rounded" />
                <button onClick={() => handleRemoveImage('bg')} className="text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} disabled={isBgUploading} className="w-full text-xs py-1.5 border border-dashed border-gray-300 rounded text-gray-500 hover:bg-gray-50">
                {isBgUploading ? 'Uploading...' : '+ Upload'}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'bg')} />
          </div>

          {/* Logo Image */}
          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Logo Image</label>
            {logoImage ? (
              <div className="flex items-center gap-2">
                <img src={logoImage} alt="logo" className="w-10 h-7 object-contain rounded" />
                <button onClick={() => handleRemoveImage('logo')} className="text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
            ) : (
              <button onClick={() => logoInputRef.current?.click()} disabled={isLogoUploading} className="w-full text-xs py-1.5 border border-dashed border-gray-300 rounded text-gray-500 hover:bg-gray-50">
                {isLogoUploading ? 'Uploading...' : '+ Upload'}
              </button>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
          </div>

          {/* Delete */}
          <button
            onClick={() => handleDelete(slideId)}
            className="w-full text-xs py-1.5 border border-red-200 rounded text-red-500 hover:bg-red-50 mt-2"
          >
            Delete Screen
          </button>
        </div>
      </div>
    </div>
  );
}
