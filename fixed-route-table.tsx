import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Plus } from "lucide-react"

export default function Component() {
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
    <div className="min-h-screen bg-[#e5eaef] flex">
      {/* Left Sidebar - Full Height */}
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
            <div className="bg-[#f4f4f4] rounded border">
              <img
                src="/images/fixed-route-preview.png"
                alt="Fixed route preview"
                className="w-full h-16 object-cover rounded"
              />
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

              {/* Transit Schedule Display */}
              <div className="mb-6">
                <div className="bg-[#192f51] text-white rounded-lg overflow-hidden">
                  {/* Schedule Header */}
                  <div className="p-6">
                    <div className="text-lg mb-2">Stop #10506 arrival times</div>
                    <h2 className="text-3xl font-bold mb-2">WOLF RD & NEWBURY PLAZA</h2>
                    <p className="text-[#a0aec0]">Cross Wolf Road, then walk left toward Panera</p>
                  </div>

                  {/* Schedule Table */}
                  <div className="bg-white text-black">
                    {scheduleData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border-b border-[#e2e8f0] last:border-b-0"
                      >
                        <div className="flex-1">
                          <span className="font-medium">{item.destination}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div
                            className={`${item.routeColor} text-white px-3 py-1 rounded font-bold text-sm min-w-[50px] text-center`}
                          >
                            {item.route}
                          </div>
                          <div className="font-medium min-w-[80px] text-center">{item.time}</div>
                          <div className="text-[#606061] min-w-[80px] text-center">{item.duration}</div>
                          <Button variant="outline" size="sm" className="min-w-[90px] bg-transparent">
                            Scheduled
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-[#F4F4F4] p-3 flex items-center justify-between rounded-b-lg">
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
      </div>
    </div>
  )
}
