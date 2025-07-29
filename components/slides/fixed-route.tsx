import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Plus } from "lucide-react"
import FixedRoutePreview from "../slide-previews/fixed-route-preview"
import { useState } from "react"
import { useFixedRouteStore } from "../../stores/fixedRoute";


export default function FixedRouteSlide({ slideId, handleDelete, handlePreview }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void }) {

  const stopName = useFixedRouteStore((state) => state.slides[slideId]?.stopName || '');
  const setStopName = useFixedRouteStore((state) => state.setStopName);

  const description = useFixedRouteStore((state) => state.slides[slideId]?.description || '');
  const setDescription = useFixedRouteStore((state) => state.setDescription);

  const backgroundColor = useFixedRouteStore((state) => state.slides[slideId]?.backgroundColor || '');
  const setBackgroundColor = useFixedRouteStore((state) => state.setBackgroundColor);

  const titleColor = useFixedRouteStore((state) => state.slides[slideId]?.titleColor || '');
  const setTitleColor = useFixedRouteStore((state) => state.setTitleColor);

  const tableColor = useFixedRouteStore((state) => state.slides[slideId]?.tableColor || '');
  const setTableColor = useFixedRouteStore((state) => state.setTableColor);

  const tableTextColor = useFixedRouteStore((state) => state.slides[slideId]?.tableTextColor || '');
  const setTableTextColor = useFixedRouteStore((state) => state.setTableTextColor);

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


            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[#4a5568] font-medium mb-2">Fixed Route Stop</label>
                <div className="flex gap-3">
                  <Input
                    className="flex-1 bg-white border-[#cbd5e0]"
                    value={stopName}
                    onChange={(e) => setStopName(slideId, e.target.value)}
                  />
                  <Button variant="outline" size="icon" className="border-[#cbd5e0] bg-transparent">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-[#4a5568] font-medium mb-2">Sub Description</label>
                <Input
                  placeholder="Enter text here..."
                  className="bg-white border-[#cbd5e0]"
                  value={description}
                  onChange={(e) => setDescription?.(slideId, e.target.value)}
                />
              </div>
            </div>



            <FixedRoutePreview slideId={slideId} />

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
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Slide Title Color</label>
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
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={tableColor}
                    onChange={(e) => setTableColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={tableColor} className="flex-1 text-xs" onChange={(e) => setTableColor(slideId, e.target.value)} />
              </div>
            </div>


            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table Text Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={tableTextColor}
                    onChange={(e) => setTableTextColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={tableTextColor} className="flex-1 text-xs" onChange={(e) => setTableTextColor(slideId, e.target.value)} />
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
      </div>



    </>
  )
}
