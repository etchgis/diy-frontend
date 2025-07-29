import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Upload } from "lucide-react"
import Template2Preview from "../slide-previews/template-2-preview"


export default function Template2Slide({ slideId, handleDelete, handlePreview }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void }) {
  return (

    <div className="flex flex-1">
      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[#4a5568] mb-4">
            <span>Home</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium">Right Content & Left Image Only Page</span>
          </div>

          <p className="text-[#606061] mb-6">
            This template is configured for the content to show up on the left of the slide. the boxes can be sized
            according to the percentage of width set.
          </p>

          {/* Content Display Area */}
          <Template2Preview slideId={slideId} />



          {/* Footer Buttons */}
          <div className="flex gap-3">
            <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePreview()}>Preview Screens</Button>
            <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium">Publish Screens</Button>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4">
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
              <div className="w-4 h-4 bg-[#FFC62A] rounded border"></div>
              <Input defaultValue="#FFC62A" readOnly className="flex-1 text-xs" />
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
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Left Image Box Size</label>
            <Input defaultValue="60%" readOnly className="text-xs" />
          </div>

          <div>
            <label className="block text-[#4a5568] font-medium mb-1 text-xs">Right Content Box Size</label>
            <Input defaultValue="40%" readOnly className="text-xs" />
          </div>
        </div>

        <div className="mt-auto">
          <Button className="w-full bg-[#face00] hover:bg-[#face00]/90 text-black font-medium text-xs">
            Save Screen
          </Button>
          <Button className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2" onClick={() => { handleDelete(slideId) }}>
            Delete Screen
          </Button>
        </div>
      </div>

    </div>


  )
}
