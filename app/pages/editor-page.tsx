'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Upload, Settings } from "lucide-react"
import QRSlide from "@/components/slides/qr"
import TransitDestinationSlide from "@/components/slides/transit-destination"
import { useEffect, useRef, useState } from "react"
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
import Template2Slide from "@/components/slides/template-2"
import Template2Preview from "@/components/slide-previews/template-2-preview"
import Template3Slide from "@/components/slides/template-3"
import Template3Preview from "@/components/slide-previews/template-3-preview"
import { useGeneralStore } from "@/stores/general"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faGear } from '@fortawesome/free-solid-svg-icons';

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
import { SetupSlides } from "@/services/setup"
import { publish } from "@/services/publish"
import { useTransitDestinationsStore } from "@/stores/transitDestinations"
import { getDestinationData } from "@/services/data-gathering/getDestinationData"


interface Slide {
  id: string;
  type: string;
}

export default function EditorPage() {
  const [activeSlideId, setActiveSlideId] = useState('');
  const [activeSlide, setActiveSlide]: any = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [modalSlideIndex, setModalSlideIndex] = useState(0);

  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'success' | 'error' | null>(null);
  const [publishMessage, setPublishMessage] = useState('');
  const [publishUrl, setPublishUrl] = useState('');

  const template = useGeneralStore((state) => state.template || '');
  const setTemplate = useGeneralStore((state) => state.setTemplate);

  const slides: any = useGeneralStore((state) => state.slides || []);
  const setSlides = useGeneralStore((state) => state.setSlides);

  const url = useGeneralStore((state) => state.url || '');
  const setUrl = useGeneralStore((state) => state.setUrl);

  const rotationInterval = useGeneralStore((state) => state.rotationInterval || 0);
  const setRotationInterval = useGeneralStore((state) => state.setRotationInterval);

  const [tempRotationInterval, setTempRotationInterval] = useState(rotationInterval);

  const setDestinationData = useTransitDestinationsStore((state) => state.setDestinationData);
  const allSlidesState = useTransitDestinationsStore((state) => state.slides);
  const setLoading = useTransitDestinationsStore((state) => state.setLoading);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );
  const router = useRouter();

  const handleAddSlide = () => {
    if (!template) {
      alert("Please select a template before adding a slide.");
      return;
    }
    const newSlide: Slide = { id: uuidv4(), type: template };
    setSlides([...slides, newSlide]);

    setActiveSlideId(newSlide.id);
  }

  useEffect(() => {
    const hasGeneralStore = localStorage.getItem('general-store');
    if (!hasGeneralStore) {
      router.push('/');
    }

  }, []);

  const hasFetchedDestinations = useRef(false);

  const getTransitDestinationData = async () => {
    const transitSlides = slides.filter((slide: any) => slide.type === 'transit-destinations');

    if (!transitSlides.length) return;

    hasFetchedDestinations.current = true;

    for (const slide of transitSlides) {
      const destinations = allSlidesState[slide.id]?.destinations || [];
      setLoading(slide.id, true);

      try {
        await getDestinationData(destinations, slide.id, setDestinationData);
      } finally {
        setLoading(slide.id, false);
      }
    }
  };

  useEffect(() => {

    if (hasFetchedDestinations.current) return;

    getTransitDestinationData();
  }, [slides, allSlidesState]);

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
  }, [activeSlideId]);


  const handleDelete = (slideId: string) => {
    const confirmed = confirm("Are you sure you want to delete this screen? This action cannot be undone.");
    if (confirmed) {
      const filteredSlides: any = slides?.filter((slide: any) => slide.id !== slideId);
      setSlides(filteredSlides);
    }
  }

  const handlePreview = () => {

    setModalSlideIndex(0);
    setShowModal(true);
  }

  const handleEdit = () => {
    hasFetchedDestinations.current = false;
    const shortcode = url.split('/').pop();

    localStorage.clear();
    localStorage.removeItem('general-store');

    if (shortcode) {
      SetupSlides(shortcode).then((data) => {

        router.push(`/editor`);
      })
    } else {
      console.error('Shortcode not found in URL');
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishStatus(null);
    setPublishMessage('');
    setPublishUrl('');

    try {
      const response = await publish();
      setPublishStatus('success');
      setPublishMessage('Mobility Screen published successfully!');
      setPublishUrl(response.url);
    } catch (err: any) {
      setPublishStatus('error');
      setPublishMessage(err.message || 'Failed to publish. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const renderSlideComponent = (type: string, slideId: string) => {
    switch (type) {
      case "qr":
        return <QRSlide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={handlePublish} />;
      case "transit-destinations":
        return <TransitDestinationSlide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={handlePublish} />;
      case "fixed-routes":
        return <FixedRouteSlide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={handlePublish} />;
      case "transit-routes":
        return <TransitRoutesSlide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={handlePublish} />;
      case "template-1":
        return <Template1Slide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={handlePublish} />;
      case "template-2":
        return <Template2Slide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={handlePublish} />;
      case "template-3":
        return <Template3Slide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={handlePublish} />;
      default:
        return <Template1Slide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={handlePublish} />;
    }
  };

  const renderSlidePreview = (type: string, slideId: string, noSizingDiv?: boolean) => {
    const content = (() => {
      switch (type) {
        case "qr":
          return <QRSlidePreview slideId={slideId} />;
        case "transit-destinations":
          return <TransitDestinationPreview slideId={slideId} />;
        case "fixed-routes":
          return <FixedRoutePreview slideId={slideId} />;
        case "transit-routes":
          return <TransitRoutesPreview slideId={slideId} />;
        case "template-1":
          return <Template1Preview slideId={slideId} previewMode={showModal} />;
        case "template-2":
          return <Template2Preview slideId={slideId} previewMode={showModal} />;
        case "template-3":
          return <Template3Preview slideId={slideId} previewMode={showModal} />;
        default:
          return null;
      }
    })();

    if (noSizingDiv) {
      return content;
    }

    return <div className="h-[550px] rounded-lg">{content}</div>;
  };


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
                <div className="h-[68vh] overflow-y-auto space-y-2 mb-4 pr-1 pl-1 pt-2">
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
          <div className="mb-4">
            <Select value={template} onValueChange={(value) => setTemplate(value)}>
              <SelectTrigger className="w-full text-xs">
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
          </div>
          <Button
            variant="outline"
            className="w-full text-[#000000] bg-transparent bg-[#face00] hover:bg-[#face00]/90"
            onClick={() => {
              handleAddSlide();
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Add Slide
          </Button>

          <Button
            variant="outline"
            className="w-full text-[#000000] bg-transparent bg-[#D3D3D3] hover:bg-[#D3D3D3]/90 mt-2"
            onClick={() => {
              showSettings ? setShowSettings(false) : setShowSettings(true);
            }}
          >
            <FontAwesomeIcon icon={faGear} className="w-4 h-4 mr-2" />
            Screen Settings
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
                onChange={(e) => setUrl(e.target.value)}
                value={url || ''}
              />
            </div>
            <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium px-6" onClick={handleEdit}>Edit</Button>
            <Button variant="ghost" size="icon" className="text-[#2d3748]">
              <HelpCircle className="w-5 h-5" />
            </Button>
          </div>
        </header>


        {activeSlide && renderSlideComponent(activeSlide.type, activeSlide.id)}


      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-6xl h-[630px] bg-white rounded shadow-lg overflow-hidden flex flex-col">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl z-50"
            >
              ×
            </button>

            {/* Slide Preview */}
            <div className="h-[550px] z-10">
              {renderSlidePreview(slides[modalSlideIndex].type, slides[modalSlideIndex].id, true)}
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center p-4 border-t bg-gray-50">
              <Button
                onClick={() => setModalSlideIndex((prev) => Math.max(0, prev - 1))}
                disabled={modalSlideIndex === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Slide {modalSlideIndex + 1} of {slides.length}
              </span>
              <Button
                onClick={() => setModalSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                disabled={modalSlideIndex === slides.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md relative">
            <button
              onClick={() => { setShowSettings(false); setTempRotationInterval(rotationInterval); }}
              className="absolute top-2 right-3 text-gray-400 hover:text-black text-2xl"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4">Screen Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Screen Rotation Interval
                </label>
                <Input
                  type="number"
                  placeholder="Enter interval in seconds"
                  className="w-full"
                  value={tempRotationInterval || ''}
                  onChange={(e) => {
                    setTempRotationInterval(Number(e.target.value));
                  }}
                />
              </div>
              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => {
                    setRotationInterval(tempRotationInterval);
                    setShowSettings(false);
                  }}
                  className="px-4 py-2 text-[#000000] bg-transparent bg-[#face00] hover:bg-[#face00]/90"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {publishing || publishStatus ? (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md relative">
            <button
              onClick={() => {
                setPublishStatus(null);
                setPublishMessage('');
                setShowModal(false);
              }}
              className="absolute top-2 right-3 text-gray-400 hover:text-black text-2xl"
            >
              ×
            </button>

            {publishing && (
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid" />
                <p className="text-gray-700">Publishing...</p>
              </div>
            )}

            {publishStatus === 'success' && (
              <div className="text-center space-y-4 z-1000">
                <h2 className="text-xl font-semibold text-green-600 flex items-center gap-2 justify-center">
                  <FontAwesomeIcon style={{ width: '25px', height: '25px' }} icon={faCheckCircle} />
                  Published!
                </h2>
                <p>{publishMessage}</p>
                <a
                  href={publishUrl}
                  target="_blank"
                  className="text-blue-600 underline break-words"
                >
                  {publishUrl}
                </a>
              </div>
            )}

            {publishStatus === 'error' && (
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold text-red-600"><FontAwesomeIcon icon={faTimesCircle} className="text-2xl" /> Error</h2>
                <p>{publishMessage}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>

  )
}

