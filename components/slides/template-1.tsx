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
  const renderCount = useRef(0);

  const title = useTemplate1Store((state) => state.slides[slideId]?.title || '');
  const text = useTemplate1Store((state) => state.slides[slideId]?.text || '');
  const image = useTemplate1Store((state) => state.slides[slideId]?.image || null);

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
              <div className="w-4 h-4 bg-black rounded border"></div>
              <Input defaultValue="#000000" readOnly className="flex-1 text-xs" />
            </div>
          </div>

          <div>
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
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Image</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded border flex items-center justify-center">
                <div className="w-4 h-4 bg-white/20 rounded"></div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1">
                  Change
                </Button>
                <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1">
                  Remove
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Left Content Box Size</label>
            <Input defaultValue="60%" readOnly className="text-xs" />
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Right Image Box Size</label>
            <Input defaultValue="40%" readOnly className="text-xs" />
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