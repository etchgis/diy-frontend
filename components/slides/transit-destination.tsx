import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Plus, X } from "lucide-react"
import TransitDestinationPreview from "../slide-previews/transit-destination-preview"
import { useTransitDestinationsStore } from "@/stores/transitDestinations"
import { useEffect, useRef, useState } from "react"
import { useGeneralStore } from "@/stores/general"
import { fetchTransitData } from "@/services/data-gathering/fetchTransitDestinationData"
import { formatTime, formatDuration } from "@/utils/formats"

const MAX_DESTINATIONS = 6;

export default function TransitDestinationSlide({ slideId, handleDelete, handlePreview, handlePublish }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void, handlePublish: () => void }) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renderCount = useRef(0);


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

  const displayName = useTransitDestinationsStore((state) => state.slides[slideId]?.displayName || '');
  const setDisplayName = useTransitDestinationsStore((state) => state.setDisplayName);

  const query = useTransitDestinationsStore((state) => state.slides[slideId]?.query || '');
  const setQuery = useTransitDestinationsStore((state) => state.setQuery);

  const coordinates = useGeneralStore((state) => state.coordinates);

  const mockDestinations: any = []

  const destinationData = useTransitDestinationsStore((state) => state.slides[slideId]?.destinationData || mockDestinations);
  const setDestinationData = useTransitDestinationsStore((state) => state.setDestinationData);



  useEffect(() => {
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
  }, [backgroundColor, rowColor, alternateRowColor, tableHeaderTextColor, tableTextColor]);



  const destinations = useTransitDestinationsStore((state) => state.slides[slideId]?.destinations || mockDestinations);
  const setDestinations = useTransitDestinationsStore((state) => state.setDestinations);




  const handleDeleteDestination = (name: string) => {

    const updatedDestinations = destinations.filter((dest: any) => dest.name !== name);
    const updatedDestinationData = destinationData.filter((dest: any) => dest.name !== name);
    setDestinations(slideId, updatedDestinations);
    setDestinationData(slideId, updatedDestinationData);

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
      };

      const updatedDestinations = [...destinations, newDestination];
      setQuery(slideId, "");
      setDisplayName(slideId, "");
      setSelectedFeature(slideId, "");
      setLocationError(slideId, false);

      const origin = `${coordinates.lat},${coordinates.lng}`;
      const destination = `${newDestination.coordinates.lat},${newDestination.coordinates.lng}`;

      const result = await fetchTransitData(origin, destination);

      const enrichedDestination = {
        name: newDestination.name,
        route: result.route || "N/A",
        departure: formatTime(result.startTime),
        arrival: formatTime(result.endTime),
        travel: formatDuration(result.duration),
        legs: result.legs,
        coordinates: newDestination.coordinates,
        dark: updatedDestinations.length % 2 === 0,
      };

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
      <div className="flex flex-1">
        {/* Main Content */}
        <div className="flex-1 bg-white">
          <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[#4a5568] mb-4">
              <span>Home</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium">Transit Destination Table Page Template</span>
            </div>

            <p className="text-[#606061] mb-6">Input the destinations that you would like for the map to show. The maximum number of routes that this table can accommodate is 6.</p>

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
        <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4">

          {/* Color Customization */}
          <div className="space-y-3 mb-4">
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


          </div>

          <div className="mb-4">
            <h3 className="text-[#4a5568] font-medium mb-3 pb-2 border-b border-[#e2e8f0] text-xs">Destinations</h3>
            <div className="space-y-2">
              {destinations.map((dest: any, index: number) => (
                <div key={index} className="flex items-center justify-between bg-[#f4f4f4] p-2 rounded">
                  <span className="text-xs text-[#4a5568] truncate pr-2">{dest.name}</span>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 flex-shrink-0" onClick={() => handleDeleteDestination(dest.name)}>
                    <X className="w-2 h-2" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <Button className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2" onClick={() => { handleDelete(slideId) }}>
              Delete Screen
            </Button>
          </div>
        </div>
      </div>


    </>
  );
}