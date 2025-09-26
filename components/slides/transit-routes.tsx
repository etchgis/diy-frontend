import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Plus, X } from "lucide-react"
import TransitRoutesPreview from "../slide-previews/transit-routes-preview"
import { useTransitRouteStore } from "@/stores/transitRoutes"
import { useGeneralStore } from "@/stores/general"
import { useEffect, useRef, useState } from "react"
import { fetchTransitData } from "@/services/data-gathering/fetchTransitDestinationData"
import { formatTime, formatDuration } from "@/utils/formats"

const MAX_DESTINATIONS = 6;

export default function TransitRoutesSlide({ slideId, handleDelete, handlePreview, handlePublish }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void, handlePublish: () => void }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renderCount = useRef(0);

  const destination = useTransitRouteStore((state) => state.slides[slideId]?.destination || '');
  const setDestination = useTransitRouteStore((state) => state.setDestination);


  const mockRoutes: any = [];
  const routes = useTransitRouteStore((state) => state.slides[slideId]?.routes || mockRoutes);
  const setRoutes = useTransitRouteStore((state) => state.setRoutes);

  const errorMessage = useTransitRouteStore((state) => state.slides[slideId]?.errorMessage || '');
  const setErrorMessage = useTransitRouteStore((state) => state.setErrorMessage);

  const setIsLoading = useTransitRouteStore((state) => state.setIsLoading);
  const isLoading = useTransitRouteStore((state) => state.slides[slideId]?.isLoading || false);


  const coordinates = useGeneralStore(
    (state) => state.coordinates ?? { lng: -73.7562, lat: 42.6526 }
  );

  const prevValuesRef = useRef({ destination: '' });

  useEffect(() => {
    if (
      prevValuesRef.current.destination === destination
    ) {
      return;
    }

    prevValuesRef.current = { destination };

    renderCount.current += 1;
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev && renderCount.current <= 2) {
      setSaveStatus('saved');
      return;
    }
    if (!isDev && renderCount.current === 1) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 600);
  }, [destination]);

  useEffect(() => {
    const controller = new AbortController();
    if (query?.length < 3) return;

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
    setSelectedFeature(feature);
    setQuery(feature.place_name || feature.properties.name + ', ' + feature.properties.full_address);
    setDestination(slideId, feature.place_name || feature.properties.name + ', ' + feature.properties.full_address);
    setSuggestions([]);
  };

  const handleCreate = async () => {
    if (!selectedFeature) return;

    const newDestination = {
      name: query,
      coordinates: {
        lat: selectedFeature.geometry.coordinates[1],
        lng: selectedFeature.geometry.coordinates[0],
      },
    };

    const origin = `${coordinates.lat},${coordinates.lng}`;
    const destination = `${newDestination.coordinates.lat},${newDestination.coordinates.lng}`;

    try {
      setIsLoading(slideId, true);
      const result = await fetchTransitData(origin, destination);

      const enrichedRoute = {
        name: newDestination.name,
        route: result.route || null,
        departure: result.startTime ? formatTime(result.startTime) : null,
        arrival: result.endTime ? formatTime(result.endTime) : null,
        travel: result.duration ? formatDuration(result.duration) : null,
        legs: result.legs || null,
        coordinates: newDestination.coordinates,
      };

      setRoutes(slideId, [...routes, enrichedRoute]);
    } catch (error: any) {
      // If fetch fails, still add fallback route
      const fallbackRoute = {
        name: newDestination.name,
        route: null,
        departure: null,
        arrival: null,
        travel: null,
        legs: null,
        coordinates: newDestination.coordinates,
      };

      setRoutes(slideId, [...routes, fallbackRoute]);

      setErrorMessage(slideId, error.message || 'Failed to fetch route data');
      setTimeout(() => {
        setErrorMessage(slideId, '');
      }, 5000);
    } finally {
      setQuery('');
      setIsLoading(slideId, false);
    }
  };

  useEffect(() => {

  }, [errorMessage]);

  const handleDeleteRoute = (routeName: string) => {
    const updatedRoutes = routes.filter((route: any) => route.name !== routeName);
    setRoutes(slideId, updatedRoutes);
    if (routeName === destination) {
      setDestination(slideId, '');
    }
  };


  return (
    <>
      <div className="flex flex-1 min-h-0">
        {/* Main Content */}
        <div className="flex-1 bg-white min-w-0">
          <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[#4a5568] mb-4">
              <span>Home</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium">Transit Route Destination Map Page</span>
            </div>
            <p className="text-[#606061] mb-6">Input the destinations that you would like for the map to show.</p>

            {/* Destination Search */}
            {/* Destination Search */}
            <div className="mb-6">
              <div className="flex items-center mb-1">
                <label className="block text-[#4a5568] font-medium mb-2">Add Destination</label>
                <span className="text-xs text-[#718096] ml-2 mb-2">
                  ({routes.length}/{MAX_DESTINATIONS} destinations)
                </span>
                {errorMessage && (
                  <div className="mb-2 text-red-500 text-sm flex items-center ml-9">
                    {errorMessage}
                  </div>
                )}
              </div>
              {routes.length >= MAX_DESTINATIONS && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                  Maximum of {MAX_DESTINATIONS} destinations reached. Remove a destination to add another.
                </div>
              )}
              <div className="flex w-full gap-2">
                <div className="relative flex-1 min-w-0">
                  <img
                    src="/images/search-icon.png"
                    alt="Search"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  />
                  <Input
                    placeholder="i.e Albany Airport"
                    value={query}
                    onChange={(e) => {
                      const value = e.target.value;
                      setQuery(value);
                      setSelectedFeature(null);
                      setDestination(slideId, value);
                    }}
                    className="pl-10 bg-white border-[#cbd5e0] w-full"
                  />

                  {suggestions.length > 0 && (
                    <ul className="absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                      {suggestions.map((feature: any, idx) => (
                        <li
                          key={idx}
                          onClick={() => handleSelect(feature)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black text-sm"
                        >
                          {feature.place_name || feature.properties.name + ', ' + feature.properties.full_address}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {isLoading ? (
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
                    disabled={routes.length >= MAX_DESTINATIONS}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Map Preview - Responsive container */}

            <div className="w-full">
              <div className=" h-[550px]  border border-[#e2e8f0] rounded-lg overflow-hidden">
                <TransitRoutesPreview slideId={slideId} />
              </div>
            </div>


            {/* Footer Buttons */}
            <div className="flex gap-3 mt-4 flex-wrap">
              <Button
                className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium"
                onClick={() => handlePreview()}
              >
                Preview Screens
              </Button>
              <Button
                className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium"
                onClick={() => handlePublish()}
              >
                Publish Screens
              </Button>
              {saveStatus !== 'idle' && (
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
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4 flex-shrink-0">
          <div className="mb-4">
            <h3 className="text-[#4a5568] font-medium mb-3 pb-2 border-b border-[#e2e8f0] text-xs">Destinations</h3>
            {routes && routes.length === 0 && (
              <div className="text-xs text-[#718096]">No destinations added yet</div>
            )}

            {routes && routes.length > 0 && (
              <div className="mt-2">
                {routes.map((route: any, index: number) => (
                  <div key={index} className="flex mt-2 items-center justify-between bg-[#f4f4f4] p-2 rounded">
                    <span className="text-xs text-[#4a5568] truncate pr-2">{route.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 flex-shrink-0"
                      onClick={() => handleDeleteRoute(route.name)}
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-auto">
            <Button
              className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2"
              onClick={() => { handleDelete(slideId) }}
            >
              Delete Screen
            </Button>
          </div>
        </div>
      </div>
    </>
  )

}