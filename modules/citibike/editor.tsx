import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight } from "lucide-react"
import CitibikePreview from "./preview"
import { useEffect, useRef } from "react"
import { useCitibikeStore, KNOWN_PROVIDERS } from "./store"
import { useGeneralStore } from "@/stores/general"
import { fetchCitibikeData } from "@/services/data-gathering/fetchCitibikeData"
import { useLocalSaveStatus } from "@/hooks/useLocalSaveStatus"
import { useImageUploadField } from "@/hooks/useImageUploadField"

export default function CitibikeSlide({ slideId, handleDelete, handlePreview, handlePublish, handleOpenSettings }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void, handlePublish: () => void, handleOpenSettings: () => void }) {

  const title = useCitibikeStore((state) => state.slides[slideId]?.title || '');
  const backgroundColor = useCitibikeStore((state) => state.slides[slideId]?.backgroundColor || '#192F51');
  const setBackgroundColor = useCitibikeStore((state) => state.setBackgroundColor);
  const bgImage = useCitibikeStore((state) => state.slides[slideId]?.bgImage || '');
  const setBgImage = useCitibikeStore((state) => state.setBgImage);
  const titleColor = useCitibikeStore((state) => state.slides[slideId]?.titleColor || '#ffffff');
  const setTitleColor = useCitibikeStore((state) => state.setTitleColor);
  const textColor = useCitibikeStore((state) => state.slides[slideId]?.textColor || '#ffffff');
  const setTextColor = useCitibikeStore((state) => state.setTextColor);
  const logoImage = useCitibikeStore((state) => state.slides[slideId]?.logoImage || '');
  const setLogoImage = useCitibikeStore((state) => state.setLogoImage);
  const searchRadius = useCitibikeStore((state) => state.slides[slideId]?.searchRadius || 0.5);
  const setSearchRadius = useCitibikeStore((state) => state.setSearchRadius);
  const selectedProvider = useCitibikeStore((state) => state.slides[slideId]?.selectedProvider ?? KNOWN_PROVIDERS[0]);
  const setSelectedProvider = useCitibikeStore((state) => state.setSelectedProvider);
  const vehicleMarkerColor = useCitibikeStore((state) => state.slides[slideId]?.vehicleMarkerColor || '#22C55E');
  const setVehicleMarkerColor = useCitibikeStore((state) => state.setVehicleMarkerColor);

  const titleTextSize = useCitibikeStore((state) => state.slides[slideId]?.titleTextSize || 5);
  const setTitleTextSize = useCitibikeStore((state) => state.setTitleTextSize);

  const contentTextSize = useCitibikeStore((state) => state.slides[slideId]?.contentTextSize || 5);
  const setContentTextSize = useCitibikeStore((state) => state.setContentTextSize);

  const showTitle = useCitibikeStore((state) => state.slides[slideId]?.showTitle !== false);
  const setShowTitle = useCitibikeStore((state) => state.setShowTitle);

  const mutedMap = useCitibikeStore((state) => state.slides[slideId]?.mutedMap !== false);
  const setMutedMap = useCitibikeStore((state) => state.setMutedMap);

  const showTransitStops = useCitibikeStore((state) => state.slides[slideId]?.showTransitStops !== false);
  const setShowTransitStops = useCitibikeStore((state) => state.setShowTransitStops);

  const showFooter = useGeneralStore((state) => state.slides.find((s) => s.id === slideId)?.showFooter ?? true);
  const setShowFooter = useGeneralStore((state) => state.setShowFooter);

  const shortcode = useGeneralStore((state) => state.shortcode || '');
  const saveStatus = useLocalSaveStatus(useCitibikeStore, slideId);
  const bg = useImageUploadField(shortcode, bgImage, (url) => setBgImage(slideId, url));
  const logo = useImageUploadField(shortcode, logoImage, (url) => setLogoImage(slideId, url));

  // Re-fetch when search radius changes
  const radiusChangeRef = useRef(false);
  useEffect(() => {
    if (!radiusChangeRef.current) {
      radiusChangeRef.current = true;
      return;
    }
    const timeout = setTimeout(() => {
      fetchCitibikeData(slideId);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchRadius, slideId]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 bg-white overflow-y-auto">
        <div className="p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[#4a5568] mb-4">
            <span>Home</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium">Micromobility Page</span>
          </div>

          <p className="text-[#606061] mb-6">
            Displays nearby rental stations and vehicle availability for the selected provider based on the screen&apos;s origin location.
          </p>

          {/* Preview Area */}
          <div className="h-[550px] rounded-lg border border-[#e2e8f0] overflow-hidden">
            <CitibikePreview slideId={slideId} />
          </div>

          {/* Footer Buttons */}
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
                checked={showFooter}
                onChange={(e) => setShowFooter(slideId, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              Show Footer
            </label>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[#4a5568] font-medium text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={mutedMap}
                onChange={(e) => setMutedMap(slideId, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              Grayscale Map
            </label>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[#4a5568] font-medium text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showTransitStops}
                onChange={(e) => setShowTransitStops(slideId, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              Show Transit Stops
            </label>
          </div>

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
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Provider</label>
            <select
              value={selectedProvider.id}
              onChange={(e) => {
                const provider = KNOWN_PROVIDERS.find((p) => p.id === e.target.value);
                if (provider) {
                  setSelectedProvider(slideId, provider);
                  fetchCitibikeData(slideId);
                }
              }}
              className="provider-select w-full text-xs border border-[#e2e8f0] rounded bg-white text-[#4a5568]"
            >
              {KNOWN_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.vehicleType})
                </option>
              ))}
            </select>
           
          </div>

          {selectedProvider.vehicleType !== 'bike' && (
            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Vehicle Marker Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={vehicleMarkerColor}
                    onChange={(e) => setVehicleMarkerColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={vehicleMarkerColor} className="flex-1 text-xs" onChange={(e) => setVehicleMarkerColor(slideId, e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Search Radius (miles)</label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={searchRadius}
              className="text-xs"
              onChange={(e) => setSearchRadius(slideId, parseFloat(e.target.value) || 0.5)}
            />
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
          <Button className="w-full bg-[#e2e8f0] hover:bg-[#cbd5e0] text-[#4a5568] font-medium text-xs mt-2" onClick={handleOpenSettings}>
            Screen Settings
          </Button>

          <Button className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2" onClick={() => handleDelete(slideId)}>
            Delete Screen
          </Button>
        </div>
      </div>
    </div>
  )
}
