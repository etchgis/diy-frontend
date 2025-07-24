'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Upload } from "lucide-react"
import QRSlide from "@/components/slides/qr"
import TransitDestinationSlide from "@/components/slides/transit-destination"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid";
import QRSlidePreview from "@/components/slide-previews/qr-slide-preview"
import TransitDestinationPreview from "@/components/slide-previews/transit-destination-preview"
import FixedRouteSlide from "@/components/slides/fixed-route"
import FixedRoutePreview from "@/components/slide-previews/fixed-route-preview"
import TransitRoutesPreview from "@/components/slide-previews/transit-routes-preview"
import TransitRoutesSlide from "@/components/slides/transit-routes"
import { useRouter } from 'next/navigation';
import Template1Slide from "@/components/slides/template-1"
import Template1Preview from "@/components/slide-previews/template-1-preview"



export default function EditorPage() {
  const [slides, setSlides] = useState([
    { id: uuidv4(), type: "transit-destinations" },
    { id: uuidv4(), type: "transit-routes" },
    { id: uuidv4(), type: "fixed-routes" },
    { id: uuidv4(), type: "qr" },
  ]);
  const [activeSlideId, setActiveSlideId] = useState(slides[0]?.id);

  const router = useRouter();

  const renderSlideComponent = (type: string) => {
    switch (type) {
      case "qr":
        return <QRSlide />;
      case "transit-destinations":
        return <TransitDestinationSlide />;
      case "fixed-routes":
        return <FixedRouteSlide />;
      case "transit-routes":
        return <TransitRoutesSlide />;
      case "template-1":
        return <Template1Slide />;
      default:
        return null;
    }
  };

  const renderSlidePreview = (type: string) => {
    switch (type) {
      case "qr":
        return <QRSlidePreview />;
      case "transit-destinations":
        return <TransitDestinationPreview />;
      case "fixed-routes":
        return <FixedRoutePreview stopName={''} />;
      case "transit-routes":
        return <TransitRoutesPreview />
      case "template-1":
        return <Template1Preview />;
    }
  }

  const activeSlide = slides.find(s => s.id === activeSlideId);


  return (
    <div className="min-h-screen bg-[#e5eaef] flex">
      {/* Left Sidebar - Full Height */}
      <div className="w-[196px] bg-white border-r border-[#e2e8f0] flex flex-col">
        <div
          className="p-4 border-b border-[#e2e8f0]"
          onClick={() => router.push('/')}
          style={{ cursor: 'pointer' }}
        >
          <img
            src="/images/nysdot-logo.png"
            alt="New York State Department of Transportation"
            className="w-full mb-4"
          />
        </div>

        <div className="p-4">
          <h3 className="text-[#4a5568] font-medium mb-3 text-sm">Screen Order Preview</h3>
          <div className="space-y-2 mb-4">
            {slides.map((slide) => (
              <div
                key={slide.id}
                onClick={() => setActiveSlideId(slide.id)}
                className={`cursor-pointer rounded border bg-white p-1 ${slide.id === activeSlideId ? "ring-2 ring-blue-500" : ""
                  }`}
              >
                <div className="w-full h-20 overflow-hidden relative bg-gray-100 rounded">
                  <div className="absolute top-0 left-0 origin-top-left scale-[0.15] w-[650%]">
                    {renderSlidePreview(slide.type)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full text-[#4a5568] border-[#cbd5e0] bg-transparent"
            onClick={() => {
              const newSlide = { id: uuidv4(), type: "template-1" };
              setSlides(prev => [...prev, newSlide]);
              setActiveSlideId(newSlide.id);
            }}
          >
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


        {activeSlide && renderSlideComponent(activeSlide.type)}


      </div>
    </div>

  )
}

