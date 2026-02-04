import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight } from "lucide-react"
import WeatherPreview from "../slide-previews/weather-preview"
import { useEffect, useRef, useState } from "react"
import { useWeatherStore } from "@/stores/weather"
import { useGeneralStore } from "@/stores/general"
import { deleteImage } from "@/services/deleteImage"
import { uploadImage } from "@/services/uploadImage"

export default function WeatherSlide({ slideId, handleDelete, handlePreview, handlePublish }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void, handlePublish: () => void }) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isBgUploading, setIsBgUploading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const renderCount = useRef(0);

  const title = useWeatherStore((state) => state.slides[slideId]?.title || '');
  const backgroundColor = useWeatherStore((state) => state.slides[slideId]?.backgroundColor || '#192F51');
  const setBackgroundColor = useWeatherStore((state) => state.setBackgroundColor);
  const bgImage = useWeatherStore((state) => state.slides[slideId]?.bgImage || '');
  const setBgImage = useWeatherStore((state) => state.setBgImage);
  const titleColor = useWeatherStore((state) => state.slides[slideId]?.titleColor || '#ffffff');
  const setTitleColor = useWeatherStore((state) => state.setTitleColor);
  const contentBackgroundColor = useWeatherStore((state) => state.slides[slideId]?.contentBackgroundColor || '');
  const setContentBackgroundColor = useWeatherStore((state) => state.setContentBackgroundColor);
  const textColor = useWeatherStore((state) => state.slides[slideId]?.textColor || '#ffffff');
  const setTextColor = useWeatherStore((state) => state.setTextColor);
  const logoImage = useWeatherStore((state) => state.slides[slideId]?.logoImage || '');
  const setLogoImage = useWeatherStore((state) => state.setLogoImage);

  const shortcode = useGeneralStore((state) => state.shortcode || '');

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
  }, [title, backgroundColor, contentBackgroundColor, bgImage, titleColor, textColor, logoImage]);

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
            <span className="font-medium">Weather Page</span>
          </div>

          <p className="text-[#606061] mb-6">
            Displays current weather and a 7-day forecast based on the screen's origin location.
          </p>

          {/* Preview Area */}
          <div className="h-[550px] rounded-lg border border-[#e2e8f0] overflow-hidden">
            <WeatherPreview slideId={slideId} />
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
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Content Background</label>
            <div className="flex items-center gap-2">
              <div className="colorContainer">
                <input
                  type="color"
                  value={contentBackgroundColor || '#000000'}
                  onChange={(e) => setContentBackgroundColor(slideId, e.target.value)}
                  className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                />
              </div>
              <Input value={contentBackgroundColor} placeholder="Transparent" className="flex-1 text-xs" onChange={(e) => setContentBackgroundColor(slideId, e.target.value)} />
              {contentBackgroundColor && (
                <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1" onClick={() => setContentBackgroundColor(slideId, '')}>
                  Clear
                </Button>
              )}
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
        </div>

        <div className="mt-auto">
          <Button className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2" onClick={() => handleDelete(slideId)}>
            Delete Screen
          </Button>
        </div>
      </div>
    </div>
  )
}
