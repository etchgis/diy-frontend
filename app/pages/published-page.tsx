'use client';
import FixedRoutePreview from '@/modules/fixed-routes/preview';
import QRSlidePreview from '@/modules/qr/preview';
import Template1Preview from '@/modules/template-1/preview';
import Template2Preview from '@/modules/template-2/preview';
import Template3Preview from '@/modules/template-3/preview';
import TransitDestinationPreview from '@/modules/transit-destinations/preview';
import TransitRoutesPreview from '@/modules/transit-routes/preview';
import RouteTimesPreview from '@/modules/route-times/preview';
import ImageOnlyPreview from '@/modules/image-only/preview';
import WeatherPreview from '@/modules/weather/preview';
import { fetchWeatherData } from '@/services/data-gathering/fetchWeatherData';
import CitibikePreview from '@/modules/citibike/preview';
import { fetchCitibikeData } from '@/services/data-gathering/fetchCitibikeData';
import { fetchStopData, MAX_ARRIVALS_PER_SLIDE } from '@/services/data-gathering/fetchStopData';
import TrafficCorridorPreview from '@/modules/traffic-corridor/preview';
import WebEmbedPreview from '@/modules/web-embed/preview';
import { fetchTrafficData } from '@/services/data-gathering/fetchTrafficData';
import { useTrafficCorridorStore } from '@/modules/traffic-corridor/store';
import { getDestinationData } from '@/services/data-gathering/getDestinationData';
import { SetupSlides } from '@/services/setup';
import { useFixedRouteStore } from '@/modules/fixed-routes/store';
import { useGeneralStore } from '@/stores/general';
import { ResolutionFrame } from '@/components/resolution-frame';
import { useTransitDestinationsStore } from '@/modules/transit-destinations/store';
import { useTransitRouteStore } from '@/modules/transit-routes/store';
import { useRouteTimesStore } from '@/modules/route-times/store';
import { fetchCompleteRouteData } from '@/services/route-times/routeDataFetcher';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';


export default function PublishedPage({ shortcode }: { shortcode: string }) {
  const searchParams = useSearchParams();
  const isTvMode = searchParams.get('mode') === 'tv';

  const allSlides = useGeneralStore((state) => state.slides);
  const slides = allSlides.filter((s: any) => !s.hidden);
  const rotationInterval = useGeneralStore((state) => state.rotationInterval || 20);
  const resolution = useGeneralStore((state) => state.resolution || '1920x1080');
  const defaultFontFamily = useGeneralStore((state) => state.defaultFontFamily);

  const parseResolution = (res: string) => {
    const [w, h] = res.split('x').map(Number);
    return { w: w || 1920, h: h || 1080 };
  };
  const { w: logicalW, h: logicalH } = parseResolution(resolution);

  const fontFamilyStyle = defaultFontFamily && defaultFontFamily !== 'System Default'
    ? { fontFamily: defaultFontFamily }
    : {};
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [screens] = useState<any[]>([]);
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
  const setRouteTimesDataError = useRouteTimesStore((state) => state.setDataError);

  const shouldSkipSlide = (slide: any): boolean => {
    if (slide.type === 'transit-destinations') {
      const s = useTransitDestinationsStore.getState().slides[slide.id];
      return !!(s?.skipOnError && s?.dataError);
    }
    if (slide.type === 'fixed-routes') {
      const s = useFixedRouteStore.getState().slides[slide.id];
      return !!(s?.skipOnError && s?.dataError);
    }
    if (slide.type === 'route-times') {
      const s = useRouteTimesStore.getState().slides[slide.id];
      return !!(s?.skipOnError && s?.dataError);
    }
    return false;
  };

  const goToNextSlide = useCallback(() => {
    setActiveIndex((prev) => {
      const total = slides.length;
      for (let i = 1; i <= total; i++) {
        const nextIdx = (prev + i) % total;
        if (!shouldSkipSlide(slides[nextIdx])) return nextIdx;
      }
      return (prev + 1) % total;
    });
  }, [slides]);

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

  useEffect(() => {
    if (!isTvMode) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = '';
    };
  }, [isTvMode]);

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
        await SetupSlides(shortcode);
        setIsLoading(false);
        getTransitDestinationData();
        getFixedRouteData();
        getTransitRoutesData();
        getRouteTimesData();
        getWeatherData();
        getCitibikeData();
        getTrafficCorridorData();
      }
    };
    loadSlides();
  }, [shortcode]);

  // Log page visit for metrics
  useEffect(() => {
    if (!shortcode) return;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) return;

    const events: string[] = ['screen_view'];
    if (!isTvMode) events.push('qr_visit');

    events.forEach(event => {
      fetch(`${backendUrl}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortcode, event }),
      })
        .then(res => console.log(`[METRICS] ${event} logged — ${shortcode} — ${res.ok ? 'ok' : `failed ${res.status}`}`))
        .catch(err => console.warn(`[METRICS] ${event} log failed:`, err));
    });
  }, [shortcode, isTvMode]);

  // Heartbeat: log every 5 minutes while tab is visible
  useEffect(() => {
    if (!shortcode) return;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) return;

    const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

    const sendHeartbeat = () => {
      if (document.visibilityState !== 'visible') return;
      fetch(`${backendUrl}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortcode, event: 'heartbeat' }),
      })
        .then(res => console.log(`[METRICS] heartbeat logged — ${shortcode} — ${new Date().toLocaleTimeString()} — ${res.ok ? 'ok' : `failed ${res.status}`}`))
        .catch(err => console.warn(`[METRICS] heartbeat log failed:`, err));
    };

    const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // Resume/pause heartbeat when tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab just became visible again — send one immediately then let interval continue
        sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shortcode]);

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
      const maxWalkDistance = currentState[slide.id]?.maxWalkDistance;

      try {
        await getDestinationData(
          destinations,
          slide.id,
          setDestinationData,
          setDataError,
          currentDestinationData,
          maxWalkDistance != null ? { maxWalkDistance } : undefined
        );
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
      const selectedStop = currentState[slide.id]?.selectedStop;
      const serviceSelections = currentState[slide.id]?.serviceSelections;
      const columnMode = currentState[slide.id]?.columnMode;
      const columnServiceSelections = currentState[slide.id]?.columnServiceSelections;
      const minArrivalMinutes = currentState[slide.id]?.minArrivalMinutes ?? 0;

      if (!selectedStop?.id || !selectedStop?.services?.length || !serviceSelections?.length) {
        continue;
      }

      const queryMap = new Map<string, { serviceId: string; stopId: string; organizationId: string }>();
      const activeSelections = columnMode && columnServiceSelections
        ? [...columnServiceSelections[0], ...columnServiceSelections[1]]
        : serviceSelections;

      for (const selection of activeSelections) {
        if (!selection.enabled) continue;

        const orgId = (selection as any).organizationId
          || selectedStop.services?.find((svc: any) => svc.id === selection.serviceId)?.organizationId;

        if (!orgId) continue;

        const stopIds = selection.selectedStopId.split(',').filter(Boolean);
        for (const stopId of stopIds) {
          const key = `${selection.serviceId}:${stopId}`;
          if (!queryMap.has(key)) {
            queryMap.set(key, { serviceId: selection.serviceId, stopId, organizationId: orgId });
          }
        }
      }

      const queries = Array.from(queryMap.values());
      if (queries.length === 0) continue;

      try {
        // Fetch queries sequentially to avoid overwhelming the API
        const allArrivals: any[] = [];
        for (const q of queries) {
          try {
            const data = await fetchStopData(q.stopId, q.serviceId, q.organizationId);
            const tagged = (data?.trains || []).map((item: any) => ({
              destination: item.destination,
              routeId: item.routeId,
              routeShortName: item.routeShortName,
              routeType: item.routeType,
              routeColor: item.routeColor,
              routeTextColor: item.routeTextColor,
              time: item.arrivalTime,
              timestamp: item.arrivalTimestamp,
              duration: item.arrival,
              status: item.status,
              _sourceService: q.serviceId,
              _queryStopId: q.stopId,
            }));
            allArrivals.push(...tagged);
          } catch (err) {
            console.warn('[DATA UPDATE] Failed to fetch arrivals:', err);
          }
        }

        // Sort by arrival timestamp
        allArrivals.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        const seen = new Set<string>();
        const uniqueArrivals = allArrivals.filter(arr => {
          const key = `${arr.routeId}|${arr.destination}|${arr.timestamp}|${arr._queryStopId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Apply minimum arrival offset
        const offsetMs = minArrivalMinutes * 60 * 1000;
        const offsetArrivals = offsetMs > 0
          ? uniqueArrivals.filter(arr => (arr.timestamp || 0) - Date.now() >= offsetMs)
          : uniqueArrivals;

        let filteredArrivals: any[];
        if (columnMode && columnServiceSelections) {
          filteredArrivals = offsetArrivals;
        } else {
          const routeFiltered = offsetArrivals.filter(arr => {
            const selection = serviceSelections.find((s: any) => s.serviceId === arr._sourceService);
            if (!selection || !selection.enabledRouteIds || selection.enabledRouteIds.length === 0) return true;
            if (!arr.routeId) return true;
            return selection.enabledRouteIds.includes(arr.routeId);
          });
          filteredArrivals = routeFiltered.filter(arr => {
            const selection = serviceSelections.find((s: any) => s.serviceId === arr._sourceService);
            if (!selection?.selectedHeadsignFilters || selection.selectedHeadsignFilters.length === 0) return true;
            const destination = (arr.destination || '').toLowerCase().trim();
            return selection.selectedHeadsignFilters.some((filter: string) =>
              destination === filter.toLowerCase().trim()
            );
          });
        }

        const cap = (columnMode && columnServiceSelections) ? Infinity : MAX_ARRIVALS_PER_SLIDE;
        const limitedArrivals = cap === Infinity ? filteredArrivals : filteredArrivals.slice(0, cap);

        setScheduleData(slide.id, limitedArrivals);
        setFixedRouteDataError(slide.id, false);
        console.log(`[DATA UPDATE] Fixed route data updated for slide ${slide.id}:`, limitedArrivals);
      } catch (error) {
        console.error(`[DATA UPDATE] Error fetching fixed route data for slide ${slide.id}:`, error);
        setFixedRouteDataError(slide.id, true);
      }
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
        setRouteTimesDataError(slide.id, false);
        setRouteTimesIsLoading(slide.id, false);

        console.log(`[DATA UPDATE] Route times updated for slide ${slide.id}:`, {
          patternData: result.patternData,
          timetableData: result.timetableData,
          isNextDay: result.isNextDay,
          isLaterToday: result.isLaterToday
        });
      } catch (error) {
        console.error(`[DATA UPDATE] Error fetching route times data for slide ${slide.id}:`, error);
        setRouteTimesDataError(slide.id, true);
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

  const getTrafficCorridorData = async () => {
    console.log('[DATA UPDATE] Fetching traffic corridor data...', new Date().toLocaleTimeString());
    const currentSlides = useGeneralStore.getState().slides;
    const corridorSlides = currentSlides.filter((slide: any) => slide.type === 'traffic-corridor');

    if (!corridorSlides.length) {
      console.log('[DATA UPDATE] No traffic corridor slides found');
      return;
    }

    const generalState = useGeneralStore.getState();
    const origin = generalState.coordinates;
    if (!origin?.lat || !origin?.lng) return;
    const originCoords: [number, number] = [origin.lng, origin.lat];

    for (const slide of corridorSlides) {
      const slideState = useTrafficCorridorStore.getState().slides[slide.id];
      if (!slideState?.tables) continue;

      const tables = slideState.tables;
      const destinations = tables
        .map((t: any) => t.coordinates)
        .filter((c: any): c is [number, number] => Array.isArray(c));

      if (!destinations.length) continue;

      try {
        const results = await fetchTrafficData(originCoords, destinations);
        const newTables = tables.map((table: any, i: number) => {
          const alternatives = results[i]?.alternatives ?? [];
          const seen = new Set<string>();
          const corridors = alternatives
            .filter((alt: any) => {
              if (seen.has(alt.label)) return false;
              seen.add(alt.label);
              return true;
            })
            .slice(0, 3)
            .map((alt: any) => ({ name: alt.label, time: `${alt.minutes} min` }));
          return { ...table, corridors };
        });
        useTrafficCorridorStore.getState().setTables(slide.id, newTables);
        console.log(`[DATA UPDATE] Traffic corridor updated for slide ${slide.id}`);
      } catch (error) {
        console.error(`[DATA UPDATE] Error fetching traffic corridor data for slide ${slide.id}:`, error);
      }
    }
  };

  useEffect(() => {
    dataRefreshIntervalRef.current = setInterval(() => {
      console.log('[DATA UPDATE] ========== 60-second refresh triggered ==========');
      getTransitDestinationData();
      getFixedRouteData();
      getTransitRoutesData();
      getRouteTimesData();
      getWeatherData();
      getCitibikeData();
      getTrafficCorridorData();
    }, 60000);
    console.log('[DATA UPDATE] Auto-refresh interval started (60 seconds)');

    return () => {
      if (dataRefreshIntervalRef.current) {
        clearInterval(dataRefreshIntervalRef.current);
        dataRefreshIntervalRef.current = null;
      }
    };
  }, []);

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
      case 'traffic-corridor':
        return <TrafficCorridorPreview slideId={slideId} />;
      case 'web-embed':
        return <WebEmbedPreview slideId={slideId} />;
      default:
        return null;
    }
  };

  // Scrollable mode - show all slides vertically
  if (!isTvMode) {
    return (
      <div className="w-full min-h-screen bg-gray-100" style={fontFamilyStyle}>
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
  const webEmbedSlides = slides.filter((s: any) => s.type === 'web-embed');

  const isResponsive = resolution === 'responsive';

  const innerContent = (
    <div className="w-full h-full bg-white relative overflow-hidden">
      {/* Persistent TransitRoutesPreview */}
      <div
        className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 ${currentSlide?.type === 'transit-routes' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
          }`}
      >
        {currentSlide && currentSlide.id ? (
          <TransitRoutesPreview slideId={currentSlide.id} />
        ) : null}
      </div>

      {webEmbedSlides.map((slide: any) => (
        <div
          key={slide.id}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 ${
            currentSlide?.id === slide.id ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
          }`}
        >
          <WebEmbedPreview slideId={slide.id} />
        </div>
      ))}

      {/* All other previews */}
      {currentSlide && currentSlide.id && currentSlide.type !== 'transit-routes' && currentSlide.type !== 'web-embed' ? (
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

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      {isResponsive ? (
        <div className="w-full h-full" style={fontFamilyStyle}>{innerContent}</div>
      ) : (
        <ResolutionFrame logicalW={logicalW} logicalH={logicalH} fontFamilyStyle={fontFamilyStyle}>
          {innerContent}
        </ResolutionFrame>
      )}
    </div>
  );
}
