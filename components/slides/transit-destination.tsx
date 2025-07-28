import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Plus, X } from "lucide-react"
import TransitDestinationPreview from "../slide-previews/transit-destination-preview"
import { useTransitDestinationsStore } from "@/stores/transitDestinations"
import { useEffect } from "react"
import { useGeneralStore } from "@/stores/general"

export default function TransitDestinationSlide({ slideId, handleDelete, handlePreview }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void  }) {

  const slides = useGeneralStore((state) => state.slides);
  const setSlides = useGeneralStore((state) => state.setSlides);

  const backgroundColor = useTransitDestinationsStore((state) => state.slides[slideId]?.backgroundColor || '');
  const setBackgroundColor = useTransitDestinationsStore((state) => state.setBackgroundColor);

  const rowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.rowColor || '');
  const setRowColor = useTransitDestinationsStore((state) => state.setRowColor);

  const alternateRowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.alternateRowColor || '');
  const setAlternateRowColor = useTransitDestinationsStore((state) => state.setAlternateRowColor);

  useEffect(() => {
    // Initialize default colors if not set
    if (!backgroundColor) {
      setBackgroundColor(slideId, '#192f51');
    }
    if (!rowColor) {
      setRowColor(slideId, '#192f51');
    }
    if (!alternateRowColor) {
      setAlternateRowColor(slideId, '#78B1DD');
    }

  }, [])


  const destinations = [
    {
      name: "Albany International Airport",
      route: "1 hr 9 min",
      departure: "8:31 PM",
      arrival: "9:40 PM",
      travel: "1 hr 9 min",
      dark: true,
    },
    {
      name: "Downtown Schenectady",
      route: "3 hr 48 min",
      departure: "8:31 PM",
      arrival: "12:19 AM",
      travel: "3 hr 48 min",
      dark: false,
    },
    {
      name: "Albany Medical Center",
      route: "2 hr 2 min",
      departure: "8:31 PM",
      arrival: "10:33 PM",
      travel: "2 hr 2 min",
      dark: true,
    },
    {
      name: "Downtown Saratoga Springs",
      route: "2 hr 53 min",
      departure: "8:31 PM",
      arrival: "11:24 PM",
      travel: "2 hr 53 min",
      dark: false,
    },
    {
      name: "Albany-Rensselaer Train Station",
      route: "2 hr 11 min",
      departure: "8:31 PM",
      arrival: "10:42 PM",
      travel: "2 hr 11 min",
      dark: true,
    },
    {
      name: "Downtown Troy",
      route: "1 hr 3 min",
      departure: "8:31 PM",
      arrival: "9:34 PM",
      travel: "1 hr 3 min",
      dark: false,
    },
  ]

  const destinationTags = [
    "Albany International Airport",
    "Downtown Schenectady",
    "Albany Medical Center",
    "Downtown Saratoga Springs",
    "Albany-Rensselaer Train Station",
  ]

  return (
    <>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Main Content */}
        <div className="flex-1 bg-white">
          <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[#4a5568] mb-4">
              <span>Home</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium">Transit Destination Table Page Template</span>
            </div>

            <p className="text-[#606061] mb-6">Input the destinations that you would like for the table to show</p>

            {/* Destination Input */}
            <div className="mb-6">
              <label className="block text-[#4a5568] font-medium mb-2">Destination</label>
              <div className="flex gap-3">
                <Input
                  placeholder="Downtown Troy"
                  className="flex-1 bg-white border-[#cbd5e0]"
                  defaultValue="Downtown Troy"
                />
                <Button variant="outline" size="icon" className="border-[#cbd5e0] bg-transparent">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <TransitDestinationPreview slideId={slideId} />

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
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table Header Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={backgroundColor} className="flex-1 text-xs" onChange={(e) => { setBackgroundColor(slideId, e.target.value) }} />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Row Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={rowColor}
                    onChange={(e) => setRowColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={rowColor} className="flex-1 text-xs" onChange={(e) => { setRowColor(slideId, e.target.value) }} />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Alternating Row Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={alternateRowColor}
                    onChange={(e) => setAlternateRowColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={alternateRowColor} className="flex-1 text-xs" onChange={(e) => { setAlternateRowColor(slideId, e.target.value) }} />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table Header Text Color</label>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-black rounded border"></div>
                <Input defaultValue="#000000" readOnly className="flex-1 text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table Text Color</label>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white rounded border"></div>
                <Input defaultValue="#FFFFFF" readOnly className="flex-1 text-xs" />
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
          </div>

          <div className="mb-4">
            <h3 className="text-[#4a5568] font-medium mb-3 pb-2 border-b border-[#e2e8f0] text-xs">Destinations</h3>
            <div className="space-y-2">
              {destinationTags.map((dest, index) => (
                <div key={index} className="flex items-center justify-between bg-[#f4f4f4] p-2 rounded">
                  <span className="text-xs text-[#4a5568] truncate pr-2">{dest}</span>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 flex-shrink-0">
                    <X className="w-2 h-2" />
                  </Button>
                </div>
              ))}
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
  );
}