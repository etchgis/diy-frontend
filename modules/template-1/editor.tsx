import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronRight } from "lucide-react"
import Template1Preview from "./preview"
import { useTemplate1Store } from "./store"
import { useGeneralStore } from "@/stores/general"
import { useLocalSaveStatus } from "@/hooks/useLocalSaveStatus"
import { useImageUploadField } from "@/hooks/useImageUploadField"

// left content and right image page template
export default function Template1Slide({ slideId, handleDelete, handlePreview, handlePublish }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void, handlePublish: () => void }) {

  const title = useTemplate1Store((state) => state.slides[slideId]?.title || '');
  const text = useTemplate1Store((state) => state.slides[slideId]?.text || '');
  const image = useTemplate1Store((state) => state.slides[slideId]?.image || null);
  const bgImage = useTemplate1Store((state) => state.slides[slideId]?.bgImage || '');
  const backgroundColor = useTemplate1Store((state) => state.slides[slideId]?.backgroundColor || '#305fff');
  const textColor = useTemplate1Store((state) => state.slides[slideId]?.textColor || '#ffffff');
  const titleColor = useTemplate1Store((state) => state.slides[slideId]?.titleColor || '#ffffff');
  const logoImage = useTemplate1Store((state) => state.slides[slideId]?.logoImage || '');

  const setBgImage = useTemplate1Store((state) => state.setBgImage);
  const setBackgroundColor = useTemplate1Store((state) => state.setBackgroundColor);
  const setTextColor = useTemplate1Store((state) => state.setTextColor);
  const setTitleColor = useTemplate1Store((state) => state.setTitleColor);
  const setLogoImage = useTemplate1Store((state) => state.setLogoImage);

  const leftContentSize = useTemplate1Store((state) => state.slides[slideId]?.leftContentSize || '');
  const setLeftContentSize = useTemplate1Store((state) => state.setLeftContentSize);
  const rightContentSize = useTemplate1Store((state) => state.slides[slideId]?.rightContentSize || '');
  const setRightContentSize = useTemplate1Store((state) => state.setRightContentSize);

  const imageWidth = useTemplate1Store((state) => state.slides[slideId]?.imageWidth || 400);
  const setImageWidth = useTemplate1Store((state) => state.setImageWidth);
  const imageHeight = useTemplate1Store((state) => state.slides[slideId]?.imageHeight || 280);
  const setImageHeight = useTemplate1Store((state) => state.setImageHeight);
  const imageObjectFit = useTemplate1Store((state) => state.slides[slideId]?.imageObjectFit || 'contain');
  const setImageObjectFit = useTemplate1Store((state) => state.setImageObjectFit);

  const titleTextSize = useTemplate1Store((state) => state.slides[slideId]?.titleTextSize || 5);
  const setTitleTextSize = useTemplate1Store((state) => state.setTitleTextSize);
  const contentTextSize = useTemplate1Store((state) => state.slides[slideId]?.contentTextSize || 5);
  const setContentTextSize = useTemplate1Store((state) => state.setContentTextSize);

  const showTitle = useTemplate1Store((state) => state.slides[slideId]?.showTitle !== false);
  const setShowTitle = useTemplate1Store((state) => state.setShowTitle);

  const shortcode = useGeneralStore((state) => state.shortcode || '');
  const saveStatus = useLocalSaveStatus(useTemplate1Store, slideId);
  const bg = useImageUploadField(shortcode, bgImage, (url) => setBgImage(slideId, url));
  const logo = useImageUploadField(shortcode, logoImage, (url) => setLogoImage(slideId, url));

  return (

    < div className="flex flex-1 overflow-hidden" >
      {/* Main Content */}
      < div className="flex-1 bg-white overflow-y-auto" >
        <div className="p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[#4a5568] mb-4">
            <span>Home</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium">Left Content & Right Image Only Page</span>
          </div>

          <p className="text-[#606061] mb-6">
            This template is configured for the content to show up on the left of the slide. the boxes can be sized
            according to the percentage of width set.
          </p>

          {/* Content Display Area */}
          <div className="h-[550px] rounded-lg border border-[#e2e8f0] overflow-hidden">
            <Template1Preview slideId={slideId} />
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
      </div >

      {/* Right Sidebar */}
      < div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4 overflow-y-auto" >

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
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Text Color</label>
            <div className="flex items-center gap-2">
              <div className="colorContainer">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(slideId, e.target.value)}
                  className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                />
              </div>
              <Input value={textColor} className="flex-1 text-xs" onChange={(e) => setTextColor(slideId, e.target.value)} />
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

          {/* <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Image Background Color</label>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#f4f4f4] rounded border"></div>
              <Input defaultValue="No Color Selected" readOnly className="flex-1 text-xs text-[#a0aec0]" />
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Content Background Color</label>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#f4f4f4] rounded border"></div>
              <Input defaultValue="No Color Selected" readOnly className="flex-1 text-xs text-[#a0aec0]" />
            </div>
          </div> */}

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Image</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden">
                {bg.isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                ) : bgImage ? (
                  <img src={bgImage} alt="BG" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-4 h-4 bg-[#cbd5e0] rounded" />
                )}
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
                {logo.isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                ) : logoImage ? (
                  <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-4 h-4 bg-[#cbd5e0] rounded" />
                )}
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
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Left Content Box Size</label>
            <Input placeholder="60%" value={leftContentSize} className="text-xs" onChange={(e) => { setLeftContentSize(slideId, e.target.value) }} />
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Right Image Box Size</label>
            <Input placeholder="40%" value={rightContentSize} className="text-xs" onChange={(e) => { setRightContentSize(slideId, e.target.value) }} />
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
        </div>

        <div className="mt-auto">
          <Button className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2" onClick={() => { handleDelete(slideId) }}>
            Delete Screen
          </Button>

        </div>
      </div >
    </div >
  )
}

