import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Plus } from "lucide-react"
import TransitRoutesPreview from "../slide-previews/transit-routes-preview"
import { useTransitRouteStore } from "@/stores/transitRoutes"
import { useGeneralStore } from "@/stores/general"
import { useEffect, useState } from "react"

export default function TransitRoutesSlide({ slideId, handleDelete, handlePreview }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const destination = useTransitRouteStore((state) => state.slides[slideId]?.destination || '');
  const setDestination = useTransitRouteStore((state) => state.setDestination);

  const setAddress = useGeneralStore((state) => state.setAddress);
  const address = useGeneralStore((state) => state.address);


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
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Map Preview */}
            <div className="h-[550px]">
              <TransitRoutesPreview />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 mt-4">
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePreview()}>Preview Screens</Button>
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium">Publish Screens</Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4">
          <div className="mb-4">
            <h3 className="text-[#4a5568] font-medium mb-3 pb-2 border-b border-[#e2e8f0] text-xs">Destinations</h3>
            <div className="text-xs text-[#718096]">No destinations added yet</div>
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


    </>
  )

}