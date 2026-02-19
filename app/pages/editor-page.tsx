'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Upload, Settings, Edit } from "lucide-react"
import QRSlide from "@/components/slides/qr"
import TransitDestinationSlide from "@/components/slides/transit-destination"
import { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid";
import QRSlidePreview from "@/components/slide-previews/qr-slide-preview"
import TransitDestinationPreview from "@/components/slide-previews/transit-destination-preview"
import StopArrivalsSlide from "@/components/slides/stop-arrivals"
import FixedRoutePreview from "@/components/slide-previews/fixed-route-preview"
import TransitRoutesPreview from "@/components/slide-previews/transit-routes-preview"
import TransitRoutesSlide from "@/components/slides/transit-routes"
import RouteTimesSlide from "@/components/slides/route-times"
import RouteTimesPreview from "@/components/slide-previews/route-times-preview"
import { useRouter } from 'next/navigation';
import Template1Slide from "@/components/slides/template-1"
import Template1Preview from "@/components/slide-previews/template-1-preview"
import Template2Slide from "@/components/slides/template-2"
import Template2Preview from "@/components/slide-previews/template-2-preview"
import Template3Slide from "@/components/slides/template-3"
import Template3Preview from "@/components/slide-previews/template-3-preview"
import ImageOnlySlide from "@/components/slides/image-only"
import ImageOnlyPreview from "@/components/slide-previews/image-only-preview"
import WeatherSlide from "@/components/slides/weather"
import WeatherPreview from "@/components/slide-previews/weather-preview"
import CitibikeSlide from "@/components/slides/citibike"
import CitibikePreview from "@/components/slide-previews/citibike-preview"
import EditFooter from "@/components/shared-components-editors/edit-footer"
import { useGeneralStore } from "@/stores/general"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faGear } from '@fortawesome/free-solid-svg-icons';
import bcrypt from "bcryptjs";

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
import { useQRStore } from "@/stores/qr"
import { useTemplate1Store } from "@/stores/template1"
import { useTemplate2Store } from "@/stores/template2"
import { useTemplate3Store } from "@/stores/template3"
import { useImageOnlyStore } from "@/stores/imageOnly"
import { useWeatherStore } from "@/stores/weather"
import { useCitibikeStore } from "@/stores/citibike"
import { useRouteTimesStore } from "@/stores/routeTimes"
import { useFixedRouteStore } from "@/stores/fixedRoute"
import { applyFontSizeToAllSlides } from "@/services/applyThemeToSlides"


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
  const [isEditingFooter, setIsEditingFooter] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'success' | 'error' | null>(null);
  const [publishMessage, setPublishMessage] = useState('');
  const [publishUrl, setPublishUrl] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const template = useGeneralStore((state) => state.template || '');
  const setTemplate = useGeneralStore((state) => state.setTemplate);

  const slides: any = useGeneralStore((state) => state.slides || []);
  const setSlides = useGeneralStore((state) => state.setSlides);

  const url = useGeneralStore((state) => state.url || '');
  const setUrl = useGeneralStore((state) => state.setUrl);

  const rotationInterval = useGeneralStore((state) => state.rotationInterval || 0);
  const setRotationInterval = useGeneralStore((state) => state.setRotationInterval);

  const publishPassword = useGeneralStore((state) => state.publishPassword || '');
  const setPublishPassword = useGeneralStore((state) => state.setPublishPassword);

  const defaultBackgroundColor = useGeneralStore((state) => state.defaultBackgroundColor || '#192F51');
  const setDefaultBackgroundColor = useGeneralStore((state) => state.setDefaultBackgroundColor);
  const defaultTitleColor = useGeneralStore((state) => state.defaultTitleColor || '#FFFFFF');
  const setDefaultTitleColor = useGeneralStore((state) => state.setDefaultTitleColor);
  const defaultTextColor = useGeneralStore((state) => state.defaultTextColor || '#FFFFFF');
  const setDefaultTextColor = useGeneralStore((state) => state.setDefaultTextColor);
  const defaultFontFamily = useGeneralStore((state) => state.defaultFontFamily || 'System Default');
  const setDefaultFontFamily = useGeneralStore((state) => state.setDefaultFontFamily);

  // Theme state
  const theme = useGeneralStore((state) => state.theme);
  const setThemePrimaryBackground = useGeneralStore((state) => state.setThemePrimaryBackground);
  const setThemeSecondaryAccent = useGeneralStore((state) => state.setThemeSecondaryAccent);
  const setThemeTitleText = useGeneralStore((state) => state.setThemeTitleText);
  const setThemeBodyText = useGeneralStore((state) => state.setThemeBodyText);

  const [tempRotationInterval, setTempRotationInterval] = useState(rotationInterval);
  const [tempDefaultBackgroundColor, setTempDefaultBackgroundColor] = useState(defaultBackgroundColor);
  const [tempDefaultTitleColor, setTempDefaultTitleColor] = useState(defaultTitleColor);
  const [tempDefaultTextColor, setTempDefaultTextColor] = useState(defaultTextColor);
  const [tempDefaultFontFamily, setTempDefaultFontFamily] = useState(defaultFontFamily);

  // Font size defaults
  const defaultTitleTextSize = useGeneralStore((state) => state.defaultTitleTextSize || 5);
  const setDefaultTitleTextSize = useGeneralStore((state) => state.setDefaultTitleTextSize);
  const defaultContentTextSize = useGeneralStore((state) => state.defaultContentTextSize || 5);
  const setDefaultContentTextSize = useGeneralStore((state) => state.setDefaultContentTextSize);

  // Theme temp state
  const [tempThemePrimaryBackground, setTempThemePrimaryBackground] = useState(theme?.primaryBackground || '#192F51');
  const [tempThemeSecondaryAccent, setTempThemeSecondaryAccent] = useState(theme?.secondaryAccent || '#78B1DD');
  const [tempThemeTitleText, setTempThemeTitleText] = useState(theme?.titleText || '#ffffff');
  const [tempThemeBodyText, setTempThemeBodyText] = useState(theme?.bodyText || '#ffffff');
  const [tempDefaultTitleTextSize, setTempDefaultTitleTextSize] = useState(defaultTitleTextSize);
  const [tempDefaultContentTextSize, setTempDefaultContentTextSize] = useState(defaultContentTextSize);
  useEffect(() => {
    if (showSettings) {
      setTempRotationInterval(rotationInterval);
      setTempDefaultBackgroundColor(defaultBackgroundColor);
      setTempDefaultTitleColor(defaultTitleColor);
      setTempDefaultTextColor(defaultTextColor);
      setTempDefaultFontFamily(defaultFontFamily);
      setTempThemePrimaryBackground(theme?.primaryBackground || '#192F51');
      setTempThemeSecondaryAccent(theme?.secondaryAccent || '#78B1DD');
      setTempThemeTitleText(theme?.titleText || '#ffffff');
      setTempThemeBodyText(theme?.bodyText || '#ffffff');
      setTempDefaultTitleTextSize(defaultTitleTextSize);
      setTempDefaultContentTextSize(defaultContentTextSize);
    }
  }, [showSettings]);

  // Compute font family style for preview consistency with published page
  const fontFamilyStyle = defaultFontFamily && defaultFontFamily !== 'System Default'
    ? { fontFamily: defaultFontFamily }
    : {};

  const setDestinationData = useTransitDestinationsStore((state) => state.setDestinationData);
  const setDataError = useTransitDestinationsStore((state) => state.setDataError);

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

  // Helper function to initialize default colors for a new slide
  const initializeSlideDefaults = (slideId: string, slideType: string) => {
    // Read theme colors directly from store to apply to new slides
    const { theme, defaultTitleTextSize, defaultContentTextSize } = useGeneralStore.getState();
    const primaryBg = theme?.primaryBackground || '#192F51';
    const secondaryAccent = theme?.secondaryAccent || '#78B1DD';
    const titleText = theme?.titleText || '#ffffff';
    const bodyText = theme?.bodyText || '#ffffff';
    const titleSize = defaultTitleTextSize || 5;
    const contentSize = defaultContentTextSize || 5;

    switch (slideType) {
      case 'qr':
        useQRStore.getState().setBackgroundColor(slideId, primaryBg);
        useQRStore.getState().setTextColor(slideId, bodyText);
        useQRStore.getState().setTextSize(slideId, contentSize);
        break;
      case 'transit-destinations':
        useTransitDestinationsStore.getState().setBackgroundColor(slideId, primaryBg);
        useTransitDestinationsStore.getState().setRowColor(slideId, secondaryAccent);
        useTransitDestinationsStore.getState().setAlternateRowColor(slideId, primaryBg);
        useTransitDestinationsStore.getState().setTableHeaderTextColor(slideId, titleText);
        useTransitDestinationsStore.getState().setTableTextColor(slideId, bodyText);
        useTransitDestinationsStore.getState().setAlternateRowTextColor(slideId, bodyText);
        useTransitDestinationsStore.getState().setTitleTextSize(slideId, titleSize);
        useTransitDestinationsStore.getState().setContentTextSize(slideId, contentSize);
        break;
      case 'template-1':
        useTemplate1Store.getState().setBackgroundColor(slideId, primaryBg);
        useTemplate1Store.getState().setTitleColor(slideId, titleText);
        useTemplate1Store.getState().setTextColor(slideId, bodyText);
        useTemplate1Store.getState().setTitleTextSize(slideId, titleSize);
        useTemplate1Store.getState().setContentTextSize(slideId, contentSize);
        break;
      case 'template-2':
        useTemplate2Store.getState().setBackgroundColor(slideId, primaryBg);
        useTemplate2Store.getState().setTitleColor(slideId, titleText);
        useTemplate2Store.getState().setTextColor(slideId, bodyText);
        useTemplate2Store.getState().setTitleTextSize(slideId, titleSize);
        useTemplate2Store.getState().setContentTextSize(slideId, contentSize);
        break;
      case 'template-3':
        useTemplate3Store.getState().setBackgroundColor(slideId, primaryBg);
        useTemplate3Store.getState().setTitleColor(slideId, titleText);
        useTemplate3Store.getState().setTextColor(slideId, bodyText);
        useTemplate3Store.getState().setTitleTextSize(slideId, titleSize);
        break;
      case 'image-only':
        useImageOnlyStore.getState().setBackgroundColor(slideId, primaryBg);
        break;
      case 'weather':
        useWeatherStore.getState().setBackgroundColor(slideId, primaryBg);
        useWeatherStore.getState().setContentBackgroundColor(slideId, secondaryAccent);
        useWeatherStore.getState().setTitleColor(slideId, titleText);
        useWeatherStore.getState().setTextColor(slideId, bodyText);
        useWeatherStore.getState().setTitleTextSize(slideId, titleSize);
        useWeatherStore.getState().setContentTextSize(slideId, contentSize);
        break;
      case 'citibike':
        useCitibikeStore.getState().setBackgroundColor(slideId, primaryBg);
        useCitibikeStore.getState().setTitleColor(slideId, titleText);
        useCitibikeStore.getState().setTextColor(slideId, bodyText);
        useCitibikeStore.getState().setTitleTextSize(slideId, titleSize);
        useCitibikeStore.getState().setContentTextSize(slideId, contentSize);
        break;
      case 'route-times':
        useRouteTimesStore.getState().setBackgroundColor(slideId, primaryBg);
        useRouteTimesStore.getState().setTitleColor(slideId, titleText);
        useRouteTimesStore.getState().setTableColor(slideId, secondaryAccent);
        useRouteTimesStore.getState().setTableTextColor(slideId, bodyText);
        useRouteTimesStore.getState().setTitleTextSize(slideId, titleSize);
        useRouteTimesStore.getState().setContentTextSize(slideId, contentSize);
        break;
      case 'stop-arrivals':
        useFixedRouteStore.getState().setBackgroundColor(slideId, primaryBg);
        useFixedRouteStore.getState().setTitleColor(slideId, titleText);
        useFixedRouteStore.getState().setTableColor(slideId, secondaryAccent);
        useFixedRouteStore.getState().setTableTextColor(slideId, bodyText);
        useFixedRouteStore.getState().setTitleTextSize(slideId, titleSize);
        useFixedRouteStore.getState().setContentTextSize(slideId, contentSize);
        break;
      default:
        break;
    }
  };

  const handleAddSlide = () => {
    if (!template) {
      alert("Please select a template before adding a slide.");
      return;
    }
    const newSlide: Slide = { id: uuidv4(), type: template };

    // Initialize the new slide with default colors BEFORE adding to slides array
    // This ensures the store values are set before the component renders
    initializeSlideDefaults(newSlide.id, template);

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
      console.log(destinations);

      try {
        setLoading(slide.id, true);
        const currentDestinationData = allSlidesState[slide.id]?.destinationData || [];
        await getDestinationData(destinations, slide.id, setDestinationData, setDataError, currentDestinationData);
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

  const handleEditFooter = () => {
    setIsEditingFooter(true);
    setActiveSlide(null);
    setActiveSlideId('');
  };

  const handleCancelFooterEdit = () => {
    setIsEditingFooter(false);
    // Return to first slide if slides exist
    if (slides.length > 0) {
      setActiveSlide(slides[0]);
      setActiveSlideId(slides[0].id);
    }
  };

  const handleSaveFooterEdit = () => {
    setIsEditingFooter(false);
    // Return to first slide if slides exist
    if (slides.length > 0) {
      setActiveSlide(slides[0]);
      setActiveSlideId(slides[0].id);
    }
  };

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

  const openPasswordModal = () => {
    if (!publishPassword) {
      setIsSettingPassword(true);
    } else {
      setIsSettingPassword(false);
    }
    setPasswordInput("");
    setErrorMessage("");
    setShowPasswordModal(true);
  };

  const handlePublish = async () => {
    if (isSettingPassword) {
      if (!passwordInput.trim()) {
        setErrorMessage("Password cannot be empty.");
        return;
      }
      const hashed = await bcrypt.hash(passwordInput, 10);
      setPublishPassword(hashed);
      setShowPasswordModal(false);
      setErrorMessage("");
      alert("Password set successfully. Please publish again.");
      return;
    } else {
      const match = await bcrypt.compare(passwordInput, publishPassword);
      if (!match) {
        setErrorMessage("Incorrect password. Please try again.");
        return;
      }
      setShowPasswordModal(false);
      handlePublishingStep();
    }
  };

  const handlePublishingStep = async () => {
    setPublishing(true);
    setPublishStatus(null);
    setPublishMessage("");
    setPublishUrl("");

    try {
      const response = await publish();
      setPublishStatus("success");
      setPublishMessage("Mobility Screen published successfully!");
      setPublishUrl(response.url);
    } catch (err: any) {
      setPublishStatus("error");
      setPublishMessage(err.message || "Failed to publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  };


  const renderSlideComponent = (type: string, slideId: string) => {
    switch (type) {
      case "qr":
        return <QRSlide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={openPasswordModal} />;
      case "transit-destinations":
        return <TransitDestinationSlide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={openPasswordModal} />;
      case "fixed-routes": // for backwards compatibility
      case "stop-arrivals":
        return <StopArrivalsSlide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={openPasswordModal} />;
      case "transit-routes":
        return <TransitRoutesSlide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={openPasswordModal} />;
      case "route-times":
        return <RouteTimesSlide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={openPasswordModal} />;
      case "template-1":
        return <Template1Slide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={openPasswordModal} />;
      case "template-2":
        return <Template2Slide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={openPasswordModal} />;
      case "template-3":
        return <Template3Slide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={openPasswordModal} />;
      case "image-only":
        return <ImageOnlySlide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={openPasswordModal} />;
      case "weather":
        return <WeatherSlide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={openPasswordModal} />;
      case "citibike":
        return <CitibikeSlide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={openPasswordModal} />;
      default:
        return <Template1Slide slideId={slideId} handleDelete={handleDelete} handlePreview={handlePreview} handlePublish={openPasswordModal} />;
    }
  };

  const renderSlidePreview = (type: string, slideId: string, noSizingDiv?: boolean, isFullPreview?: boolean) => {
    // If noSizingDiv is not set, we're rendering in the sidebar thumbnail - always use preview mode
    // If isFullPreview is true, we're in the modal preview - use preview mode
    const shouldUsePreviewMode = !noSizingDiv || isFullPreview;

    const content = (() => {
      switch (type) {
        case "qr":
          return <QRSlidePreview slideId={slideId} />;
        case "transit-destinations":
          return <TransitDestinationPreview slideId={slideId} />;
        case "fixed-routes": // for backwards compatibility
        case "stop-arrivals":
          return <FixedRoutePreview slideId={slideId} />;
        case "transit-routes":
          return <TransitRoutesPreview slideId={slideId} />;
        case "route-times":
          return <RouteTimesPreview slideId={slideId} />;
        case "template-1":
          return <Template1Preview slideId={slideId} previewMode={shouldUsePreviewMode} />;
        case "template-2":
          return <Template2Preview slideId={slideId} previewMode={shouldUsePreviewMode} />;
        case "template-3":
          return <Template3Preview slideId={slideId} previewMode={shouldUsePreviewMode} />;
        case "image-only":
          return <ImageOnlyPreview slideId={slideId} previewMode={shouldUsePreviewMode} />;
        case "weather":
          return <WeatherPreview slideId={slideId} previewMode={shouldUsePreviewMode} />;
        case "citibike":
          return <CitibikePreview slideId={slideId} previewMode={shouldUsePreviewMode} />;
        default:
          return null;
      }
    })();

    if (noSizingDiv) {
      return <div style={fontFamilyStyle} className="h-full">{content}</div>;
    }

    return <div className="h-[550px] rounded-lg" style={fontFamilyStyle}>{content}</div>;
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

        <div className="p-4 flex flex-col flex-1 min-h-0">
          <h3 className="text-[#4a5568] font-medium mb-3 text-sm">Screen Order Preview</h3>

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
              <div className="h-[60vh] max-h-[60vh] overflow-y-auto space-y-2 mb-4 pr-1 pl-1 pt-2">
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
                    Transit Route Destination Map Page
                  </div>
                </SelectItem>
                <SelectItem value="transit-destinations">
                  <div className="flex items-center gap-2 text-xs">
                    Transit Destination Table Page
                  </div>
                </SelectItem>
                <SelectItem value="fixed-routes">
                  <div className="flex items-center gap-2 text-xs">
                    Stop Arrivals Page
                  </div>
                </SelectItem>
                <SelectItem value="route-times">
                  <div className="flex items-center gap-2 text-xs">
                    Route Times Page
                  </div>
                </SelectItem>
                <SelectItem value="qr">
                  <div className="flex items-center gap-2 text-xs">
                    QR Code Page
                  </div>
                </SelectItem>
                <SelectItem value="image-only">
                  <div className="flex items-center gap-2 text-xs">
                    Image Only Page
                  </div>
                </SelectItem>
                <SelectItem value="template-3">
                  <div className="flex items-center gap-2 text-xs">
                    Image and Title Page
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
                <SelectItem value="weather">
                  <div className="flex items-center gap-2 text-xs">
                    Weather Page
                  </div>
                </SelectItem>
                <SelectItem value="citibike">
                  <div className="flex items-center gap-2 text-xs">
                    Citibike Page
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="w-full text-[#000000] bg-transparent bg-[#face00] hover:bg-[#face00]/90 mb-2"
            onClick={() => {
              handleAddSlide();
            }}
          >
            <Upload className="w-4 h-4 mr-2 border-none" />
            Add Slide
          </Button>

          <Button
            variant="outline"
            className="w-full text-[#000000] bg-transparent bg-[#face00] hover:bg-[#face00]/90 mb-2"
            onClick={() => {
              handleEditFooter();
            }}
          >
            <Edit className="w-4 h-4 mr-2 border-none" />
            Edit Footer
          </Button>

          <Button
            variant="outline"
            className="w-full text-[#000000] bg-transparent bg-[#D3D3D3] hover:bg-[#D3D3D3]/90"
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


        {isEditingFooter ? (
          <EditFooter
            handleCancel={handleCancelFooterEdit}
            handleSave={handleSaveFooterEdit}
          />
        ) : (
          activeSlide && renderSlideComponent(activeSlide.type, activeSlide.id)
        )}


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
              {renderSlidePreview(slides[modalSlideIndex].type, slides[modalSlideIndex].id, true, true)}
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
              onClick={() => {
                setShowSettings(false);
                setTempRotationInterval(rotationInterval);
                setTempDefaultBackgroundColor(defaultBackgroundColor);
                setTempDefaultTitleColor(defaultTitleColor);
                setTempDefaultTextColor(defaultTextColor);
                setTempDefaultFontFamily(defaultFontFamily);
                // Reset theme temp values
                setTempThemePrimaryBackground(theme?.primaryBackground || '#192F51');
                setTempThemeSecondaryAccent(theme?.secondaryAccent || '#78B1DD');
                setTempThemeTitleText(theme?.titleText || '#ffffff');
                setTempThemeBodyText(theme?.bodyText || '#ffffff');
                // Reset font size temp values
                setTempDefaultTitleTextSize(defaultTitleTextSize);
                setTempDefaultContentTextSize(defaultContentTextSize);
              }}
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

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Theme</h3>
                <p className="text-xs text-gray-500 mb-3">Changes apply to all existing and new slides.</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Primary Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tempThemePrimaryBackground}
                        onChange={(e) => setTempThemePrimaryBackground(e.target.value)}
                        className="w-8 h-8 p-0 border-none rounded cursor-pointer appearance-none"
                      />
                      <span className="text-xs text-gray-500 w-16">{tempThemePrimaryBackground}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Secondary/Accent</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tempThemeSecondaryAccent}
                        onChange={(e) => setTempThemeSecondaryAccent(e.target.value)}
                        className="w-8 h-8 p-0 border-none rounded cursor-pointer appearance-none"
                      />
                      <span className="text-xs text-gray-500 w-16">{tempThemeSecondaryAccent}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Title Text</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tempThemeTitleText}
                        onChange={(e) => setTempThemeTitleText(e.target.value)}
                        className="w-8 h-8 p-0 border-none rounded cursor-pointer appearance-none"
                      />
                      <span className="text-xs text-gray-500 w-16">{tempThemeTitleText}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Body Text</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tempThemeBodyText}
                        onChange={(e) => setTempThemeBodyText(e.target.value)}
                        className="w-8 h-8 p-0 border-none rounded cursor-pointer appearance-none"
                      />
                      <span className="text-xs text-gray-500 w-16">{tempThemeBodyText}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Typography</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Font Family</label>
                    <select
                      value={tempDefaultFontFamily}
                      onChange={(e) => setTempDefaultFontFamily(e.target.value)}
                      className="w-40 p-2 text-sm border border-gray-300 rounded cursor-pointer"
                    >
                      <option value="System Default">System Default</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Trebuchet MS">Trebuchet MS</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Title Font Size</label>
                    <select
                      value={tempDefaultTitleTextSize}
                      onChange={(e) => setTempDefaultTitleTextSize(Number(e.target.value))}
                      className="w-40 p-2 text-sm border border-gray-300 rounded cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Content Font Size</label>
                    <select
                      value={tempDefaultContentTextSize}
                      onChange={(e) => setTempDefaultContentTextSize(Number(e.target.value))}
                      className="w-40 p-2 text-sm border border-gray-300 rounded cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => {
                    setRotationInterval(tempRotationInterval);
                    // Apply theme to all slides
                    setThemePrimaryBackground(tempThemePrimaryBackground);
                    setThemeSecondaryAccent(tempThemeSecondaryAccent);
                    setThemeTitleText(tempThemeTitleText);
                    setThemeBodyText(tempThemeBodyText);
                    // Also update default colors for new slides
                    setDefaultBackgroundColor(tempThemePrimaryBackground);
                    setDefaultTitleColor(tempThemeTitleText);
                    setDefaultTextColor(tempThemeBodyText);
                    setDefaultFontFamily(tempDefaultFontFamily);
                    // Save font sizes and apply to all slides
                    setDefaultTitleTextSize(tempDefaultTitleTextSize);
                    setDefaultContentTextSize(tempDefaultContentTextSize);
                    applyFontSizeToAllSlides('titleTextSize', tempDefaultTitleTextSize);
                    applyFontSizeToAllSlides('contentTextSize', tempDefaultContentTextSize);
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

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-2 right-3 text-gray-400 hover:text-black text-2xl"
            >
              ×
            </button>

            <h2 className={`text-xl font-semibold ${publishPassword ? 'mb-6' : 'mb-1'}`}>
              {isSettingPassword ? "Set Publishing Password" : "Enter Your Publishing Password"}
            </h2>
            {!publishPassword && (
              <p className="mb-4 text-[#7e807f] text-sm">Save this password somewhere safe</p>
            )}

            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder={isSettingPassword ? "Create a password" : "Enter password"}
              className="border border-gray-300 p-2 rounded w-full"
            />

            {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}

            <div className="mt-6 flex justify-end gap-2">

              <Button
                variant="outline"
                className="w-[120px] text-[#000000] bg-transparent bg-[#FFFFFF] hover:bg-[#FFFFFF]/90"
                onClick={() => setShowPasswordModal(false)}
              >

                Cancel
              </Button>
              <Button
                variant="outline"
                className="w-[120px] text-[#000000] bg-transparent bg-[#face00] hover:bg-[#face00]/90 border-none"
                onClick={() => {
                  handlePublish();
                }}
              >

                {publishPassword ? 'Continue' : 'Set Password'}
              </Button>
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
                  href={publishUrl + '?mode=tv'}
                  target="_blank"
                  className="text-blue-600 underline break-words"
                >
                  {publishUrl + '?mode=tv'}
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

