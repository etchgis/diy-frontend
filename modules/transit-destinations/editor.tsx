import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Plus, X, RefreshCw, Settings } from "lucide-react"
import TransitDestinationPreview from "./preview"
import { useTransitDestinationsStore } from "./store"
import { useEffect, useRef, useState } from "react"
import { useGeneralStore } from "@/stores/general"
import { useLocalSaveStatus } from "@/hooks/useLocalSaveStatus"
import { fetchTransitData } from "@/services/data-gathering/fetchTransitDestinationData"
import { fetchSkidsTransitData } from "@/services/data-gathering/fetchSkidsDestinationData"
import { formatTime, formatDuration } from "@/utils/formats"
import { getDestinationData } from "@/services/data-gathering/getDestinationData"

const MAX_DESTINATIONS = 5;
const USE_SKIDS = process.env.NEXT_PUBLIC_USE_SKIDS !== 'false';

const ALL_MODES = ['BUS', 'SUBWAY', 'RAIL', 'WALK'];
const MODE_LABELS: Record<string, string> = { BUS: 'Bus', SUBWAY: 'Subway', RAIL: 'Rail', WALK: 'Walk' };
const DEFAULT_MAX_WALK = 800; // meters
const MAX_WALK_METERS = 4828; // 3 miles
const WALK_STEP_METERS = 161; // ~0.1 miles

function formatWalkDistance(meters: number): string {
  const feet = Math.round(meters * 3.28084);
  if (feet < 5280) return `${feet.toLocaleString()} ft`;
  return `${(meters / 1609.344).toFixed(1)} mi`;
}

async function fetchStopRoutes(stopId: string): Promise<{ shortName: string; color?: string; textColor?: string }[]> {
  const base = process.env.NEXT_PUBLIC_SKIDS_URL;
  const region = process.env.NEXT_PUBLIC_SKIDS_REGION;
  if (!base) return [];
  try {
    const url = `${base}/api/transit/stops/${encodeURIComponent(stopId)}${region ? `?region=${region}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.routes ?? []).map((r: any) => ({ shortName: r.shortName, color: r.color, textColor: r.textColor }));
  } catch {
    return [];
  }
}

function DestinationSettingsModal({
  dest,
  slideId,
  destResult,
  globalMaxWalkDistance,
  onClose,
  onRefetch,
  refetching,
  handleToggleMode,
  setDestinationPreferredItinerary,
  setDestinationMaxWalkDistance,
  setDestinationAllowedRoutes,
  setDestinationBannedRoutes,
}: {
  dest: any;
  slideId: string;
  destResult: any;
  globalMaxWalkDistance: number;
  onClose: () => void;
  onRefetch: (dest: any) => void;
  refetching: boolean;
  handleToggleMode: (destName: string, mode: string, currentModes: string[]) => void;
  setDestinationPreferredItinerary: (slideId: string, destName: string, sig: string[]) => void;
  setDestinationMaxWalkDistance: (slideId: string, destName: string, meters: number | undefined) => void;
  setDestinationAllowedRoutes: (slideId: string, destName: string, routes: string[]) => void;
  setDestinationBannedRoutes: (slideId: string, destName: string, routes: string[]) => void;
}) {
  const currentModes: string[] = dest.allowedModes ?? ALL_MODES;
  const preferredItinerary: string[] = dest.preferredItinerary ?? [];
  const allItineraries: { routeSignature: string[]; route: string | null }[] = destResult?.allItineraries ?? [];
  const preferredLabel = preferredItinerary.length > 0 ? preferredItinerary.join(' › ') : null;

  const [allowedRoutesText, setAllowedRoutesText] = useState<string>((dest.allowedRoutes ?? []).join(', '));
  const [bannedRoutesText, setBannedRoutesText] = useState<string>((dest.bannedRoutes ?? []).join(', '));

  // Routes seen in actual itinerary results (with color info when available).
  // Check both primary legs and allItineraries (when SKIDS returns multiple options).
  const itineraryRoutes: { shortName: string; color?: string; textColor?: string }[] = (() => {
    const seen = new Map<string, { shortName: string; color?: string; textColor?: string }>();
    const addLegs = (legs: any[]) => {
      for (const leg of legs) {
        if (leg.mode === 'WALK' || !leg.routeShortName) continue;
        if (!seen.has(leg.routeShortName)) {
          seen.set(leg.routeShortName, {
            shortName: leg.routeShortName,
            color: leg.routeColor || leg.color || undefined,
            textColor: leg.routeTextColor || leg.textColor || undefined,
          });
        }
      }
    };
    // Primary route legs (always present)
    addLegs(destResult?.legs ?? []);
    // Additional itineraries when SKIDS returns multiple options
    for (const it of (destResult?.allItineraries ?? [])) {
      addLegs(it.legs ?? []);
    }
    return Array.from(seen.values());
  })();

  const [stopRoutes, setStopRoutes] = useState<{ shortName: string; color?: string; textColor?: string }[]>([]);
  const [loadingStopRoutes, setLoadingStopRoutes] = useState(false);

  useEffect(() => {
    const candidateStops: { id: string }[] = destResult?.originCandidateStops ?? (destResult?.originStop ? [destResult.originStop] : []);
    if (candidateStops.length === 0) return;
    setLoadingStopRoutes(true);
    Promise.all(candidateStops.map((s) => fetchStopRoutes(s.id)))
      .then((results) => {
        const seen = new Set<string>();
        const merged: { shortName: string; color?: string; textColor?: string }[] = [];
        for (const routes of results) {
          for (const r of routes) {
            if (!seen.has(r.shortName)) {
              seen.add(r.shortName);
              merged.push(r);
            }
          }
        }
        setStopRoutes(merged);
      })
      .finally(() => setLoadingStopRoutes(false));
  }, [destResult?.originStop?.id, destResult?.originCandidateStops?.length]);

  // Merge stop-API routes (with colors) with any extra routes from actual itinerary results.
  // This ensures routes like M3/M4 that the stop API omits still appear as badges.
  const displayRoutes: { shortName: string; color?: string; textColor?: string }[] = (() => {
    const base = stopRoutes.length > 0 ? stopRoutes : [];
    const seen = new Set(base.map((r) => r.shortName));
    const extras = itineraryRoutes.filter((r) => !seen.has(r.shortName));
    return [...base, ...extras];
  })();

  const applyAllowedRoutes = (text: string) => {
    setDestinationAllowedRoutes(slideId, dest.name, text.split(',').map((r) => r.trim()).filter(Boolean));
  };
  const applyBannedRoutes = (text: string) => {
    setDestinationBannedRoutes(slideId, dest.name, text.split(',').map((r) => r.trim()).filter(Boolean));
  };

  const toggleRouteChip = (route: string) => {
    const allowedList = allowedRoutesText.split(',').map((r) => r.trim()).filter(Boolean);
    const bannedList = bannedRoutesText.split(',').map((r) => r.trim()).filter(Boolean);
    const inAllowed = allowedList.includes(route);
    const inBanned = bannedList.includes(route);
    if (!inAllowed && !inBanned) {
      const next = [...allowedList, route].join(', ');
      setAllowedRoutesText(next);
      applyAllowedRoutes(next);
    } else if (inAllowed) {
      const nextAllowed = allowedList.filter((r) => r !== route).join(', ');
      const nextBanned = [...bannedList, route].join(', ');
      setAllowedRoutesText(nextAllowed);
      setBannedRoutesText(nextBanned);
      applyAllowedRoutes(nextAllowed);
      applyBannedRoutes(nextBanned);
    } else {
      const next = bannedList.filter((r) => r !== route).join(', ');
      setBannedRoutesText(next);
      applyBannedRoutes(next);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-lg shadow-xl w-96 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Destination settings</p>
            <h3 className="font-semibold text-gray-800 text-sm leading-tight truncate max-w-[200px]">{dest.name}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-4">
          {/* Allowed modes */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Allowed modes</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_MODES.map((mode) => {
                const active = currentModes.includes(mode);
                return (
                  <button
                    key={mode}
                    onClick={() => handleToggleMode(dest.name, mode, currentModes)}
                    className={`text-xs px-2.5 py-1 rounded font-medium border-2 transition-colors ${
                      active ? 'bg-green-500 text-white border-green-600' : 'bg-white text-red-500 border-red-300 line-through'
                    }`}
                  >
                    {MODE_LABELS[mode]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route filters */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Route filters</p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Allowed routes <span className="text-gray-400">(short names, comma-separated)</span>
                </label>
                <Input
                  value={allowedRoutesText}
                  placeholder="e.g. 540, S79, 1"
                  className="text-xs h-7"
                  onChange={(e) => setAllowedRoutesText(e.target.value)}
                  onBlur={(e) => applyAllowedRoutes(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Banned routes <span className="text-gray-400">(short names, comma-separated)</span>
                </label>
                <Input
                  value={bannedRoutesText}
                  placeholder="e.g. 62, X1"
                  className="text-xs h-7"
                  onChange={(e) => setBannedRoutesText(e.target.value)}
                  onBlur={(e) => applyBannedRoutes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Available routes */}
          {(displayRoutes.length > 0 || loadingStopRoutes) && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-gray-600">
                  {stopRoutes.length > 0 ? 'Routes at origin stop' : 'Routes in results'}
                </p>
                {loadingStopRoutes
                  ? <span className="text-[10px] text-gray-400">Loading...</span>
                  : <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">tap: allow → ban → clear</span>
                      {(allowedRoutesText || bannedRoutesText) && (
                        <button
                          onClick={() => {
                            setAllowedRoutesText('');
                            setBannedRoutesText('');
                            applyAllowedRoutes('');
                            applyBannedRoutes('');
                          }}
                          className="text-[10px] text-red-400 hover:text-red-600 underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                }
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {displayRoutes.map(({ shortName, color, textColor }) => {
                  const inAllowed = allowedRoutesText.split(',').map((r) => r.trim()).includes(shortName);
                  const inBanned = bannedRoutesText.split(',').map((r) => r.trim()).includes(shortName);
                  const bgColor = !inAllowed && !inBanned && color ? `#${color}` : undefined;
                  const fgColor = !inAllowed && !inBanned && bgColor ? (textColor ? `#${textColor}` : '#ffffff') : undefined;
                  return (
                    <button
                      key={shortName}
                      onClick={() => toggleRouteChip(shortName)}
                      style={bgColor ? { backgroundColor: bgColor, color: fgColor, borderColor: bgColor } : undefined}
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${
                        inAllowed
                          ? 'bg-green-100 border-green-400 text-green-700'
                          : inBanned
                          ? 'bg-red-100 border-red-400 text-red-600 line-through'
                          : bgColor
                          ? ''
                          : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {shortName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Max walk distance */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-600">Max walk distance</p>
              {dest.maxWalkDistance != null && (
                <button
                  className="text-xs text-gray-400 hover:text-gray-600"
                  onClick={() => setDestinationMaxWalkDistance(slideId, dest.name, undefined)}
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={MAX_WALK_METERS}
                step={WALK_STEP_METERS}
                value={dest.maxWalkDistance ?? globalMaxWalkDistance}
                onChange={(e) => setDestinationMaxWalkDistance(slideId, dest.name, Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-14 text-right">
                {formatWalkDistance(dest.maxWalkDistance ?? globalMaxWalkDistance)}
                {dest.maxWalkDistance == null && <span className="text-gray-300"> *</span>}
              </span>
            </div>
            {dest.maxWalkDistance == null && (
              <p className="text-xs text-gray-400 italic mt-0.5">Using global default</p>
            )}
          </div>

          {/* Preferred itinerary */}
          {allItineraries.length > 1 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Preferred itinerary</p>
              <div className="space-y-1">
                {allItineraries.map((it, i) => {
                  const label = it.route || it.routeSignature.join(' › ') || `Option ${i + 1}`;
                  const isSelected =
                    preferredItinerary.length > 0 &&
                    preferredItinerary.every((r) => it.routeSignature.includes(r)) &&
                    it.routeSignature.every((r) => preferredItinerary.includes(r));
                  return (
                    <button
                      key={i}
                      onClick={() => setDestinationPreferredItinerary(slideId, dest.name, it.routeSignature)}
                      className={`w-full text-left text-xs px-2 py-1.5 rounded border transition-colors ${
                        isSelected
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {preferredLabel && (
                <button
                  className="text-xs text-gray-400 hover:text-gray-600 mt-1"
                  onClick={() => setDestinationPreferredItinerary(slideId, dest.name, [])}
                >
                  Clear preference
                </button>
              )}
            </div>
          )}
          {allItineraries.length === 0 && (
            <p className="text-xs text-gray-400 italic">Refetch to see itinerary options.</p>
          )}
          {allItineraries.length === 1 && (
            <p className="text-xs text-gray-400 italic">Only one itinerary available.</p>
          )}

          {/* Refetch */}
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs gap-1.5"
            disabled={refetching}
            onClick={() => onRefetch(dest)}
          >
            {refetching
              ? <><div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" /> Fetching...</>
              : <><RefreshCw className="w-3 h-3" /> Refetch</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TransitDestinationSlide({ slideId, handleDelete, handlePreview, handlePublish, handleOpenSettings }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void, handlePublish: () => void, handleOpenSettings: () => void }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [settingsDest, setSettingsDest] = useState<string | null>(null);
  const [refetchingDest, setRefetchingDest] = useState<string | null>(null);


  const showFooter = useGeneralStore((state) => state.slides.find((s) => s.id === slideId)?.showFooter ?? true);
  const setShowFooter = useGeneralStore((state) => state.setShowFooter);

  const slides = useGeneralStore((state) => state.slides);
  const setSlides = useGeneralStore((state) => state.setSlides);

  const backgroundColor = useTransitDestinationsStore((state) => state.slides[slideId]?.backgroundColor || '#192F51');
  const setBackgroundColor = useTransitDestinationsStore((state) => state.setBackgroundColor);

  const rowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.rowColor || '#192F51');
  const setRowColor = useTransitDestinationsStore((state) => state.setRowColor);

  const alternateRowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.alternateRowColor || '#78B1DD');
  const setAlternateRowColor = useTransitDestinationsStore((state) => state.setAlternateRowColor);

  const alternateRowTextColor = useTransitDestinationsStore((state) => state.slides[slideId]?.alternateRowTextColor || '#ffffff');
  const setAlternateRowTextColor = useTransitDestinationsStore((state) => state.setAlternateRowTextColor);

  const titleTextSize = useTransitDestinationsStore((state) => state.slides[slideId]?.titleTextSize || 5);
  const setTitleTextSize = useTransitDestinationsStore((state) => state.setTitleTextSize);

  const contentTextSize = useTransitDestinationsStore((state) => state.slides[slideId]?.contentTextSize || 5);
  const setContentTextSize = useTransitDestinationsStore((state) => state.setContentTextSize);

  const tableHeaderTextColor = useTransitDestinationsStore((state) => state.slides[slideId]?.tableHeaderTextColor || '#ffffff');
  const setTableHeaderTextColor = useTransitDestinationsStore((state) => state.setTableHeaderTextColor);

  const tableTextColor = useTransitDestinationsStore((state) => state.slides[slideId]?.tableTextColor || '#ffffff');
  const setTableTextColor = useTransitDestinationsStore((state) => state.setTableTextColor);

  const selectedFeature = useTransitDestinationsStore((state) => state.slides[slideId]?.selectedFeature || '');
  const setSelectedFeature = useTransitDestinationsStore((state) => state.setSelectedFeature);

  const locationError = useTransitDestinationsStore((state) => state.slides[slideId]?.locationError || false);
  const setLocationError = useTransitDestinationsStore((state) => state.setLocationError);

  const errorMessage = useTransitDestinationsStore((state) => state.slides[slideId]?.errorMessage || '');
  const setErrorMessage = useTransitDestinationsStore((state) => state.setErrorMessage);

  const loading = useTransitDestinationsStore((state) => state.slides[slideId]?.loading || false);
  const setLoading = useTransitDestinationsStore((state) => state.setLoading);

  const outageMessage = useTransitDestinationsStore((state) => state.slides[slideId]?.outageMessage ?? '');
  const setOutageMessage = useTransitDestinationsStore((state) => state.setOutageMessage);
  const skipOnError = useTransitDestinationsStore((state) => state.slides[slideId]?.skipOnError ?? false);
  const setSkipOnError = useTransitDestinationsStore((state) => state.setSkipOnError);

  const displayName = useTransitDestinationsStore((state) => state.slides[slideId]?.displayName || '');
  const setDisplayName = useTransitDestinationsStore((state) => state.setDisplayName);

  const query = useTransitDestinationsStore((state) => state.slides[slideId]?.query || '');
  const setQuery = useTransitDestinationsStore((state) => state.setQuery);

  const coordinates = useGeneralStore((state) => state.coordinates);

  const mockDestinations: any = []

  const destinationData = useTransitDestinationsStore((state) => state.slides[slideId]?.destinationData || mockDestinations);
  const setDestinationData = useTransitDestinationsStore((state) => state.setDestinationData);



  const saveStatus = useLocalSaveStatus(useTransitDestinationsStore, slideId);

  const destinations = useTransitDestinationsStore((state) => state.slides[slideId]?.destinations || mockDestinations);
  const setDestinations = useTransitDestinationsStore((state) => state.setDestinations);
  const maxWalkDistance = useTransitDestinationsStore((state) => state.slides[slideId]?.maxWalkDistance ?? DEFAULT_MAX_WALK);
  const setMaxWalkDistance = useTransitDestinationsStore((state) => state.setMaxWalkDistance);
  const setDestinationModes = useTransitDestinationsStore((state) => state.setDestinationModes);
  const setDestinationPreferredItinerary = useTransitDestinationsStore((state) => state.setDestinationPreferredItinerary);
  const setDestinationMaxWalkDistance = useTransitDestinationsStore((state) => state.setDestinationMaxWalkDistance);
  const setDestinationAllowedRoutes = useTransitDestinationsStore((state) => state.setDestinationAllowedRoutes);
  const setDestinationBannedRoutes = useTransitDestinationsStore((state) => state.setDestinationBannedRoutes);




  const handleDeleteDestination = (name: string) => {
    const updatedDestinations = destinations.filter((dest: any) => dest.name !== name);
    const updatedDestinationData = destinationData.filter((dest: any) => dest.name !== name);
    setDestinations(slideId, updatedDestinations);
    setDestinationData(slideId, updatedDestinationData);
  };

  const handleToggleMode = (destName: string, mode: string, currentModes: string[]) => {
    const updated = currentModes.includes(mode)
      ? currentModes.filter((m) => m !== mode)
      : [...currentModes, mode];
    // Always keep at least one mode selected
    if (updated.length === 0) return;
    setDestinationModes(slideId, destName, updated);
  };

  const handleRefetchDestination = async (dest: any) => {
    setRefetchingDest(dest.name);
    try {
      const updatedDests = destinations.map((d: any) =>
        d.name === dest.name ? dest : d
      );
      await getDestinationData(
        updatedDests,
        slideId,
        setDestinationData,
        () => { /* suppress slide-level error during single refetch */ },
        destinationData,
        { maxWalkDistance }
      );
    } catch (e) {
      console.error('Refetch failed:', e);
    } finally {
      setRefetchingDest(null);
    }
  };

  useEffect(() => {
    setErrorMessage(slideId, "");
  }, []);


  useEffect(() => {
    const controller = new AbortController();

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      if (selectedFeature) return;

      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY;
      const newYorkBbox = "-79.7624,40.4774,-71.7517,45.0153"; // NY State bbox

      const poiUrl = `https://api.mapbox.com/search/searchbox/v1/forward?q=${encodeURIComponent(query)}` +
        `&access_token=${accessToken}` +
        `&limit=10` +
        `&types=poi` +
        `&proximity=-74.0060,40.7128`;

      const generalUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
        `?autocomplete=true&bbox=${newYorkBbox}&limit=10&access_token=${accessToken}`;

      try {
        const [poiRes, generalRes] = await Promise.all([
          fetch(poiUrl, { signal: controller.signal }),
          fetch(generalUrl, { signal: controller.signal })
        ]);

        const poiData = await poiRes.json();
        const generalData = await generalRes.json();

        const merged = [
          ...poiData.features,
          ...generalData.features.filter(
            (f: any) => !poiData.features.find((p: any) => p.id === f.id)
          )
        ];

        setSuggestions(merged.slice(0, 5));
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
      }
    };
    fetchSuggestions();
    return () => controller.abort();
  }, [query]);

  const handleSelect = (feature: any) => {
    setSelectedFeature(slideId, feature);
    setQuery(slideId, feature.place_name || `${feature.properties.name}, ${feature.properties.full_address}`);
    setSuggestions([]);
  };

  const handleCreate = async () => {
    if (!query || !coordinates) {
      setLocationError(slideId, true);
      setTimeout(() => setLocationError(slideId, false), 3000);
      return;
    }
    try {
      setLoading(slideId, true);

      const newDestination = {
        name: displayName || query,
        coordinates: {
          lat: selectedFeature.geometry.coordinates[1],
          lng: selectedFeature.geometry.coordinates[0],
        },
        allowedModes: ALL_MODES, // default: all modes enabled
      };

      const updatedDestinations = [...destinations, newDestination];
      setQuery(slideId, "");
      setDisplayName(slideId, "");
      setSelectedFeature(slideId, "");
      setLocationError(slideId, false);

      let enrichedDestination;

      // Try SKIDS first if enabled
      if (USE_SKIDS) {
        try {
          console.log('[SKIDS] Attempting to fetch transit data via SKIDS...');
          const skidsResults = await fetchSkidsTransitData(
            { lat: coordinates.lat, lng: coordinates.lng },
            [newDestination],
            { maxWalkMeters: maxWalkDistance }
          );

          if (skidsResults && skidsResults.length > 0) {
            const skidsData = skidsResults[0];
            enrichedDestination = {
              name: newDestination.name,
              route: skidsData.route || "N/A",
              departure: skidsData.departure,
              arrival: skidsData.arrival,
              travel: skidsData.travel,
              legs: skidsData.legs,
              allItineraries: skidsData.allItineraries,
              originStop: skidsData.originStop ?? null,
              originCandidateStops: skidsData.originCandidateStops ?? [],
              coordinates: newDestination.coordinates,
              dark: updatedDestinations.length % 2 === 0,
            };
            console.log('[SKIDS] Successfully fetched data via SKIDS');
          } else {
            throw new Error('SKIDS returned no results');
          }
        } catch (skidsError) {
          console.error('[SKIDS] SKIDS fetch failed, falling back to OTP:', skidsError);
          // Fall back to OTP
          const origin = `${coordinates.lat},${coordinates.lng}`;
          const destination = `${newDestination.coordinates.lat},${newDestination.coordinates.lng}`;
          const result = await fetchTransitData(origin, destination, newDestination.allowedModes, maxWalkDistance);

          enrichedDestination = {
            name: newDestination.name,
            route: result.route || "N/A",
            departure: formatTime(result.startTime),
            arrival: formatTime(result.endTime),
            travel: formatDuration(result.duration),
            legs: result.legs,
            coordinates: newDestination.coordinates,
            dark: updatedDestinations.length % 2 === 0,
          };
          console.log('[OTP] Successfully fetched data via OTP fallback');
        }
      } else {
        // Use OTP directly if SKIDS is disabled
        console.log('[OTP] Using OTP (SKIDS disabled)');
        const origin = `${coordinates.lat},${coordinates.lng}`;
        const destination = `${newDestination.coordinates.lat},${newDestination.coordinates.lng}`;
        const result = await fetchTransitData(origin, destination, newDestination.allowedModes, maxWalkDistance);

        enrichedDestination = {
          name: newDestination.name,
          route: result.route || "N/A",
          departure: formatTime(result.startTime),
          arrival: formatTime(result.endTime),
          travel: formatDuration(result.duration),
          legs: result.legs,
          coordinates: newDestination.coordinates,
          dark: updatedDestinations.length % 2 === 0,
        };
      }

      const updatedDestinationData = [...destinationData, enrichedDestination];
      setDestinations(slideId, updatedDestinations);
      setDestinationData(slideId, updatedDestinationData);
    } catch (error: any) {
      // Always add a fallback destination
      const fallbackDestination = {
        name: displayName || query,
        route: null,
        departure: null,
        arrival: null,
        travel: null,
        legs: null,
        coordinates: {
          lat: selectedFeature.geometry.coordinates[1],
          lng: selectedFeature.geometry.coordinates[0],
        },
        dark: (destinations.length + 1) % 2 === 0,
      };

      setDestinations(slideId, [...destinations, { name: fallbackDestination.name, coordinates: fallbackDestination.coordinates }]);
      setDestinationData(slideId, [...destinationData, fallbackDestination]);

      setErrorMessage(slideId, "There is currently no good trip for this destination.");
      setTimeout(() => {
        setErrorMessage(slideId, "");
      }, 5000);
    }

    setLoading(slideId, false);
  };


  return (
    <>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[#4a5568] mb-4">
              <span>Home</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium">Transit Destination Table Page Template</span>
            </div>

            <p className="text-[#606061] mb-6">Input the destinations that you would like for the map to show. The maximum number of routes that this table can accommodate is 5.</p>

            {/* Destination Input */}
            <div className="mb-6">
              <div className="flex items-center mb-1">
                <label className="block text-[#4a5568] font-medium mb-2">Add Destination</label>
                <span className="text-xs text-[#718096] ml-2 mb-2">
                  ({destinations.length}/{MAX_DESTINATIONS} destinations)
                </span>
                {errorMessage && (
                  <div className="mb-2 text-red-500 text-sm flex items-center ml-9">
                    {errorMessage}
                  </div>
                )}
              </div>
              {destinations.length >= MAX_DESTINATIONS && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                  Maximum of {MAX_DESTINATIONS} destinations reached. Remove a destination to add another.
                </div>
              )}
              <div className="flex gap-3">
                {/* Destination Input */}
                <Input
                  placeholder="Destination"
                  value={query}
                  onChange={(e) => {
                    setQuery(slideId, e.target.value);
                    setSelectedFeature(slideId, "");
                    setLocationError(slideId, false);
                  }}
                  className={`bg-white text-[#1a202c] w-[48%] ${locationError ? "border border-red-500" : ""}`}
                />

                {/* Display Name Input */}
                <Input
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(slideId, e.target.value)}
                  className="bg-white text-[#1a202c] w-[48%]"
                />

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 bg-white border rounded mt-10 w-[35%] max-h-48 overflow-y-auto shadow-md">
                    {suggestions.map((feature: any, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSelect(feature)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black"
                      >
                        {feature.place_name || feature.properties.name + ', ' + feature.properties.full_address}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add Button */}
                {loading ? (
                  // Spinner (same size as button)
                  <div className="w-10 h-10 flex items-center justify-center border border-[#cbd5e0] rounded-md">
                    <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-[#cbd5e0] bg-transparent"
                    onClick={handleCreate}
                    disabled={destinations.length >= MAX_DESTINATIONS}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="h-[550px] rounded-lg border border-[#e2e8f0] overflow-hidden">
              <TransitDestinationPreview slideId={slideId} />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 mt-4">
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePreview()}>Preview Screens</Button>
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePublish()}>Publish Screens</Button>
              <div className="flex items-center text-xs text-gray-500 ml-2 animate-fade-in">
                {saveStatus === 'saving' ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    Saved Locally
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4 overflow-y-auto">

          {/* Color Customization */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="flex items-center gap-2 text-[#4a5568] font-medium text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFooter}
                  onChange={(e) => setShowFooter(slideId, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                Show Footer
              </label>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table Header Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={backgroundColor} className="flex-1 text-xs" onChange={(e) => { setBackgroundColor(slideId, e.target.value) }} />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Row Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={rowColor}
                    onChange={(e) => setRowColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={rowColor} className="flex-1 text-xs" onChange={(e) => { setRowColor(slideId, e.target.value) }} />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Alternating Row Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={alternateRowColor}
                    onChange={(e) => setAlternateRowColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={alternateRowColor} className="flex-1 text-xs" onChange={(e) => { setAlternateRowColor(slideId, e.target.value) }} />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table Header Text Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={tableHeaderTextColor}
                    onChange={(e) => setTableHeaderTextColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={tableHeaderTextColor} className="flex-1 text-xs" onChange={(e) => { setTableHeaderTextColor(slideId, e.target.value) }} />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Row Text Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={tableTextColor}
                    onChange={(e) => setTableTextColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={tableTextColor} className="flex-1 text-xs" onChange={(e) => { setTableTextColor(slideId, e.target.value) }} />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Alternating Row Text Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={alternateRowTextColor}
                    onChange={(e) => setAlternateRowTextColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={alternateRowTextColor} className="flex-1 text-xs" onChange={(e) => { setAlternateRowTextColor(slideId, e.target.value) }} />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Header Text Size</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0 text-lg"
                  onClick={() => setTitleTextSize(slideId, Math.max(1, titleTextSize - 1))}
                  disabled={titleTextSize <= 1}
                >
                  −
                </Button>
                <span className="w-6 text-center text-sm font-medium">{titleTextSize}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0 text-lg"
                  onClick={() => setTitleTextSize(slideId, Math.min(10, titleTextSize + 1))}
                  disabled={titleTextSize >= 10}
                >
                  +
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Content Text Size</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0 text-lg"
                  onClick={() => setContentTextSize(slideId, Math.max(1, contentTextSize - 1))}
                  disabled={contentTextSize <= 1}
                >
                  −
                </Button>
                <span className="w-6 text-center text-sm font-medium">{contentTextSize}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0 text-lg"
                  onClick={() => setContentTextSize(slideId, Math.min(10, contentTextSize + 1))}
                  disabled={contentTextSize >= 10}
                >
                  +
                </Button>
              </div>
            </div>

          </div>

          <div className="mb-4">
            <h3 className="text-[#4a5568] font-medium mb-3 pb-2 border-b border-[#e2e8f0] text-xs">Destinations</h3>
            <div className="space-y-2">
              {destinations.map((dest: any, index: number) => {
                const hasFilters = (dest.allowedRoutes?.length ?? 0) > 0 || (dest.bannedRoutes?.length ?? 0) > 0;
                return (
                  <div key={index} className="bg-[#f4f4f4] rounded">
                    <div className="flex items-center justify-between p-2">
                      <span className="text-xs text-[#4a5568] truncate pr-1 flex-1">{dest.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {hasFilters && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" title="Route filters active" />
                        )}
                        <button
                          className="p-0.5 text-gray-400 hover:text-gray-700"
                          onClick={() => setSettingsDest(dest.name)}
                          title="Destination settings"
                        >
                          <Settings className="w-3 h-3" />
                        </button>
                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => handleDeleteDestination(dest.name)}>
                          <X className="w-2 h-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-[#4a5568] font-medium mb-3 pb-2 border-b border-[#e2e8f0] text-xs">Notifications</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[#4a5568] font-medium mb-1 text-xs">Message when data is unavailable</label>
                <textarea
                  className="w-full border border-[#e2e8f0] rounded px-2 py-1.5 text-xs text-[#4a5568] resize-none focus:outline-none focus:border-blue-400"
                  rows={3}
                  placeholder="Live transit data is currently unavailable."
                  value={outageMessage}
                  onChange={(e) => setOutageMessage(slideId, e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`skip-on-error-td-${slideId}`}
                  checked={skipOnError}
                  onChange={(e) => setSkipOnError(slideId, e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-500"
                />
                <label htmlFor={`skip-on-error-td-${slideId}`} className="text-xs text-[#4a5568]">Skip this slide when data is unavailable</label>
              </div>
            </div>
          </div>

          <div className="mt-auto">
          <Button className="w-full bg-[#e2e8f0] hover:bg-[#cbd5e0] text-[#4a5568] font-medium text-xs mt-2" onClick={handleOpenSettings}>
            Screen Settings
          </Button>

            <Button className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2" onClick={() => { handleDelete(slideId) }}>
              Delete Screen
            </Button>
          </div>
        </div>
      </div>

      {settingsDest && (() => {
        const dest = destinations.find((d: any) => d.name === settingsDest);
        if (!dest) return null;
        const destResult = destinationData.find((d: any) => d.name === settingsDest);
        return (
          <DestinationSettingsModal
            dest={dest}
            slideId={slideId}
            destResult={destResult}
            globalMaxWalkDistance={maxWalkDistance}
            onClose={() => setSettingsDest(null)}
            onRefetch={handleRefetchDestination}
            refetching={refetchingDest === settingsDest}
            handleToggleMode={handleToggleMode}
            setDestinationPreferredItinerary={setDestinationPreferredItinerary}
            setDestinationMaxWalkDistance={setDestinationMaxWalkDistance}
            setDestinationAllowedRoutes={setDestinationAllowedRoutes}
            setDestinationBannedRoutes={setDestinationBannedRoutes}
          />
        );
      })()}
    </>
  );
}