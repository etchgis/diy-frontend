'use client';
import FixedRoutePreview from '@/components/slide-previews/fixed-route-preview';
import QRSlidePreview from '@/components/slide-previews/qr-slide-preview';
import Template1Preview from '@/components/slide-previews/template-1-preview';
import Template2Preview from '@/components/slide-previews/template-2-preview';
import Template3Preview from '@/components/slide-previews/template-3-preview';
import TransitDestinationPreview from '@/components/slide-previews/transit-destination-preview';
import TransitRoutesPreview from '@/components/slide-previews/transit-routes-preview';
import RouteTimesPreview from '@/components/slide-previews/route-times-preview';
import ImageOnlyPreview from '@/components/slide-previews/image-only-preview';
import WeatherPreview from '@/components/slide-previews/weather-preview';
import { fetchWeatherData } from '@/services/data-gathering/fetchWeatherData';
import CitibikePreview from '@/components/slide-previews/citibike-preview';
import { fetchCitibikeData } from '@/services/data-gathering/fetchCitibikeData';
import { fetchStopData } from '@/services/data-gathering/fetchStopData';
import { getDestinationData } from '@/services/data-gathering/getDestinationData';
import { SetupSlides } from '@/services/setup';
import { useFixedRouteStore } from '@/stores/fixedRoute';
import { useGeneralStore } from '@/stores/general';
import { useTransitDestinationsStore } from '@/stores/transitDestinations';
import { useTransitRouteStore } from '@/stores/transitRoutes';
import { useRouteTimesStore } from '@/stores/routeTimes';
import { fetchCompleteRouteData } from '@/services/route-times/routeDataFetcher';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { set } from 'react-hook-form';

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
  const dataRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = slides?.[activeIndex] || null;

  const setDestinationData = useTransitDestinationsStore((state) => state.setDestinationData);
  const setDataError = useTransitDestinationsStore((state) => state.setDataError);


  const setScheduleData = useFixedRouteStore((state) => state.setScheduleData);
  const setFixedRouteDataError = useFixedRouteStore((state) => state.setDataError);

  const setTransitRoutesDataError = useTransitRouteStore((state) => state.setDataError);

  const setRoutesData = useTransitRouteStore((state) => state.setRoutes);
  const setRouteTimesPatternData = useRouteTimesStore((state) => state.setPatternData);
  const setRouteTimesRouteData = useRouteTimesStore((state) => state.setRouteData);
  const setRouteTimesIsLoading = useRouteTimesStore((state) => state.setIsLoading);

  const goToNextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isTvMode) {return;} // Only handle keyboard navigation in TV mode

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
    if (!isTvMode) {return;}

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

  // Function and useEffect to fetch transit destination data every 60 seconds
  const getTransitDestinationData = async () => {
    console.log('[DATA UPDATE] Fetching transit destination data...', new Date().toLocaleTimeString());
    // Get current slides from store to avoid stale closure
    const currentSlides = useGeneralStore.getState().slides;
    const transitSlides = currentSlides.filter((slide: any) => slide.type === 'transit-destinations');

    if (!transitSlides.length) {
      console.log('[DATA UPDATE] No transit destination slides found');
      return;
    }

    for (const slide of transitSlides) {
      const currentState = useTransitDestinationsStore.getState().slides;
      const destinations = currentState[slide.id]?.destinations || [];
      const currentDestinationData = currentState[slide.id]?.destinationData || [];

      try {
        await getDestinationData(destinations, slide.id, setDestinationData, setDataError, currentDestinationData);
        const updatedState = useTransitDestinationsStore.getState().slides;
        const updatedData = updatedState[slide.id]?.destinationData || [];
        console.log(`[DATA UPDATE] Transit destinations updated for slide ${slide.id}:`, updatedData);
      } catch (error) {
        console.error(`[DATA UPDATE] Failed to fetch data for slide ID ${slide.id}:`, error);
      }
    }
  };

  const getFixedRouteData = async () => {
    console.log('[DATA UPDATE] Fetching fixed route data...', new Date().toLocaleTimeString());
    // Get current slides from store to avoid stale closure
    const currentSlides = useGeneralStore.getState().slides;
    const fixedRouteSlides = currentSlides.filter((slide: any) => slide.type === 'fixed-routes');

    if (!fixedRouteSlides.length) {
      console.log('[DATA UPDATE] No fixed route slides found');
      return;
    }

    for (const slide of fixedRouteSlides) {
      const currentState = useFixedRouteStore.getState().slides;
      const fixedRouteData = currentState[slide.id]?.selectedStop || [];
      if(!fixedRouteData?.stop_id || !fixedRouteData?.services?.length) {continue;}
      const data = await fetchStopData(fixedRouteData.stop_id, fixedRouteData.services[0].service_guid, fixedRouteData.services[0].organization_guid, slide.id, setFixedRouteDataError);
      const arr: any = [];
      data?.trains.forEach((item: any) => {
        arr.push({
          destination: item.destination,
          route: item.details.id,
          routeId: item.routeId,
          routeColor: item.details.color,
          routeTextColor: item.details.textColor,
          time: item.arrivalTime,
          duration: item.arrival,
          status: item.status,
        });
      });

      setScheduleData(slide.id, arr);
      console.log(`[DATA UPDATE] Fixed route data updated for slide ${slide.id}:`, arr);
    }
  };

  const getTransitRoutesData = async () => {
    console.log('[DATA UPDATE] Fetching transit routes data...', new Date().toLocaleTimeString());
    // Get current slides from store to avoid stale closure
    const currentSlides = useGeneralStore.getState().slides;
    const transitRoutesSlides = currentSlides.filter((slide: any) => slide.type === 'transit-routes');

    if (!transitRoutesSlides.length) {
      console.log('[DATA UPDATE] No transit routes slides found');
      return;
    }

    for (const slide of transitRoutesSlides) {
      const currentState = useTransitRouteStore.getState().slides;
      const transitRouteData = currentState[slide.id]?.routes || [];
      await getDestinationData(transitRouteData, slide.id, setRoutesData, setTransitRoutesDataError);
      const updatedState = useTransitRouteStore.getState().slides;
      const updatedData = updatedState[slide.id]?.routes || [];
      console.log(`[DATA UPDATE] Transit routes updated for slide ${slide.id}:`, updatedData);
    }
  };

  const getRouteTimesData = async () => {
    console.log('[DATA UPDATE] Fetching route times data...', new Date().toLocaleTimeString());
    // Get current slides from store to avoid stale closure
    const currentSlides = useGeneralStore.getState().slides;
    const routeTimesSlides = currentSlides.filter((slide: any) => slide.type === 'route-times');

    if (!routeTimesSlides.length) {
      console.log('[DATA UPDATE] No route times slides found');
      return;
    }

    for (const slide of routeTimesSlides) {
      const currentState = useRouteTimesStore.getState().slides;
      const slideData = currentState[slide.id];
      if (!slideData?.selectedRoute) {continue;}

      try {
        setRouteTimesIsLoading(slide.id, true);

        const result = await fetchCompleteRouteData(slideData.selectedRoute);

        if (result.patternData) {
          setRouteTimesPatternData(slide.id, result.patternData);
        }

        setRouteTimesRouteData(slide.id, result.timetableData, result.isNextDay, result.isLaterToday);
        setRouteTimesIsLoading(slide.id, false);

        console.log(`[DATA UPDATE] Route times updated for slide ${slide.id}:`, {
          patternData: result.patternData,
          timetableData: result.timetableData,
          isNextDay: result.isNextDay,
          isLaterToday: result.isLaterToday
        });
      } catch (error) {
        console.error(`[DATA UPDATE] Error fetching route times data for slide ${slide.id}:`, error);
        setRouteTimesIsLoading(slide.id, false);
      }
    }
  };

  const getWeatherData = async () => {
    console.log('[DATA UPDATE] Fetching weather data...', new Date().toLocaleTimeString());
    const currentSlides = useGeneralStore.getState().slides;
    const weatherSlides = currentSlides.filter((slide: any) => slide.type === 'weather');

    if (!weatherSlides.length) {
      console.log('[DATA UPDATE] No weather slides found');
      return;
    }

    for (const slide of weatherSlides) {
      try {
        await fetchWeatherData(slide.id);
        console.log(`[DATA UPDATE] Weather data updated for slide ${slide.id}`);
      } catch (error) {
        console.error(`[DATA UPDATE] Error fetching weather data for slide ${slide.id}:`, error);
      }
    }
  };

  const getCitibikeData = async () => {
    console.log('[DATA UPDATE] Fetching citibike data...', new Date().toLocaleTimeString());
    const currentSlides = useGeneralStore.getState().slides;
    const citibikeSlides = currentSlides.filter((slide: any) => slide.type === 'citibike');

    if (!citibikeSlides.length) {
      console.log('[DATA UPDATE] No citibike slides found');
      return;
    }

    for (const slide of citibikeSlides) {
      try {
        await fetchCitibikeData(slide.id);
        console.log(`[DATA UPDATE] Citibike data updated for slide ${slide.id}`);
      } catch (error) {
        console.error(`[DATA UPDATE] Error fetching citibike data for slide ${slide.id}:`, error);
      }
    }
  };

  const hasFetchedDestinations = useRef(false);

  useEffect(() => {
    if (slides.length === 0) {return;}

    // Only fetch initially if we haven't fetched yet
    if (!hasFetchedDestinations.current) {
      hasFetchedDestinations.current = true;
      console.log('[DATA UPDATE] Initial data fetch on page load');
      getTransitDestinationData();
      getFixedRouteData();
      getTransitRoutesData();
      getRouteTimesData();
      getWeatherData();
      getCitibikeData();
    }

    // Only set up interval if it doesn't exist
    if (!dataRefreshIntervalRef.current) {
      dataRefreshIntervalRef.current = setInterval(() => {
        console.log('[DATA UPDATE] ========== 60-second refresh triggered ==========');
        getTransitDestinationData();
        getFixedRouteData();
        getTransitRoutesData();
        getRouteTimesData();
        getWeatherData();
        getCitibikeData();
      }, 60000);
      console.log('[DATA UPDATE] Auto-refresh interval started (60 seconds)');
    }

    return () => {
      // Only clear on unmount, not on re-renders
      if (dataRefreshIntervalRef.current) {
        console.log('[DATA UPDATE] Auto-refresh interval cleared (component unmounting)');
        clearInterval(dataRefreshIntervalRef.current);
        dataRefreshIntervalRef.current = null;
      }
    };
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
      case 'image-only':
        return <ImageOnlyPreview slideId={slideId} />;
      case 'weather':
        return <WeatherPreview slideId={slideId} />;
      case 'citibike':
        return <CitibikePreview slideId={slideId} />;
      case 'transit-routes':
        return <TransitRoutesPreview slideId={slideId} noMapScroll={!isTvMode}/>;
      case 'route-times':
        return <RouteTimesPreview slideId={slideId} />;
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
