import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight } from "lucide-react"
import TrafficCorridorPreview from "./preview"
import { useEffect, useRef, useState } from "react"
import { useTrafficCorridorStore, type Corridor } from "./store"
import { useGeneralStore } from "@/stores/general"
import { deleteImage } from "@/services/deleteImage"
import { uploadImage } from "@/services/uploadImage"
import { fetchTrafficData } from "@/services/data-gathering/fetchTrafficData"
import { fetchSkidsTransitData } from "@/services/data-gathering/fetchSkidsDestinationData"

const DEFAULT_TABLES = [{ destination: '', corridors: [] }, { destination: '', corridors: [] }];

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

  const showSecondTable = useTrafficCorridorStore((state) => state.slides[slideId]?.showSecondTable ?? false);
  const setShowSecondTable = useTrafficCorridorStore((state) => state.setShowSecondTable);

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

  const shortcode = useGeneralStore((state) => state.shortcode || '');
  const coordinates = useGeneralStore((state) => state.coordinates || { lat: 0, lng: 0 });

  const [query1, setQuery1] = useState('');
  const [suggestions1, setSuggestions1] = useState<any[]>([]);
  const [query2, setQuery2] = useState('');
  const [suggestions2, setSuggestions2] = useState<any[]>([]);
  const justSelected1 = useRef(false);
  const justSelected2 = useRef(false);

  const MAPBOX_KEY = process.env.NEXT_PUBLIC_MAPBOX_KEY;
  const NY_BBOX = '-79.7624,40.4774,-71.7517,45.0153';

  const fetchSuggestions = async (query: string, signal: AbortSignal, setSuggestions: (s: any[]) => void) => {
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
      setSuggestions(merged.slice(0, 5));
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error(err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    if (query1.length < 3) { setSuggestions1([]); return; }
    if (justSelected1.current) { justSelected1.current = false; return; }
    fetchSuggestions(query1, controller.signal, setSuggestions1);
    return () => controller.abort();
  }, [query1]);

  useEffect(() => {
    const controller = new AbortController();
    if (query2.length < 3) { setSuggestions2([]); return; }
    if (justSelected2.current) { justSelected2.current = false; return; }
    fetchSuggestions(query2, controller.signal, setSuggestions2);
    return () => controller.abort();
  }, [query2]);

  const updateDestination = (tableIndex: number, destination: string) => {
    const newTables = tables.map((t, i) => i === tableIndex ? { ...t, destination } : t);
    setTables(slideId, newTables);
  };

  const fetchTransitForTable = async (tableIndex: number, coords: [number, number]) => {
    try {
      const origin = { lat: coordinates.lat, lng: coordinates.lng };
      // coords are [lng, lat] (Mapbox convention) — swap for Skids
      const dest = { name: '', coordinates: { lat: coords[1], lng: coords[0] } };
      const results = await fetchSkidsTransitData(origin, [dest]);
      const result = results[0];
      const transitAlternative = result?.travel
        ? { route: result.route, travel: result.travel, legs: result.legs ?? [] }
        : null;
      const freshTables = useTrafficCorridorStore.getState().slides[slideId]?.tables ?? tables;
      setTables(slideId, freshTables.map((t, i) => i === tableIndex ? { ...t, transitAlternative } : t));
    } catch (err) {
      console.error('Failed to fetch transit alternative:', err);
    }
  };

  const handleTransitToggle = async (tableIndex: number, checked: boolean) => {
    const freshTables = useTrafficCorridorStore.getState().slides[slideId]?.tables ?? tables;
    setTables(slideId, freshTables.map((t, i) =>
      i === tableIndex ? { ...t, showTransitAlternative: checked, transitAlternative: checked ? t.transitAlternative : undefined } : t
    ));
    if (checked) {
      const coords = freshTables[tableIndex]?.coordinates;
      if (coords) await fetchTransitForTable(tableIndex, coords);
    }
  };

  const handleSelect = async (tableIndex: number, feature: any) => {
    const name = feature.place_name || `${feature.properties?.name}, ${feature.properties?.full_address}`;
    const coords: [number, number] | undefined = feature.geometry?.coordinates ?? feature.center;

    if (tableIndex === 0) { justSelected1.current = true; setQuery1(name); setSuggestions1([]); }
    else { justSelected2.current = true; setQuery2(name); setSuggestions2([]); }

    // Store destination + coordinates, clear corridors while fetching
    const tablesWithDest = tables.map((t, i) =>
      i === tableIndex ? { ...t, destination: name, coordinates: coords, corridors: [] } : t
    );
    setTables(slideId, tablesWithDest);

    // Fetch live corridor data from the traffic API
    if (coords && coordinates.lat && coordinates.lng) {
      try {
        const origin: [number, number] = [coordinates.lng, coordinates.lat];
        const results = await fetchTrafficData(origin, [coords]);
        const alternatives = results[0]?.alternatives ?? [];
        const seen = new Set<string>();
        const corridors: Corridor[] = alternatives
          .filter((alt) => {
            if (seen.has(alt.label)) return false;
            seen.add(alt.label);
            return true;
          })
          .slice(0, 3)
          .map((alt) => ({ name: alt.label, time: `${alt.minutes} min` }));
        // Read fresh tables from store to avoid stale closure
        const freshTables = useTrafficCorridorStore.getState().slides[slideId]?.tables ?? tablesWithDest;
        setTables(slideId, freshTables.map((t, i) => i === tableIndex ? { ...t, corridors } : t));

        // Also refresh transit alternative if enabled
        if (freshTables[tableIndex]?.showTransitAlternative && coords) {
          await fetchTransitForTable(tableIndex, coords);
        }
      } catch (err) {
        console.error('Failed to fetch traffic data:', err);
      }
    }
  };

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
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSaveStatus('saved'), 600);
  }, [showTitle, showSecondTable, backgroundColor, tableHeaderColor, rowColor, titleColor, textColor, bgImage, logoImage, titleTextSize, contentTextSize]);

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
      if (currentImage) {
        deleteImage(currentImage).catch((err) => console.error('Failed to delete previous image:', err));
      }
      setImageFn(slideId, data.url);
    }).catch((err) => {
      console.error('Image upload failed:', err);
    }).finally(() => {
      setLoadingFn(false);
    });
  };

  const handleRemoveImage = (target: 'bg' | 'logo') => {
    const currentImage = target === 'bg' ? bgImage : logoImage;
    const setImageFn = target === 'bg' ? setBgImage : setLogoImage;
    const inputRef = target === 'bg' ? fileInputRef : logoInputRef;

    if (currentImage) {
      deleteImage(currentImage).then(() => {
        setImageFn(slideId, '');
        if (inputRef.current) inputRef.current.value = '';
      }).catch((err) => console.error('Failed to delete image:', err));
    }
  };

  return (
    <div className="flex flex-1">
      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[#4a5568] mb-4">
            <span>Home</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium">Traffic Corridor</span>
          </div>

          <p className="text-[#606061] mb-4">
            Displays drive times to user-defined destinations via different highway corridors. Enter destination names below — corridors auto-populate and can be edited directly in the preview.
          </p>

          {/* Destination Inputs */}
          <div className="mb-5 space-y-4">
            <div>
              <div className="relative">
                <label className="block text-[#4a5568] font-medium mb-1 text-sm">Destination 1</label>
                <Input
                  placeholder="Search for a location..."
                  value={query1}
                  onChange={(e) => setQuery1(e.target.value)}
                  autoComplete="off"
                />
                {suggestions1.length > 0 && (
                  <ul className="absolute z-20 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                    {suggestions1.map((feature: any, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSelect(0, feature)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black text-sm"
                      >
                        {feature.place_name || `${feature.properties?.name}, ${feature.properties?.full_address}`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-1.5">
                <label className="block text-[#4a5568] text-xs mb-1">Table header label</label>
                <Input
                  placeholder="Edit how the destination appears in the table..."
                  value={tables[0]?.destination || ''}
                  onChange={(e) => updateDestination(0, e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            {showSecondTable && (
              <div>
                <div className="relative">
                  <label className="block text-[#4a5568] font-medium mb-1 text-sm">Destination 2</label>
                  <Input
                    placeholder="Search for a location..."
                    value={query2}
                    onChange={(e) => setQuery2(e.target.value)}
                    autoComplete="off"
                  />
                  {suggestions2.length > 0 && (
                    <ul className="absolute z-20 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                      {suggestions2.map((feature: any, idx) => (
                        <li
                          key={idx}
                          onClick={() => handleSelect(1, feature)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black text-sm"
                        >
                          {feature.place_name || `${feature.properties?.name}, ${feature.properties?.full_address}`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-1.5">
                  <label className="block text-[#4a5568] text-xs mb-1">Table header label</label>
                  <Input
                    placeholder="Edit how the destination appears in the table..."
                    value={tables[1]?.destination || ''}
                    onChange={(e) => updateDestination(1, e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview Area */}
          <div className="h-[550px] rounded-lg border border-[#e2e8f0] overflow-hidden">
            <TrafficCorridorPreview slideId={slideId} />
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

          <div>
            <label className="flex items-center gap-2 text-[#4a5568] font-medium text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showSecondTable}
                onChange={(e) => setShowSecondTable(slideId, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              Show Second Destination
            </label>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[#4a5568] font-medium text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={tables[0]?.showTransitAlternative ?? false}
                onChange={(e) => handleTransitToggle(0, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              Transit Alternative (Dest. 1)
            </label>
          </div>

          {showSecondTable && (
            <div>
              <label className="flex items-center gap-2 text-[#4a5568] font-medium text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={tables[1]?.showTransitAlternative ?? false}
                  onChange={(e) => handleTransitToggle(1, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                Transit Alternative (Dest. 2)
              </label>
            </div>
          )}

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Color</label>
            <div className="flex items-center gap-2">
              <div className="colorContainer">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(slideId, e.target.value)}
                  className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                />
              </div>
              <Input value={backgroundColor} className="flex-1 text-xs" onChange={(e) => setBackgroundColor(slideId, e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table Header Color</label>
            <div className="flex items-center gap-2">
              <div className="colorContainer">
                <input
                  type="color"
                  value={tableHeaderColor}
                  onChange={(e) => setTableHeaderColor(slideId, e.target.value)}
                  className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                />
              </div>
              <Input value={tableHeaderColor} className="flex-1 text-xs" onChange={(e) => setTableHeaderColor(slideId, e.target.value)} />
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
                  className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                />
              </div>
              <Input value={rowColor} className="flex-1 text-xs" onChange={(e) => setRowColor(slideId, e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Title Text Color</label>
            <div className="flex items-center gap-2">
              <div className="colorContainer">
                <input
                  type="color"
                  value={titleColor}
                  onChange={(e) => setTitleColor(slideId, e.target.value)}
                  className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                />
              </div>
              <Input value={titleColor} className="flex-1 text-xs" onChange={(e) => setTitleColor(slideId, e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Text Color</label>
            <div className="flex items-center gap-2">
              <div className="colorContainer">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(slideId, e.target.value)}
                  className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                />
              </div>
              <Input value={textColor} className="flex-1 text-xs" onChange={(e) => setTextColor(slideId, e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Image</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden">
                {isBgUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                ) : bgImage ? (
                  <img src={bgImage} alt="BG" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-4 h-4 bg-[#cbd5e0] rounded" />
                )}
              </div>
              <div className="flex gap-1">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleImageUpload(e, 'bg')} className="hidden" />
                <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1" onClick={() => fileInputRef.current?.click()}>
                  Change
                </Button>
                {bgImage && (
                  <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1" onClick={() => handleRemoveImage('bg')}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Logo Image</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden">
                {isLogoUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                ) : logoImage ? (
                  <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-4 h-4 bg-[#cbd5e0] rounded" />
                )}
              </div>
              <div className="flex gap-1">
                <input type="file" accept="image/*" ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" />
                <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1" onClick={() => logoInputRef.current?.click()}>
                  Change
                </Button>
                {logoImage && (
                  <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1" onClick={() => handleRemoveImage('logo')}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Title Text Size</label>
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

        <div className="mt-auto">
          <Button
            className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2"
            onClick={() => handleDelete(slideId)}
          >
            Delete Screen
          </Button>
        </div>
      </div>
    </div>
  );
}
