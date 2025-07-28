'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Upload } from "lucide-react"
import QRSlide from "@/components/slides/qr"
import TransitDestinationSlide from "@/components/slides/transit-destination"
import { useEffect, useState } from "react"
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
import { useGeneralStore } from "@/stores/general"
import { set } from "react-hook-form"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableSlide } from "@/components/sortable-slide"




interface Slide {
  id: string;
  type: string;
}

export default function EditorPage() {
  const [activeSlideId, setActiveSlideId] = useState('');
  const [activeSlide, setActiveSlide]: any = useState('');

  const template = useGeneralStore((state) => state.template || '');
  const setTemplate = useGeneralStore((state) => state.setTemplate);

  const slides: any = useGeneralStore((state) => state.slides || []);
  const setSlides = useGeneralStore((state) => state.setSlides);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, 
      },
    })
  );
  const router = useRouter();

  useEffect(() => {
    console.log(slides);
    if (slides.length === 0) {
      setSlides([
        { id: uuidv4(), type: "transit-destinations" },
        { id: uuidv4(), type: "transit-routes" },
        { id: uuidv4(), type: "fixed-routes" },
        { id: uuidv4(), type: "qr" }
      ]);
    }
  }, [])

  useEffect(() => {
    if (slides && slides.length > 0 && !activeSlideId) {
      setActiveSlideId(slides[0].id);
    }
  }, [slides]);

  useEffect(() => {
    if (slides && activeSlideId) {
      const slide = slides.find((s: any) => s.id === activeSlideId);
      setActiveSlide(slide);
    }
  }, [slides, activeSlideId]);

  useEffect(() => {
    console.log(`Active Slide ID: ${activeSlideId}`);
  }, [activeSlideId]);

  const setAllData = () => {

  }

  const handleDelete = (slideId: string) => {
    const confirmed = confirm("Are you sure you want to delete this screen? This action cannot be undone.");
    if (confirmed) {
      const filteredSlides: any = slides?.filter((slide: any) => slide.id !== slideId);
      setSlides(filteredSlides);
    }
  }

  const renderSlideComponent = (type: string, slideId: string) => {
    switch (type) {
      case "qr":
        return <QRSlide slideId={slideId} handleDelete={handleDelete}/>;
      case "transit-destinations":
        return <TransitDestinationSlide slideId={slideId} handleDelete={handleDelete}/>;
      case "fixed-routes":
        return <FixedRouteSlide slideId={slideId} handleDelete={handleDelete}/>;
      case "transit-routes":
        return <TransitRoutesSlide slideId={slideId} handleDelete={handleDelete}/>;
      case "template-1":
        return <Template1Slide slideId={slideId} handleDelete={handleDelete}/>;
      default:
        return <Template1Slide slideId={slideId} handleDelete={handleDelete}/>;
    }
  };

  const renderSlidePreview = (type: string, slideId: string) => {
    switch (type) {
      case "qr":
        return <QRSlidePreview slideId={slideId} />;
      case "transit-destinations":
        return <TransitDestinationPreview slideId={slideId} />;
      case "fixed-routes":
        return <FixedRoutePreview slideId={slideId} />;
      case "transit-routes":
        return <TransitRoutesPreview />
      case "template-1":
        return <Template1Preview />;
    }
  }


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

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (active.id !== over?.id) {
                  const oldIndex = slides.findIndex((s: any) => s.id === active.id);
                  const newIndex = slides.findIndex((s: any) => s.id === over?.id);
                  const reordered: any = arrayMove(slides, oldIndex, newIndex);
                  setSlides(reordered);
                }
              }}
            >
              <SortableContext items={slides.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 mb-4">
                  {slides.map((slide: any) => (
                    <SortableSlide
                      key={slide.id}
                      slide={slide}
                      activeSlideId={activeSlideId}
                      setActiveSlideId={setActiveSlideId}
                      renderSlidePreview={renderSlidePreview}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          <Button
            variant="outline"
            className="w-full text-[#4a5568] border-[#cbd5e0] bg-transparent"
            onClick={() => {
              const newSlide: Slide = { id: uuidv4(), type: template };
              setSlides([...slides, newSlide]);
              setActiveSlideId(newSlide.id);
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Add Slide
          </Button>
          <div className="mb-4 mt-4">
            <Select value={template} onValueChange={(value) => setTemplate(value)}>
              <SelectTrigger className="w-full text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#cbd5e0] rounded"></div>
                  <SelectValue placeholder="Select a Template" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transit-routes">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                    Transit Route Map Page
                  </div>
                </SelectItem>
                <SelectItem value="transit-destinations">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                    Transit Destination Table Page
                  </div>
                </SelectItem>
                <SelectItem value="fixed-routes">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                    Fixed Route Table Page
                  </div>
                </SelectItem>
                <SelectItem value="qr">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                    QR Code Page
                  </div>
                </SelectItem>
                <SelectItem value="image-only">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full border-2 border-[#a0aec0]"></div>
                    Image Only Page
                  </div>
                </SelectItem>
                <SelectItem value="template-1">
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


        {activeSlide && renderSlideComponent(activeSlide.type, activeSlide.id)}


      </div>
    </div>

  )
}

