'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Upload } from "lucide-react"

export default function EditorPage() {
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
            <div className="bg-[#f4f4f4] rounded border">
              <img
                src="/images/image-only-preview.png"
                alt="Image only preview"
                className="w-full h-16 object-cover rounded"
              />
            </div>
            <div className="bg-[#f4f4f4] rounded border">
              <img
                src="/images/left-content-right-image-preview.png"
                alt="Left content right image preview"
                className="w-full h-16 object-cover rounded"
              />
            </div>
            <div className="bg-[#f4f4f4] rounded border">
              <img
                src="/images/right-content-left-image-preview.png"
                alt="Right content left image preview"
                className="w-full h-16 object-cover rounded"
              />
            </div>
            <div className="bg-[#f4f4f4] rounded border">
              <img
                src="/images/qr-code-preview.png"
                alt="QR code preview"
                className="w-full h-16 object-cover rounded"
              />
            </div>
          </div>
          <Button variant="outline" className="w-full text-[#4a5568] border-[#cbd5e0] bg-transparent">
            <Upload className="w-4 h-4 mr-2" />
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
                    placeholder="See this on your phone!"
                    className="bg-white border-[#cbd5e0]"
                    defaultValue="See this on your phone!"
                  />
                </div>
              </div>

              {/* QR Code Display Area */}
              <div className="mb-6">
                <div
                  className="bg-[#192f51] text-white rounded-lg overflow-hidden relative flex flex-col items-center justify-center"
                  style={{ height: "500px" }}
                >
                  {/* QR Code */}
                  <div className="bg-white p-6 rounded-lg mb-6">
                    <div className="w-48 h-48 bg-white flex items-center justify-center">
                      <img src="/placeholder.svg?height=192&width=192" alt="QR Code" className="w-full h-full" />
                    </div>
                  </div>

                  {/* Text below QR Code */}
                  <div className="text-2xl font-medium">See this on your phone!</div>
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
                      <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                      Fixed Route Table Page
                    </div>
                  </SelectItem>
                  <SelectItem value="image-only">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                      Image Only Page
                    </div>
                  </SelectItem>
                  <SelectItem value="left-content-right-image">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                      Left Content/Right Image Page
                    </div>
                  </SelectItem>
                  <SelectItem value="right-content-left-image">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                      Right Content/Left Image Page
                    </div>
                  </SelectItem>
                  <SelectItem value="qr-code">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full border-2 border-[#4a5568]"></div>
                      QR Code Page
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
