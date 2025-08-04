import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Upload } from "lucide-react"
import Template1Preview from "../slide-previews/template-1-preview"
import { useEffect, useRef, useState } from "react"
import { useTemplate1Store } from "@/stores/template1"

// left content and right image page template
export default function Template1Slide({ slideId, handleDelete, handlePreview, handlePublish }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void, handlePublish: () => void }) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderCount = useRef(0);

  const title = useTemplate1Store((state) => state.slides[slideId]?.title || '');
  const text = useTemplate1Store((state) => state.slides[slideId]?.text || '');
  const image = useTemplate1Store((state) => state.slides[slideId]?.image || null);
  const bgImage = useTemplate1Store((state) => state.slides[slideId]?.bgImage || '');
  const backgroundColor = useTemplate1Store((state) => state.slides[slideId]?.backgroundColor || '#305fff');

  const setBgImage = useTemplate1Store((state) => state.setBgImage);
  const setBackgroundColor = useTemplate1Store((state) => state.setBackgroundColor);

  const leftContentSize = useTemplate1Store((state) => state.slides[slideId]?.leftContentSize || '60%');
  const setLeftContentSize = useTemplate1Store((state) => state.setLeftContentSize);
  const rightContentSize = useTemplate1Store((state) => state.slides[slideId]?.rightContentSize || '40%');
  const setRightContentSize = useTemplate1Store((state) => state.setRightContentSize);

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
  }, [title, text, image]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBgImage(slideId, reader.result as string);
      e.target.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (

    < div className="flex flex-1" >
      {/* Main Content */}
      < div className="flex-1 bg-white" >
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
          <div className="h-[550px]">
            <Template1Preview slideId={slideId} />
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
      </div >

      {/* Right Sidebar */}
      < div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4" >

        {/* Color Customization */}
        <div className="space-y-3 mb-4">
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
                {bgImage ? (
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
                  onChange={handleImageUpload}
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
                    onClick={() => setBgImage(slideId, '')}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Left Content Box Size</label>
            <Input  placeholder="60%" value={leftContentSize}  className="text-xs" onChange={(e) => {setLeftContentSize(slideId, e.target.value)}}/>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Right Image Box Size</label>
            <Input  placeholder="40%" value={rightContentSize}  className="text-xs" onChange={(e) => {setRightContentSize(slideId, e.target.value)}}/>
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