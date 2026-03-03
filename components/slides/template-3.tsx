import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Upload } from "lucide-react"
import Template2Preview from "../slide-previews/template-2-preview"
import Template3Preview from "../slide-previews/template-3-preview"
import { useEffect, useRef, useState } from "react"
import { useTemplate3Store } from "@/stores/template3"
import { deleteImage } from "@/services/deleteImage"
import { uploadImage } from "@/services/uploadImage"
import { useGeneralStore } from "@/stores/general"


export default function Template3Slide({ slideId, handleDelete, handlePreview, handlePublish }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void, handlePublish: () => void }) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isBgUploading, setIsBgUploading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const renderCount = useRef(0);

  const title = useTemplate3Store((state) => state.slides[slideId]?.title || '');
  const image = useTemplate3Store((state) => state.slides[slideId]?.image || null);

  const bgImage = useTemplate3Store((state) => state.slides[slideId]?.bgImage || '');
  const setBgImage = useTemplate3Store((state) => state.setBgImage);

  const backgroundColor = useTemplate3Store((state) => state.slides[slideId]?.backgroundColor || '#305fff');
  const setBackgroundColor = useTemplate3Store((state) => state.setBackgroundColor);

  const textColor = useTemplate3Store((state) => state.slides[slideId]?.textColor || '#ffffff');
  const setTextColor = useTemplate3Store((state) => state.setTextColor);

  const titleColor = useTemplate3Store((state) => state.slides[slideId]?.titleColor || '#ffffff');
  const setTitleColor = useTemplate3Store((state) => state.setTitleColor);

  const logoImage = useTemplate3Store((state) => state.slides[slideId]?.logoImage || '');
  const setLogoImage = useTemplate3Store((state) => state.setLogoImage);

  const imageWidth = useTemplate3Store((state) => state.slides[slideId]?.imageWidth || 600);
  const setImageWidth = useTemplate3Store((state) => state.setImageWidth);

  const imageHeight = useTemplate3Store((state) => state.slides[slideId]?.imageHeight || 400);
  const setImageHeight = useTemplate3Store((state) => state.setImageHeight);

  const imageObjectFit = useTemplate3Store((state) => state.slides[slideId]?.imageObjectFit || 'contain');
  const setImageObjectFit = useTemplate3Store((state) => state.setImageObjectFit);

  const titleTextSize = useTemplate3Store((state) => state.slides[slideId]?.titleTextSize || 5);
  const setTitleTextSize = useTemplate3Store((state) => state.setTitleTextSize);

  const showTitle = useTemplate3Store((state) => state.slides[slideId]?.showTitle !== false);
  const setShowTitle = useTemplate3Store((state) => state.setShowTitle);

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

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 600);
  }, [title, image, backgroundColor, textColor, titleColor, bgImage, logoImage, imageWidth, imageHeight, imageObjectFit, titleTextSize, showTitle]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'bg' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === 'bg' && fileInputRef.current) {
      fileInputRef.current.value = '';
    } else if (target === 'logo' && logoInputRef.current) {
      logoInputRef.current.value = '';
    }

    const currentImage = target === 'bg' ? bgImage : logoImage;
    const setImageFn = target === 'bg' ? setBgImage : setLogoImage;
    const setLoadingFn = target === 'bg' ? setIsBgUploading : setIsLogoUploading;

    setLoadingFn(true);
    uploadImage(shortcode, file).then((data) => {
      if (currentImage) {
        deleteImage(currentImage).then(() => {

        }).catch((err) => {
          console.error('Failed to delete previous image:', err);
        });
      }
      setImageFn(slideId, data.url);
    }
    ).catch((err) => {
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
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }).catch((err) => {
        console.error('Failed to delete image:', err);
      });
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
            <span className="font-medium">Image and Title Page</span>
          </div>

          <p className="text-[#606061] mb-6">
            This template supports a title and a large image that will fit the size of the screen.
          </p>

          {/* Image Display Area */}
          <div className="h-[550px] rounded-lg border border-[#e2e8f0] overflow-hidden">
            <Template3Preview slideId={slideId} />
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
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Color</label>
            <div className="flex items-center gap-2">
              <div className="colorContainer">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(slideId, e.target.value)}
                  className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
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
                  className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                />
              </div>
              <Input value={titleColor} className="flex-1 text-xs" onChange={(e) => setTitleColor(slideId, e.target.value)} />
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
                {/* Hidden input */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => handleImageUpload(e, 'bg')}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent px-2 py-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change
                </Button>
                {bgImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent px-2 py-1"
                    onClick={() => handleRemoveImage('bg')}
                  >
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
                <input
                  type="file"
                  accept="image/*"
                  ref={logoInputRef}
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent px-2 py-1"
                  onClick={() => logoInputRef.current?.click()}
                >
                  Change
                </Button>
                {logoImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent px-2 py-1"
                    onClick={() => handleRemoveImage('logo')}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Image Width (px)</label>
            <Input
              type="number"
              min="10"
              max="2000"
              step="1"
              value={imageWidth}
              onChange={(e) => setImageWidth(slideId, Math.round(Number(e.target.value)))}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Image Height (px)</label>
            <Input
              type="number"
              min="10"
              max="2000"
              step="1"
              value={imageHeight}
              onChange={(e) => setImageHeight(slideId, Math.round(Number(e.target.value)))}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Image Fit</label>
            <Select value={imageObjectFit} onValueChange={(value) => setImageObjectFit(slideId, value as any)}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="fill">Fill</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="scale-down">Scale Down</SelectItem>
              </SelectContent>
            </Select>
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
        </div>

        <div className="mt-auto">
          <Button className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2" onClick={() => { handleDelete(slideId) }}>
            Delete Screen
          </Button>
        </div>
      </div>
    </div>


  )
}
