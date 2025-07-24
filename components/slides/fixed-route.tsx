import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Plus } from "lucide-react"
import FixedRoutePreview from "../slide-previews/fixed-route-preview"

export default function FixedRouteSlide() {
  const scheduleData = [
    {
      destination: "Airport directly to Rte 7 & Donald",
      route: "117",
      routeColor: "bg-green-600",
      time: "9:49 PM",
      duration: "27 min",
    },
    {
      destination: "Colonie Center to Downtown Albany",
      route: "1",
      routeColor: "bg-blue-800",
      time: "9:57 PM",
      duration: "35 min",
    },
    {
      destination: "Colonie Center to Downtown Albany",
      route: "1",
      routeColor: "bg-blue-800",
      time: "10:17 PM",
      duration: "55 min",
    },
    {
      destination: "Airport directly to Rte 7 & Donald",
      route: "117",
      routeColor: "bg-green-600",
      time: "10:19 PM",
      duration: "57 min",
    },
    {
      destination: "Airport directly to Rte 7 & Donald",
      route: "117",
      routeColor: "bg-green-600",
      time: "10:49 PM",
      duration: "1 hr 27 min",
    },
    {
      destination: "Colonie Center to Downtown Albany",
      route: "1",
      routeColor: "bg-blue-800",
      time: "10:57 PM",
      duration: "1 hr 35 min",
    },
    {
      destination: "Airport directly to Rte 7 & Donald",
      route: "117",
      routeColor: "bg-green-600",
      time: "11:19 PM",
      duration: "1 hr 57 min",
    },
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
              <span className="font-medium">Fixed Route Table Page Template</span>
            </div>

            <p className="text-[#606061] mb-6">
              Input the fixed route stop that you would like for the table to show
            </p>

            {/* Fixed Route Stop Input */}
            <div className="mb-6">
              <label className="block text-[#4a5568] font-medium mb-2">Fixed Route Stop</label>
              <div className="flex gap-3">
                <Input
                  placeholder="Wolf Rd and Newbury"
                  className="flex-1 bg-white border-[#cbd5e0]"
                  defaultValue="Wolf Rd and Newbury"
                />
                <Button variant="outline" size="icon" className="border-[#cbd5e0] bg-transparent">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <FixedRoutePreview />

            
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
                    <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
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
                    <div className="w-2 h-2 rounded-full border-2 border-[#4a5568]"></div>
                    Fixed Route Table Page
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Customization */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Color</label>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#192f51] rounded border"></div>
                <Input defaultValue="#0192F51" readOnly className="flex-1 text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Slide Title Color</label>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white rounded border"></div>
                <Input defaultValue="#FFFFFF" readOnly className="flex-1 text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table Color</label>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white rounded border"></div>
                <Input defaultValue="#FFFFFF" readOnly className="flex-1 text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table Text Color</label>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-black rounded border"></div>
                <Input defaultValue="#000000" readOnly className="flex-1 text-xs" />
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
