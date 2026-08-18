import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight } from "lucide-react"
import TrafficCongestionPreview from "./preview"
import { useEffect, useRef, useState } from "react"
import { useTrafficCongestionStore } from "./store"
import { useGeneralStore } from "@/stores/general"
import { useLocalSaveStatus } from "@/hooks/useLocalSaveStatus"
import { useImageUploadField } from "@/hooks/useImageUploadField"

export default function TrafficCongestionSlide({
  slideId,
  handleDelete,
  handlePreview,
  handlePublish,
  handleOpenSettings,
}: {
  slideId: string;
  handleDelete: (id: string) => void;
  handlePreview: () => void;
  handlePublish: () => void;
  handleOpenSettings: () => void;
}) {
  const showTitle = useTrafficCongestionStore((state) => state.slides[slideId]?.showTitle !== false);
  const setShowTitle = useTrafficCongestionStore((state) => state.setShowTitle);
  const backgroundColor = useTrafficCongestionStore((state) => state.slides[slideId]?.backgroundColor || '#192F51');
  const setBackgroundColor = useTrafficCongestionStore((state) => state.setBackgroundColor);
  const titleColor = useTrafficCongestionStore((state) => state.slides[slideId]?.titleColor || '#ffffff');
  const setTitleColor = useTrafficCongestionStore((state) => state.setTitleColor);
  const textColor = useTrafficCongestionStore((state) => state.slides[slideId]?.textColor || '#ffffff');
  const setTextColor = useTrafficCongestionStore((state) => state.setTextColor);
  const bgImage = useTrafficCongestionStore((state) => state.slides[slideId]?.bgImage || '');
  const setBgImage = useTrafficCongestionStore((state) => state.setBgImage);
  const logoImage = useTrafficCongestionStore((state) => state.slides[slideId]?.logoImage || '');
  const setLogoImage = useTrafficCongestionStore((state) => state.setLogoImage);
  const mapCenter = useTrafficCongestionStore((state) => state.slides[slideId]?.mapCenter);
  const setMapCenter = useTrafficCongestionStore((state) => state.setMapCenter);
  const titleTextSize = useTrafficCongestionStore((state) => state.slides[slideId]?.titleTextSize || 5);
  const setTitleTextSize = useTrafficCongestionStore((state) => state.setTitleTextSize);
  const contentTextSize = useTrafficCongestionStore((state) => state.slides[slideId]?.contentTextSize || 5);
  const setContentTextSize = useTrafficCongestionStore((state) => state.setContentTextSize);

  const showFooter = useGeneralStore((state) => state.slides.find((s) => s.id === slideId)?.showFooter ?? true);
  const setShowFooter = useGeneralStore((state) => state.setShowFooter);
  const screenCoords = useGeneralStore((state) => state.coordinates);
  const shortcode = useGeneralStore((state) => state.shortcode || '');

  const saveStatus = useLocalSaveStatus(useTrafficCongestionStore, slideId);
  const bg = useImageUploadField(shortcode, bgImage, (url) => setBgImage(slideId, url));
  const logo = useImageUploadField(shortcode, logoImage, (url) => setLogoImage(slideId, url));

  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCustomCenter = !!mapCenter;
  const displayCenter = mapCenter
    ? `${mapCenter[0].toFixed(4)}, ${mapCenter[1].toFixed(4)}`
    : screenCoords
    ? `${screenCoords.lat.toFixed(4)}, ${screenCoords.lng.toFixed(4)} (screen center)`
    : 'Not set';

  useEffect(() => {
    if (!addressQuery || addressQuery.length < 3) { setSuggestions([]); return; }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    const controller = new AbortController();
    searchTimeoutRef.current = setTimeout(async () => {
      const token = process.env.NEXT_PUBLIC_MAPBOX_KEY;
      const bbox = "-79.7624,40.4774,-71.7517,45.0153";
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressQuery)}.json` +
          `?autocomplete=true&bbox=${bbox}&limit=5&access_token=${token}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err);
      }
    }, 300);
    return () => { controller.abort(); if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [addressQuery]);

  const handleSelectSuggestion = (feature: any) => {
    const [lng, lat] = feature.center;
    setMapCenter(slideId, [lat, lng]);
    setAddressQuery(feature.place_name || '');
    setSuggestions([]);
  };

  const handleResetToScreenCenter = () => {
    setMapCenter(slideId, undefined);
    setAddressQuery('');
    setSuggestions([]);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 bg-white overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 text-[#4a5568] mb-4">
            <span>Home</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium">Traffic Congestion Map</span>
          </div>

          <p className="text-[#606061] mb-5 text-sm">
            Displays a live traffic congestion map for the configured area. Defaults to the screen&apos;s location. Search an address to override the map center.
          </p>

          {/* Address search */}
          <div className="mb-5">
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Map Center</label>
            <div className="relative">
              <Input
                placeholder="Search an address to override map center..."
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                className="text-xs"
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border border-[#e2e8f0] rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                  {suggestions.map((feature: any, idx: number) => (
                    <li
                      key={idx}
                      onMouseDown={() => handleSelectSuggestion(feature)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs text-[#1a202c]"
                    >
                      {feature.place_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-gray-400">Current: {displayCenter}</span>
              {isCustomCenter && (
                <button
                  onClick={handleResetToScreenCenter}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Reset to screen center
                </button>
              )}
            </div>
          </div>

          <div className="h-[500px] rounded-lg border border-[#e2e8f0] overflow-hidden">
            <TrafficCongestionPreview slideId={slideId} />
          </div>

          <div className="flex gap-3 mt-4">
            <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePreview()}>Preview Screens</Button>
            <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePublish()}>Publish Screens</Button>
            <div className="flex items-center text-xs text-gray-500 ml-2 animate-fade-in">
              {saveStatus === 'saving' ? (
                <><div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse mr-2" />Saving...</>
              ) : (
                <><div className="w-2 h-2 rounded-full bg-green-500 mr-2" />Saved Locally</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4 overflow-y-auto">
        <div className="space-y-3 mb-4">

          <div>
            <label className="flex items-center gap-2 text-[#4a5568] font-medium text-xs cursor-pointer">
              <input type="checkbox" checked={showTitle} onChange={(e) => setShowTitle(slideId, e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
              Show Title
            </label>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[#4a5568] font-medium text-xs cursor-pointer">
              <input type="checkbox" checked={showFooter} onChange={(e) => setShowFooter(slideId, e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
              Show Footer
            </label>
          </div>

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

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Image</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden">
                {bg.isUploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" /> : bgImage ? <img src={bgImage} alt="BG" className="w-full h-full object-cover" /> : <div className="w-4 h-4 bg-[#cbd5e0] rounded" />}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  <input type="file" accept="image/*" ref={bg.inputRef} onChange={bg.handleUpload} className="hidden" />
                  <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1" onClick={() => bg.inputRef.current?.click()}>Change</Button>
                  {bgImage && <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1" onClick={bg.handleRemove}>Remove</Button>}
                </div>
                {bg.uploadError && <p className="text-xs text-red-500">{bg.uploadError}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Logo Image</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden">
                {logo.isUploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" /> : logoImage ? <img src={logoImage} alt="Logo" className="w-full h-full object-cover" /> : <div className="w-4 h-4 bg-[#cbd5e0] rounded" />}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  <input type="file" accept="image/*" ref={logo.inputRef} onChange={logo.handleUpload} className="hidden" />
                  <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1" onClick={() => logo.inputRef.current?.click()}>Change</Button>
                  {logoImage && <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1" onClick={logo.handleRemove}>Remove</Button>}
                </div>
                {logo.uploadError && <p className="text-xs text-red-500">{logo.uploadError}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Title Text Size</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-lg" onClick={() => setTitleTextSize(slideId, Math.max(1, titleTextSize - 1))} disabled={titleTextSize <= 1}>−</Button>
              <span className="w-6 text-center text-sm font-medium">{titleTextSize}</span>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-lg" onClick={() => setTitleTextSize(slideId, Math.min(10, titleTextSize + 1))} disabled={titleTextSize >= 10}>+</Button>
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Content Text Size</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-lg" onClick={() => setContentTextSize(slideId, Math.max(1, contentTextSize - 1))} disabled={contentTextSize <= 1}>−</Button>
              <span className="w-6 text-center text-sm font-medium">{contentTextSize}</span>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-lg" onClick={() => setContentTextSize(slideId, Math.min(10, contentTextSize + 1))} disabled={contentTextSize >= 10}>+</Button>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <Button className="w-full bg-[#e2e8f0] hover:bg-[#cbd5e0] text-[#4a5568] font-medium text-xs mt-2" onClick={handleOpenSettings}>
            Screen Settings
          </Button>
          <Button className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2" onClick={() => handleDelete(slideId)}>
            Delete Screen
          </Button>
        </div>
      </div>
    </div>
  );
}
