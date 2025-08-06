'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { HelpCircle, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useGeneralStore } from "@/stores/general"
import { SetupSlides } from '@/services/setup'
import { v4 as uuidv4 } from "uuid";
import { generateShortcode } from "@/utils/generateShortcode"
import { existsingCheck } from "@/services/existingCheck"


export default function LandingPage() {
  const router = useRouter()
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [templateError, setTemplateError] = useState(false);
  const [existingEdit, setExistingEdit] = useState(false);

  const template = useGeneralStore((state) => state.template || '');
  const setTemplate = useGeneralStore((state) => state.setTemplate);

  const setLocation = useGeneralStore((state) => state.setLocation);
  const setAddress = useGeneralStore((state) => state.setAddress);

  const setCoordinates = useGeneralStore((state) => state.setCoordinates);

  const url = useGeneralStore((state) => state.url || '');
  const setUrl = useGeneralStore((state) => state.setUrl);

  const setShortcode = useGeneralStore((state) => state.setShortcode);

  useEffect(() => {
    const current = JSON.parse(localStorage.getItem('general-store') || '{}');
    if (current && current.state?.slides && current.state.slides.length > 0) {
      setExistingEdit(true);
    }
  }, []);


  useEffect(() => {
    const controller = new AbortController();
    if (query.length < 3) return;

    const fetchSuggestions = async () => {
      if (selectedFeature) return;
      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?autocomplete=true&proximity=ip&types=address,place&limit=5&access_token=${accessToken}&bbox=-79.7624,40.4774,-71.7517,45.0159`; // NY bounding box

      try {
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        console.log(data.features);
        const nyOnly = data.features.filter((feat: any) =>
          feat.place_name.includes("New York")
        );
        setSuggestions(nyOnly.map((feat: any) => feat));
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
      }
    };

    fetchSuggestions();
    return () => controller.abort();
  }, [query]);

  const handleSelect = (feature: any) => {
    setSelectedFeature(feature);
    setQuery(feature.place_name);
    setSuggestions([]);
  };

  const handleCreate = () => {
    const hasLocation = !!selectedFeature;
    const hasTemplate = !!template;

    setLocationError(!hasLocation);
    setTemplateError(!hasTemplate);

    localStorage.clear();
    localStorage.removeItem('general-store');
    setUrl('');
    const shortcode = generateShortcode()
    existsingCheck(shortcode).then((data) => {
      if (data.exists) {
        const newShortcode = generateShortcode();
        setShortcode(newShortcode);
      } else {
        setShortcode(shortcode);
      }

      useGeneralStore.setState({ slides: [{ id: uuidv4(), type: template }] });

      if (hasLocation && hasTemplate) {
        setAddress(selectedFeature.place_name);
        const [lng, lat] = selectedFeature.center;
        setCoordinates({ lat, lng });
        router.push('/editor');
      }
    })

  }

  const handleContinue = () => {
    router.push('/editor');
  };

  const handleEdit = () => {

    const shortcode = url.split('/').pop();

    localStorage.clear();
    localStorage.removeItem('general-store');

    if (shortcode) {
      SetupSlides(shortcode).then((data) => {
        console.log('Setup Slides Data:', data);
        router.push(`/editor`);
      })
    } else {
      console.error('Shortcode not found in URL');
    }
  };

  return (
    <div className="min-h-screen bg-[#e5eaef] flex">
      {/* Left Column - Logo */}
      <div className="w-[196px] bg-white border-r border-[#e2e8f0] flex flex-col items-center pt-6">
        <img src="/images/nysdot-logo.png" alt="New York State Department of Transportation" className="w-36 mb-6" />
      </div>

      {/* Right Column - Main Content */}
      <div className="flex-1 bg-white">
        {/* Header */}
        <header className="bg-white border-b border-[#e2e8f0] px-6 py-4 flex justify-end">
          <Button variant="ghost" size="icon" className="text-[#606061]">
            <HelpCircle className="w-5 h-5" />
          </Button>
        </header>

        {/* Main Content */}
        <main className="px-8 py-12">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-semibold text-[#4a5568] mb-6">
              Welcome to the NYSDOT Mobility Screens Builder.
            </h1>
            <p className="text-[#606061] text-lg max-w-4xl mx-auto leading-relaxed">
              This tool will help you create the various screens that display real-time, local traffic and transit
              information. Through this tool, you will be able to create your own transportation information screens,
              publish the information on-site/on your own monitors, and display the information to your desired audience
              through a public URL.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Create New Set Card */}
            <Card className="bg-[#0b5583] border-0">
              <CardContent className="p-8">
                <h2 className="text-white text-2xl font-semibold mb-8">Create a new set of mobility screens</h2>

                <div className="space-y-6">
                  <div>
                    <p className="text-white mb-4">1. Set an initial central location for the screens</p>
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="i.e Albany Airport"
                          value={query}
                          onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedFeature("");
                            setLocationError(false);
                          }}
                          className={`bg-white text-[#1a202c] w-full ${locationError ? "border border-red-500" : ""}`}
                        />
                        {suggestions.length > 0 && (
                          <ul className="absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                            {suggestions.map((feature: any, idx) => (
                              <li
                                key={idx}
                                onClick={() => handleSelect(feature)}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black"
                              >
                                {feature.place_name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-white mb-4">
                      2. Select a template from the drop down list to get started with your first screen.
                    </p>
                    <div className="flex gap-3">
                      <Select value={template} onValueChange={(value) => {
                        setTemplate(value);
                        setTemplateError(false);
                      }}>
                        <SelectTrigger className={`w-full text-xs ${templateError ? "border border-red-500" : ""}`}>
                          <div className="flex items-left gap-2">
                            <SelectValue placeholder="Select a Template" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transit-routes">
                            <div className="flex items-center gap-2 text-xs">
                              Transit Route Map Page
                            </div>
                          </SelectItem>
                          <SelectItem value="transit-destinations">
                            <div className="flex items-center gap-2 text-xs">
                              Transit Destination Table Page
                            </div>
                          </SelectItem>
                          <SelectItem value="fixed-routes">
                            <div className="flex items-center gap-2 text-xs">
                              Fixed Route Table Page
                            </div>
                          </SelectItem>
                          <SelectItem value="qr">
                            <div className="flex items-center gap-2 text-xs">
                              QR Code Page
                            </div>
                          </SelectItem>
                          <SelectItem value="template-3">
                            <div className="flex items-center gap-2 text-xs">
                              Image Only Page
                            </div>
                          </SelectItem>
                          <SelectItem value="template-1">
                            <div className="flex items-center gap-2 text-xs">
                              Left Content/Right Image Page
                            </div>
                          </SelectItem>
                          <SelectItem value="template-2">
                            <div className="flex items-center gap- text-xs">
                              Right Content/Left Image Page
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={() => { handleCreate() }} className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium px-6">Create</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Existing Set Card */}
            <Card className="bg-[#6e9ab5] border-0">
              <CardContent className="p-8">
                <h2 className="text-[#1a202c] text-2xl font-semibold mb-8">
                  Edit an existing set of mobility screens or add a new screen
                </h2>

                <div className="space-y-6">
                  <p className="text-[#2d3748] text-sm">
                    Insert a published Mobility Screen URL to edit an existing mobility screen
                  </p>

                  <div className="flex gap-3">
                    <Input className="bg-white text-[#1a202c] flex-1" value={url} onChange={(e) => setUrl(e.target.value)} />
                    <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium px-6" onClick={() => handleEdit()}>Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {existingEdit && (
          <div className="mt-6 w-[800px] align-middle mx-auto">
            <Card className="bg-[#0b5583] border-0 p-2 pt-6">
              <CardContent>
                <div className="flex items-center justify-between pt-2">
                  <p className="font-medium text-[#ffffff]">
                    You have an existing edit saved, you can continue editing where you left off or start a new set of screens.
                  </p>
                  <Button
                    className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium px-6 ml-4"
                    onClick={handleContinue}
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

