import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Plus } from "lucide-react"
import FixedRoutePreview from "../slide-previews/fixed-route-preview"
import { useEffect, useRef, useState } from "react"
import { useFixedRouteStore } from "../../stores/fixedRoute";
import { set } from "react-hook-form"
import { deleteImage } from "@/services/deleteImage"
import { uploadImage } from "@/services/uploadImage"
import { useGeneralStore } from "@/stores/general"
import { fetchAllStops } from "@/services/data-gathering/fetchAllStops"
import { fetchStopData } from "@/services/data-gathering/fetchStopData"


export default function FixedRouteSlide({ slideId, handleDelete, handlePreview, handlePublish }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void, handlePublish: () => void }) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const renderCount = useRef(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [allStops, setAllStops] = useState<any[]>([]);
  const [filteredStops, setFilteredStops] = useState<any[]>([]);





  const stopName = useFixedRouteStore((state) => state.slides[slideId]?.stopName || '');
  const setStopName = useFixedRouteStore((state) => state.setStopName);

  const selectedStop = useFixedRouteStore((state) => state.slides[slideId]?.selectedStop || undefined);
  const setSelectedStop = useFixedRouteStore((state) => state.setSelectedStop);

  const description = useFixedRouteStore((state) => state.slides[slideId]?.description || '');
  const setDescription = useFixedRouteStore((state) => state.setDescription);

  const backgroundColor = useFixedRouteStore((state) => state.slides[slideId]?.backgroundColor || '#192F51');
  const setBackgroundColor = useFixedRouteStore((state) => state.setBackgroundColor);

  const titleColor = useFixedRouteStore((state) => state.slides[slideId]?.titleColor || '#FFFFFF');
  const setTitleColor = useFixedRouteStore((state) => state.setTitleColor);

  const tableColor = useFixedRouteStore((state) => state.slides[slideId]?.tableColor || '#FFFFFF');
  const setTableColor = useFixedRouteStore((state) => state.setTableColor);

  const tableTextColor = useFixedRouteStore((state) => state.slides[slideId]?.tableTextColor || '#000000');
  const setTableTextColor = useFixedRouteStore((state) => state.setTableTextColor);

  const bgImage = useFixedRouteStore((state) => state.slides[slideId]?.bgImage || '');
  const setBgImage = useFixedRouteStore((state) => state.setBgImage);

  const setIsLoading = useFixedRouteStore((state) => state.setIsLoading);

  const shortcode = useGeneralStore((state) => state.shortcode || '');
  const coordinates = useGeneralStore((state) => state.coordinates || { lat: 0, lng: 0 });

  const setScheduleData = useFixedRouteStore((state) => state.setScheduleData);


  useEffect(() => {
    fetchAllStops(coordinates).then((stops) => {
      console.log(stops.filter((stop:any) => stop.stop_name.toLowerCase().includes('world trade')));
      setAllStops(stops);
    }
    ).catch((err) => {
      console.error('Failed to fetch stops:', err);
    }
    );
  }, []);

  const handleInputChange = (value: string) => {
    setStopName(slideId, value);

    // Filter stops based on the input value
    const filtered = allStops.filter((stop) =>
      stop.stop_name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredStops(filtered);
  };

  const handleSelectStop = (stop: any) => {
    setStopName(slideId, stop.stop_name);
    setFilteredStops([]);
    setSelectedStop(slideId, stop);
  };

  const handleAddStop = () => {
    if (selectedStop) {

      // Perform any additional logic with the selected stop
    }
  };

  async function fetchData(stopId: string) {
    try {
      setIsLoading(slideId, true);
      console.log(selectedStop);
      const data = await fetchStopData(stopId, selectedStop.services[0].service_guid, selectedStop.services[0].organization_guid);
      const arr: any = [];
      data?.trains.forEach((item: any) => {
        arr.push({
          destination: item.destination,
          route: item.details.id,
          routeColor: item.details.color,
          tableTextColor: item.details.textColor,
          time: item.arrivalTime,
          duration: item.arrival,
          status: item.status,
        });
      });

      setScheduleData(slideId, arr);
      setIsLoading(slideId, false);

    } catch (error) {
      console.error('Error fetching stop data:', error);
    }
  }


  useEffect(() => {

    if (selectedStop && selectedStop.stop_id) {
      fetchData(selectedStop.stop_id);
    }
  }, [selectedStop]);

  useEffect(() => {
    renderCount.current += 1;
    const isDev = process.env.NODE_ENV === 'development';
    const shouldSkip =
      (isDev && renderCount.current <= 2) || (!isDev && renderCount.current === 1);

    if (shouldSkip) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 600);
  }, [stopName, description, backgroundColor, titleColor, tableColor, tableTextColor]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    uploadImage(shortcode, file).then((data) => {
      if (bgImage) {
        deleteImage(bgImage).then(() => {

        }).catch((err) => {
          console.error('Failed to delete previous image:', err);
        });
      }
      setBgImage(slideId, data.url);
    }
    ).catch((err) => {
      console.error('Image upload failed:', err);
    });

  };

  const handleRemoveImage = () => {
    if (bgImage) {
      deleteImage(bgImage).then(() => {

        setBgImage(slideId, '');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }).catch((err) => {
        console.error('Failed to delete image:', err);
      });
    }
  };

  const scheduleData = [
    {
      destination: "Airport directly to Rte 7 & Donald",
      route: "117",
      routeColor: "bg-green-600",
      time: "9:49 PM",
      duration: "27 min",
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
                <div className="relative">
                  <Input
                    className="flex-1 bg-white border-[#cbd5e0]"
                    value={stopName}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Enter text here... "
                  />
                  {filteredStops.length > 0 && (
                    <ul className="absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                      {filteredStops.map((stop, index) => (
                        <li
                          key={index}
                          onClick={() => handleSelectStop(stop)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black"
                        >
                          {stop.stop_name}
                        </li>
                      ))}
                    </ul>
                  )}
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


            <div className="h-[550px] rounded-lg border border-[#e2e8f0] overflow-hidden">
              <FixedRoutePreview slideId={slideId} />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 mt-4">
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePreview()}>Preview Screens</Button>
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePublish()}>Publish Screens</Button>
              {saveStatus !== 'idle' && (
                <div className="flex items-center text-xs text-gray-500 ml-2 animate-fade-in">
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      Saved Locally
                    </>
                  )}
                </div>
              )}
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
                <div className="w-8 h-8 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden">
                  {bgImage ? (
                    <img src={bgImage} alt="BG" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-4 h-4 bg-[#cbd5e0] rounded" />
                  )}
                </div>
                <div className="flex gap-1">
                  {/* Hidden input */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent px-2 py-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change
                  </Button>
                  {bgImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-transparent px-2 py-1"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>


            <div className="mt-auto">

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
