import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronRight } from "lucide-react"
import ImageOnlyPreview from "../slide-previews/image-only-preview"
import { useEffect, useRef, useState } from "react"
import { useImageOnlyStore } from "@/stores/imageOnly"

export default function ImageOnlySlide({ slideId, handleDelete, handlePreview, handlePublish }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void, handlePublish: () => void }) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const renderCount = useRef(0);

  const image = useImageOnlyStore((state) => state.slides[slideId]?.image || null);

  const imageObjectFit = useImageOnlyStore((state) => state.slides[slideId]?.imageObjectFit || 'cover');
  const setImageObjectFit = useImageOnlyStore((state) => state.setImageObjectFit);

  const backgroundColor = useImageOnlyStore((state) => state.slides[slideId]?.backgroundColor || '#000000');
  const setBackgroundColor = useImageOnlyStore((state) => state.setBackgroundColor);

  const fullScreen = useImageOnlyStore((state) => state.slides[slideId]?.fullScreen ?? true);
  const setFullScreen = useImageOnlyStore((state) => state.setFullScreen);

  const imageWidth = useImageOnlyStore((state) => state.slides[slideId]?.imageWidth || 600);
  const setImageWidth = useImageOnlyStore((state) => state.setImageWidth);

  const imageHeight = useImageOnlyStore((state) => state.slides[slideId]?.imageHeight || 400);
  const setImageHeight = useImageOnlyStore((state) => state.setImageHeight);

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

    const timeout = setTimeout(() => {
      setSaveStatus('saved');
    }, 600);

    return () => clearTimeout(timeout);
  }, [image, imageObjectFit, backgroundColor, fullScreen, imageWidth, imageHeight]);

  return (
    <div className="flex flex-1">
      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[#4a5568] mb-4">
            <span>Home</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium">Image Only Page</span>
          </div>

          <p className="text-[#606061] mb-6">
            Drag and drop an image into the preview area. The image will cover the full screen on the published page.
          </p>

          {/* Image Display Area */}
          <div className="h-[550px] rounded-lg border border-[#e2e8f0] overflow-hidden">
            <ImageOnlyPreview slideId={slideId} />
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
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Image Sizing</label>
            <Select value={fullScreen ? "full" : "manual"} onValueChange={(value) => setFullScreen(slideId, value === "full")}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Screen</SelectItem>
                <SelectItem value="manual">Manual Size</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Image Fit</label>
            <Select value={imageObjectFit} onValueChange={(value) => setImageObjectFit(slideId, value as any)}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="fill">Fill</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="scale-down">Scale Down</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!fullScreen && (
            <>
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
            </>
          )}
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
