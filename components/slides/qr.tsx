import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Upload } from "lucide-react"
import QRSlidePreview from "../slide-previews/qr-slide-preview"
import { useQRStore } from "@/stores/qr"
import { useEffect } from "react"


export default function QRSlide({ slideId, handleDelete }: { slideId: string, handleDelete: (id: string) => void }) {
  const text = useQRStore((state) => state.slides[slideId]?.text || '');
  const setText = useQRStore((state) => state.setText);

  useEffect (() => {
    // Initialize default text if not set
    if (!text) {
      setText(slideId, 'See this on your phone!');
    }
  }, [])
  return (
    <>
      <div className="flex flex-1">
        {/* Main Content */}
        <div className="flex-1 bg-white">
          <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[#4a5568] mb-4">
              <span>Home</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium">QR Code</span>
            </div>

            <p className="text-[#606061] mb-6">This template is configured to show a large QR code for riders.</p>

            {/* QR Code Configuration */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[#4a5568] font-medium mb-2">URL for QR Code</label>
                <div className="flex gap-3">
                  <Input
                    placeholder="http://www.nysdot.gov"
                    className="flex-1 bg-white border-[#cbd5e0]"
                    defaultValue="http://www.nysdot.gov"
                  />
                  <Button className="bg-[#0b5583] hover:bg-[#0b5583]/90 text-white font-medium px-6">Generate</Button>
                </div>
              </div>

              <div>
                <label className="block text-[#4a5568] font-medium mb-2">Text to display under QR Code</label>
                <Input
                  placeholder="Enter text here..."
                  className="bg-white border-[#cbd5e0]"
                  onChange={(e) => setText(slideId, e.target.value)}
                  value={text}
                />
              </div>
            </div>

            {/* QR Code Preview */}
            <QRSlidePreview slideId={slideId} />

            {/* Footer Buttons */}
            <div className="flex gap-3">
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium">Preview Screens</Button>
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium">Publish Screens</Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4">

          {/* Customization Options */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Color</label>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#192f51] rounded border"></div>
                <Input defaultValue="#192F51" readOnly className="flex-1 text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Image</label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#f4f4f4] rounded border flex items-center justify-center">
                  <div className="w-4 h-4 bg-[#cbd5e0] rounded"></div>
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
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Alignment of Text on Page</label>
              <Select>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Center" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">QR Code Size</label>
              <Input defaultValue="100%" readOnly className="text-xs" />
            </div>
          </div>

          <div className="mt-auto">
            <Button className="w-full bg-[#face00] hover:bg-[#face00]/90 text-black font-medium text-xs">
              Save Screen
            </Button>
            <Button className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2" onClick={() => {handleDelete(slideId)}}>
              Delete Screen
            </Button>
          </div>
        </div>
      </div>

    </>

  )
}