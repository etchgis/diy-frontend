import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Plus } from "lucide-react"
import TransitRoutesPreview from "../slide-previews/transit-routes-preview"

export default function TransitRoutesSlide() {
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
              <span className="font-medium">Transit Route Map Page Template</span>
            </div>

            <p className="text-[#606061] mb-6">Input the destinations that you would like for the map to show.</p>

            {/* Destination Search */}
            <div className="mb-6">
              <label className="block text-[#4a5568] font-medium mb-2">Destination</label>
              <div className="relative">
                <img
                  src="/images/search-icon.png"
                  alt="Search"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                />
                <Input
                  placeholder="Albany Airport"
                  className="pl-10 bg-white border-[#cbd5e0]"
                  defaultValue="Albany Airport"
                />
              </div>
            </div>

            {/* Map Preview */}
            <TransitRoutesPreview />

            {/* Footer Buttons */}
            <div className="flex gap-3">
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium">Preview Screens</Button>
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium">Publish Screens</Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4">
          <div className="mb-4">
            <Select>
              <SelectTrigger className="w-full text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#cbd5e0] rounded"></div>
                  <SelectValue placeholder="Select a Template" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transit-route">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full border-2 border-[#4a5568]"></div>
                    Transit Route Map Page
                  </div>
                </SelectItem>
                <SelectItem value="transit-destination">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                    Transit Destination Table Page
                  </div>
                </SelectItem>
                <SelectItem value="fixed-route">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                    Fixed Route Table Page
                  </div>
                </SelectItem>
                <SelectItem value="left-content">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                    Left Content/Right Image Page
                  </div>
                </SelectItem>
                <SelectItem value="left-image">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                    Left Image/Right Content Page
                  </div>
                </SelectItem>
                <SelectItem value="full-image">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                    Full Image Content Page
                  </div>
                </SelectItem>
                <SelectItem value="qr-code">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                    QR Code Page
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <h3 className="text-[#4a5568] font-medium mb-3 pb-2 border-b border-[#e2e8f0] text-xs">Destinations</h3>
            <div className="text-xs text-[#718096]">No destinations added yet</div>
          </div>

          <div className="mt-auto">
            <Button className="w-full bg-[#face00] hover:bg-[#face00]/90 text-black font-medium text-xs">
              Save Screen
            </Button>
          </div>
        </div>
      </div>


    </>
  )

}