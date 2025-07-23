import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Plus, X } from "lucide-react"

export default function Component() {
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
    <div className="min-h-screen bg-[#e5eaef] flex">
      Left Sidebar - Full Height
      <div className="w-[196px] bg-white border-r border-[#e2e8f0] flex flex-col">
        <div className="p-4 border-b border-[#e2e8f0]">
          <img
            src="/images/nysdot-logo.png"
            alt="New York State Department of Transportation"
            className="w-full mb-4"
          />
        </div>

        <div className="p-4">
          <h3 className="text-[#4a5568] font-medium mb-3 text-sm">Screen Order Preview</h3>
          <div className="space-y-2 mb-4">
            <div className="bg-[#f4f4f4] rounded border">
              <img src="/images/map-preview.png" alt="Map preview" className="w-full h-16 object-cover rounded" />
            </div>
            <div className="bg-[#f4f4f4] rounded border">
              <img src="/images/table-preview.png" alt="Table preview" className="w-full h-16 object-cover rounded" />
            </div>
          </div>
          <Button variant="outline" className="w-full text-[#4a5568] border-[#cbd5e0] bg-transparent">
            <Plus className="w-4 h-4 mr-2" />
            Add a Slide
          </Button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-[#6e9ab5] px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <img
                src="/images/edit-icon.png"
                alt="Edit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              />
              <Input
                placeholder="Insert a published Mobility Screen URL to edit an existing mobility screen"
                className="pl-10 bg-white text-[#1a202c]"
              />
            </div>
            <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium px-6">Edit</Button>
            <Button variant="ghost" size="icon" className="text-[#2d3748]">
              <HelpCircle className="w-5 h-5" />
            </Button>
          </div>
        </header>

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

              {/* Transit Table */}
              <div className="mb-6">
                <div className="bg-[#192f51] text-white">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-4 p-4 font-medium">
                    <div>Destination</div>
                    <div>Route</div>
                    <div>Departure Time</div>
                    <div>Arrival Time</div>
                    <div>Travel Time</div>
                  </div>

                  {/* Table Rows */}
                  {destinations.map((dest, index) => (
                    <div
                      key={index}
                      className={`grid grid-cols-5 gap-4 p-4 ${dest.dark ? "bg-[#192f51]" : "bg-[#6e9ab5]"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{dest.name}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-2xl">🚶</div>
                        <div className="text-xs">{dest.route}</div>
                      </div>
                      <div>{dest.departure}</div>
                      <div>{dest.arrival}</div>
                      <div>{dest.travel}</div>
                    </div>
                  ))}
                </div>

                {/* Table Footer */}
                <div className="bg-[#F4F4F4] p-3 flex items-center justify-between">
                  <img
                    src="/images/statewide-mobility-services.png"
                    alt="Statewide Mobility Services"
                    className="h-[25px] w-[246px]"
                  />
                  <img src="/images/nysdot-footer-logo.png" alt="NYSDOT" className="h-8" />
                </div>
              </div>

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
                      <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                      Transit Route Map Page
                    </div>
                  </SelectItem>
                  <SelectItem value="transit-destination">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full border-2 border-[#4a5568]"></div>
                      Transit Destination Table Page
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
                  <Input defaultValue="#192F51" readOnly className="flex-1 text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table Header Color</label>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white rounded border"></div>
                  <Input defaultValue="#FFFFFF" readOnly className="flex-1 text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-[#4a5568] font-medium mb-1 text-xs">Row Color</label>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#192f51] rounded border"></div>
                  <Input defaultValue="#192F51" readOnly className="flex-1 text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-[#4a5568] font-medium mb-1 text-xs">Alternating Row Color</label>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#78b1dd] rounded border"></div>
                  <Input defaultValue="#78B1DD" readOnly className="flex-1 text-xs" />
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
