'use client';
import FixedRoutePreview from '@/components/slide-previews/fixed-route-preview';
import QRSlidePreview from '@/components/slide-previews/qr-slide-preview';
import Template1Preview from '@/components/slide-previews/template-1-preview';
import Template2Preview from '@/components/slide-previews/template-2-preview';
import Template3Preview from '@/components/slide-previews/template-3-preview';
import TransitDestinationPreview from '@/components/slide-previews/transit-destination-preview';
import TransitRoutesPreview from '@/components/slide-previews/transit-routes-preview';
import { fetchStopData } from '@/services/data-gathering/fetchStopData';
import { getDestinationData } from '@/services/data-gathering/getDestinationData';
import { SetupSlides } from '@/services/setup';
import { useFixedRouteStore } from '@/stores/fixedRoute';
import { useGeneralStore } from '@/stores/general';
import { useTransitDestinationsStore } from '@/stores/transitDestinations';
import { useTransitRouteStore } from '@/stores/transitRoutes';
import { useInterval } from '@dnd-kit/utilities';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PublishedPage({ shortcode }: { shortcode: string }) {
  const searchParams = useSearchParams();
  const isTvMode = searchParams.get('mode') === 'tv';
  
  const slides = useGeneralStore((state) => state.slides);
  const setSlides = useGeneralStore((state) => state.setSlides);
  const rotationInterval = useGeneralStore((state) => state.rotationInterval || 20);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [screens, setScreens] = useState<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = slides?.[activeIndex] || null;

  const setDestinationData = useTransitDestinationsStore((state) => state.setDestinationData);
  const setScheduleData = useFixedRouteStore((state) => state.setScheduleData);
  const setRoutesData = useTransitRouteStore((state) => state.setRoutes);
  const allSlidesState = useTransitDestinationsStore((state) => state.slides);
  const allFixedRouteSlidesState = useFixedRouteStore((state) => state.slides);
  const allTransitRouteSlidesState = useTransitRouteStore((state) => state.slides);

  const goToNextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isTvMode) return; // Only handle keyboard navigation in TV mode
      
      if (event.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % slides.length);
      } else if (event.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    },
    [slides.length, isTvMode]
  );

  // Auto-rotation effect - only in TV mode
  useEffect(() => {
    if (!isTvMode) return;
    
    // Only start auto-rotation if we have slides and a valid rotation interval
    if (slides.length > 1 && rotationInterval > 0) {
      intervalRef.current = setInterval(() => {
        goToNextSlide();
      }, rotationInterval * 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [slides.length, rotationInterval, goToNextSlide, isTvMode]);

  useEffect(() => {
    const loadSlides = async () => {
      if (shortcode) {
        const result = await SetupSlides(shortcode);
        setSlides(result.screens);
        setScreens(result);
        setIsLoading(false);
        
      }
    };
    loadSlides();
  }, [shortcode, setSlides]);

  // Function and useEffect to fetch transit destination data every 5 minutes
  const getTransitDestinationData = async () => {
    const transitSlides = slides.filter((slide: any) => slide.type === 'transit-destinations');
    console.log(slides, transitSlides);
    if (!transitSlides.length) return;

    for (const slide of transitSlides) {
      const destinations = allSlidesState[slide.id]?.destinations || [];
      console.log(destinations);
      await getDestinationData(destinations, slide.id, setDestinationData);
    }
  };

  const getFixedRouteData = async () => {
    const fixedRouteSlides = slides.filter((slide: any) => slide.type === 'fixed-routes');
    if (!fixedRouteSlides.length) return;
    for (const slide of fixedRouteSlides) {
      const fixedRouteData = allFixedRouteSlidesState[slide.id]?.selectedStop || [];
      const data = await fetchStopData(fixedRouteData.stop_id, fixedRouteData.services[0].service_id, fixedRouteData.services[0].organization_id);
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

      setScheduleData(slide.id, arr);
    }
  }

  const getTransitRoutesData = async () => {
    const transitRoutesSlides = slides.filter((slide: any) => slide.type === 'transit-routes');
    if (!transitRoutesSlides.length) return;

    for (const slide of transitRoutesSlides) {
      const transitRouteData = allTransitRouteSlidesState[slide.id]?.routes || [];
      await getDestinationData(transitRouteData, slide.id, setRoutesData);
    }
  }

  const hasFetchedDestinations = useRef(false);

  useEffect(() => {
    if (hasFetchedDestinations.current || slides.length === 0) return;
    hasFetchedDestinations.current = true;

    getTransitDestinationData();
    getFixedRouteData();
    getTransitRoutesData();

    setInterval(() => {
      getTransitDestinationData();
      getFixedRouteData();
      getTransitRoutesData();
    }, 60000 * 5);
  }, [slides]);

  useEffect(() => {
    if (isTvMode) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, isTvMode]);

  const renderSlidePreview = (type: string, slideId: string) => {
    switch (type) {
      case 'qr':
        return <QRSlidePreview slideId={slideId} />;
      case 'transit-destinations':
        return <TransitDestinationPreview slideId={slideId} mobileMode={!isTvMode}/>;
      case 'fixed-routes':
        return <FixedRoutePreview slideId={slideId} />;
      case 'template-1':
        return <Template1Preview slideId={slideId} />;
      case 'template-2':
        return <Template2Preview slideId={slideId} />;
      case 'template-3':
        return <Template3Preview slideId={slideId} />;
      case 'transit-routes':
        return <TransitRoutesPreview slideId={slideId} noMapScroll={!isTvMode}/>;
      default:
        return null;
    }
  };

  // Scrollable mode - show all slides vertically
  if (!isTvMode) {
    return (
      <div className="w-full min-h-screen bg-gray-100">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center w-full h-screen">
            <h1 className="text-2xl font-bold">Loading slides...</h1>
          </div>
        ) : (
          <div className="">
            {slides.map((slide: any, index: number) => (
              <div key={slide.id} className="w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium">
                    Slide {index + 1}: {slide.type}
                  </div>
                  <div className="w-full h-[90vh]">
                    {renderSlidePreview(slide.type, slide.id)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // TV mode - slideshow with rotation
  return (
    <div className="w-screen h-screen overflow-hidden bg-white relative">
      {/* Persistent TransitRoutesPreview */}
      <div
        className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 ${currentSlide?.type === 'transit-routes' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
          }`}
      >
        {currentSlide && currentSlide.id ? (
          <TransitRoutesPreview slideId={currentSlide.id} />
        ) : null}
      </div>

      {/* All other previews */}
      {currentSlide && currentSlide.id && currentSlide.type !== 'transit-routes' ? (
        <div className="w-full h-full z-10 relative">
          {renderSlidePreview(currentSlide.type, currentSlide.id)}
        </div>
      ) : null}

      {/* Fallback for no slide loaded */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center w-full h-full z-10">
          <h1 className="text-2xl font-bold">Loading slides...</h1>
        </div>
      )}
    </div>
  );
}