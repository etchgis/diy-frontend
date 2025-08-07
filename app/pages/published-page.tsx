'use client';
import FixedRoutePreview from '@/components/slide-previews/fixed-route-preview';
import QRSlidePreview from '@/components/slide-previews/qr-slide-preview';
import Template1Preview from '@/components/slide-previews/template-1-preview';
import Template2Preview from '@/components/slide-previews/template-2-preview';
import Template3Preview from '@/components/slide-previews/template-3-preview';
import TransitDestinationPreview from '@/components/slide-previews/transit-destination-preview';
import TransitRoutesPreview from '@/components/slide-previews/transit-routes-preview';
import { getDestinationData } from '@/services/data-gathering/getDestinationData';
import { SetupSlides } from '@/services/setup';
import { useGeneralStore } from '@/stores/general';
import { useTransitDestinationsStore } from '@/stores/transitDestinations';
import { useInterval } from '@dnd-kit/utilities';
import { useEffect, useState, useCallback, useRef } from 'react';

export default function PublishedPage({ shortcode }: { shortcode: string }) {
  const slides = useGeneralStore((state) => state.slides);
  const setSlides = useGeneralStore((state) => state.setSlides);
  const rotationInterval = useGeneralStore((state) => state.rotationInterval || 20);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [screens, setScreens] = useState<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = slides?.[activeIndex] || null;

  const goToNextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % slides.length);
      } else if (event.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    },
    [slides.length]
  );

  // Auto-rotation effect
  useEffect(() => {
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
  }, [slides.length, rotationInterval, goToNextSlide]);

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

  // useEffect(() => {
  //   console.log(slides);

  //   if (slides && slides[0]?.data) {
  //     const transitSlides = slides.filter(slide => slide.type === 'transit-destinations');

  //     transitSlides.forEach((slide: any) => {
  //       console.log(slide);
  //       const setDestinationData = (data: any) => {
  //         useTransitDestinationsStore.getState().setDestinationData(slide.id, data);
  //       };
  //       getDestinationData(slide.data.destinations, slide.id, setDestinationData);
  //     });
  //   }
  // }, [slides]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderSlidePreview = (type: string, slideId: string) => {
    switch (type) {
      case 'qr':
        return <QRSlidePreview slideId={slideId} />;
      case 'transit-destinations':
        return <TransitDestinationPreview slideId={slideId} />;
      case 'fixed-routes':
        return <FixedRoutePreview slideId={slideId} />;
      case 'template-1':
        return <Template1Preview slideId={slideId} />;
      case 'template-2':
        return <Template2Preview slideId={slideId} />;
      case 'template-3':
        return <Template3Preview slideId={slideId} />;
      default:
        return null;
    }
  };

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