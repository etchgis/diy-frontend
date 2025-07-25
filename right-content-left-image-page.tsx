import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Upload } from "lucide-react"

export default function Component() {
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
                <span className="font-medium">Right Content & Left Image Only Page</span>
              </div>

              <p className="text-[#606061] mb-6">
                This template is configured for the content to show up on the left of the slide. the boxes can be sized
                according to the percentage of width set.
              </p>

              {/* Content Display Area */}
              <div className="mb-6">
                <div
                  className="bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] text-white rounded-lg overflow-hidden relative"
                  style={{ height: "500px" }}
                >
                  {/* Title Area */}
                  <div className="p-6 border-b border-white/20">
                    <div className="w-full border-2 border-[#11d1f7] rounded px-4 py-2">
                      <div className="text-4xl font-light">Type Title Here</div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 p-6 flex gap-4">
                    {/* Left Image Box (60%) */}
                    <div className="w-[60%]">
                      <div className="h-full border-2 border-[#11d1f7] rounded-lg bg-[#11d1f7]/10 flex flex-col items-center justify-center p-6">
                        <div className="text-center">
                          <div className="text-lg mb-4">Drag and Drop Image Here</div>
                          <div className="text-sm text-white/80 mb-6">accepted files: .png, .jpg, .gif</div>

                          <img
                            src="/images/placeholder-image.png"
                            alt="Placeholder image"
                            className="max-w-48 max-h-32 object-contain mx-auto"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Content Box (40%) */}
                    <div className="w-[40%]">
                      <div className="h-full border-2 border-[#11d1f7] rounded-lg bg-[#11d1f7]/10 p-6 flex items-start">
                        <div className="text-2xl font-light">Type text here</div>
                      </div>
                    </div>
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
                      <div className="w-2 h-2 rounded-full border-2 border-[#4a5568]"></div>
                      Right Content/Left Image Page
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
