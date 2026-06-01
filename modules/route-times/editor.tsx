import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, Plus } from 'lucide-react';
import RouteTimesPreview from './preview';
import { useEffect, useRef, useState } from 'react';
import { useRouteTimesStore } from './store';
import { useGeneralStore } from '@/stores/general';
import { useLocalSaveStatus } from '@/hooks/useLocalSaveStatus';
import { useImageUploadField } from '@/hooks/useImageUploadField';
import { fetchRoutes } from '@/services/data-gathering/fetchRoutes';
import { fetchCompleteRouteData } from '@/services/route-times/routeDataFetcher';

export default function RouteTimesSlide({
  slideId,
  handleDelete,
  handlePreview,
  handlePublish,
  handleOpenSettings,
}: {
  slideId: string,
  handleDelete: (id: string) => void,
  handlePreview: () => void,
  handlePublish: () => void
  handleOpenSettings: () => void
}) {
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeCacheRef = useRef<any[]>([]);
  const [showTimetableWarning, setShowTimetableWarning] = useState(false);

  const slideData = useRouteTimesStore((state) => state.slides[slideId]);

  const routeName = slideData?.routeName || '';
  const displayName = slideData?.displayName ?? '';
  const selectedRoute = slideData?.selectedRoute || undefined;
  const description = slideData?.description || '';
  const viewMode = slideData?.viewMode || 'map';
  const backgroundColor = slideData?.backgroundColor || '#192F51';
  const titleColor = slideData?.titleColor || '#FFFFFF';
  const tableColor = slideData?.tableColor || '#FFFFFF';
  const tableTextColor = slideData?.tableTextColor || '#000000';
  const bgImage = slideData?.bgImage || '';
  const logoImage = slideData?.logoImage || '';

  const setRouteName = useRouteTimesStore((state) => state.setRouteName);
  const setDisplayName = useRouteTimesStore((state) => state.setDisplayName);
  const setSelectedRoute = useRouteTimesStore((state) => state.setSelectedRoute);
  const setDescription = useRouteTimesStore((state) => state.setDescription);
  const setViewMode = useRouteTimesStore((state) => state.setViewMode);
  const setBackgroundColor = useRouteTimesStore((state) => state.setBackgroundColor);
  const setTitleColor = useRouteTimesStore((state) => state.setTitleColor);
  const setTableColor = useRouteTimesStore((state) => state.setTableColor);
  const setTableTextColor = useRouteTimesStore((state) => state.setTableTextColor);
  const setBgImage = useRouteTimesStore((state) => state.setBgImage);

  const outageMessage = useRouteTimesStore((state) => state.slides[slideId]?.outageMessage ?? '');
  const setOutageMessage = useRouteTimesStore((state) => state.setOutageMessage);
  const skipOnError = useRouteTimesStore((state) => state.slides[slideId]?.skipOnError ?? false);
  const setSkipOnError = useRouteTimesStore((state) => state.setSkipOnError);
  const setLogoImage = useRouteTimesStore((state) => state.setLogoImage);
  const setIsLoading = useRouteTimesStore((state) => state.setIsLoading);
  const setRouteData = useRouteTimesStore((state) => state.setRouteData);
  const setPatternData = useRouteTimesStore((state) => state.setPatternData);

  const titleTextSize = slideData?.titleTextSize || 5;
  const contentTextSize = slideData?.contentTextSize || 5;
  const setTitleTextSize = useRouteTimesStore((state) => state.setTitleTextSize);
  const setContentTextSize = useRouteTimesStore((state) => state.setContentTextSize);

  const showTitle = slideData?.showTitle !== false;
  const setShowTitle = useRouteTimesStore((state) => state.setShowTitle);

  const showFooter = useGeneralStore((state) => state.slides.find((s) => s.id === slideId)?.showFooter ?? true);
  const setShowFooter = useGeneralStore((state) => state.setShowFooter);

  const shortcode = useGeneralStore((state) => state.shortcode || '');
  const coordinates = useGeneralStore((state) => state.coordinates || { lat: 0, lng: 0 });

  const handleInputChange = (value: string) => {
    setRouteName(slideId, value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If input is empty, clear results
    if (value.trim() === '') {
      setFilteredRoutes([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const searchResults = await fetchRoutes(value);

        const merged = [...routeCacheRef.current, ...(searchResults || [])];
        const deduped = [...new Map(merged.map(r => [r.route_id, r])).values()];
        routeCacheRef.current = deduped;

        const q = value.toLowerCase();
        const cacheMatches = deduped.filter(r =>
          r.route_short_name?.toLowerCase().startsWith(q) ||
          r.route_long_name?.toLowerCase().includes(q)
        );

        if (cacheMatches.length > 0) {
          setFilteredRoutes(cacheMatches);
          setShowDropdown(true);
        } else {
          setFilteredRoutes([]);
          setShowDropdown(false);
        }
        setIsSearching(false);
      } catch (error) {
        console.error('Error searching routes:', error);
        setIsSearching(false);
        setFilteredRoutes([]);
      }
    }, 300);
  };

  const handleSelectRoute = (route: any) => {
    const routeDisplay = route.route_short_name || route.route_long_name;
    setRouteName(slideId, routeDisplay);
    setFilteredRoutes([]);
    setSelectedRoute(slideId, route);
    setShowDropdown(false);
  };

  const handleViewModeChange = (mode: 'map' | 'timetable') => {
    // Check if timetable view is appropriate
    if (mode === 'timetable' && selectedRoute) {
      // For now, we'll allow any selection but show warning
      // In production, we'd need to check actual stop count from route data
      setShowTimetableWarning(false);
    }
    setViewMode(slideId, mode);
  };

  async function fetchData(route: any) {
    try {
      setIsLoading(slideId, true);

      console.log(route);

      const result = await fetchCompleteRouteData(route);

      console.log(result);

      if (result.patternData) {
        const hadPatternDataBefore = !!slideData?.patternData;
        setPatternData(slideId, result.patternData);

        // Only auto-select view mode if this is truly a new route selection
        if (!hadPatternDataBefore) {
          // Auto-select view mode based on stop count
          const stopCount = result.patternData.stops.length;
          if (stopCount <= 5) {
            setViewMode(slideId, 'timetable');
          } else {
            setViewMode(slideId, 'map');
          }
        }
      }

      setRouteData(slideId, result.timetableData, result.isNextDay, result.isLaterToday);
      setIsLoading(slideId, false);
    } catch (error) {
      console.error('Error fetching route data:', error);
      setIsLoading(slideId, false);
    }
  }

  useEffect(() => {
    if (selectedRoute && selectedRoute.route_id) {
      fetchData(selectedRoute);
    }
  }, [selectedRoute]);

  const saveStatus = useLocalSaveStatus(useRouteTimesStore, slideId);
  const bg = useImageUploadField(shortcode, bgImage, (url) => setBgImage(slideId, url));
  const logo = useImageUploadField(shortcode, logoImage, (url) => setLogoImage(slideId, url));

  return (
    <>
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[#4a5568] mb-4">
              <span>Home</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium">Route Times Page Template</span>
            </div>

            <p className="text-[#606061] mb-6">
            This template can only accommodate a single route for both the map and list view. The list view displays the closets routes by proximity. Select a route to display stop times and route information. 
            </p>

            {/* Route Selection */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[#4a5568] font-medium mb-2">Route Selection</label>
                <div className="relative">
                  <Input
                    className="flex-1 bg-white border-[#cbd5e0]"
                    value={routeName}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => {
                      if (filteredRoutes.length > 0) {
                        setShowDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click on dropdown items
                      setTimeout(() => setShowDropdown(false), 200);
                    }}
                    placeholder="Search by route number or full name (e.g. E, 117, 8 Avenue Local…)"
                  />
                  {showDropdown && (filteredRoutes.length > 0 || isSearching) && (
                    <ul className="absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                      {isSearching && (
                        <li className="px-4 py-2 text-gray-500 italic text-sm">
                          Searching routes...
                        </li>
                      )}
                      {filteredRoutes.map((route, index) => (
                        <li
                          key={index}
                          onClick={() => handleSelectRoute(route)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black"
                        >
                          <div className="flex items-center gap-2">
                            {route.route_short_name && (
                              <span
                                className="px-2 py-1 text-xs font-bold rounded"
                                style={{
                                  backgroundColor: route.route_color ? `#${route.route_color}` : '#0074D9',
                                  color: route.route_text_color ? `#${route.route_text_color}` : '#FFFFFF',
                                }}
                              >
                                {route.route_short_name}
                              </span>
                            )}
                            <span>{route.route_long_name || route.route_desc}</span>
                            {route.services[0]?.agency_name && (
                              <span className="text-gray-500 text-sm">- {route.services[0].agency_name}</span>
                            )}
                          </div>
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

              <div>
                <label className="block text-[#4a5568] font-medium mb-2">Display Name Override</label>
                <Input
                  placeholder={selectedRoute?.route_long_name || routeName || 'Leave blank to use route name'}
                  className="bg-white border-[#cbd5e0]"
                  value={displayName}
                  onChange={(e) => setDisplayName(slideId, e.target.value)}
                />
                <p className="text-xs text-[#718096] mt-1">
                  Override the route name shown on screen. Leave blank to use the agency-provided name.
                </p>
              </div>

              {/* View Mode Toggle */}
              <div>
                <label className="block text-[#4a5568] font-medium mb-2">View Mode</label>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'outline'}
                    onClick={() => handleViewModeChange('map')}
                    className={viewMode === 'map' ? 'bg-[#face00] hover:bg-[#face00]/90 text-black' : 'hover:bg-gray-100'}
                  >
                    Map View
                  </Button>
                  <Button
                    variant={viewMode === 'timetable' ? 'default' : 'outline'}
                    onClick={() => handleViewModeChange('timetable')}
                    className={viewMode === 'timetable' ? 'bg-[#face00] hover:bg-[#face00]/90 text-black' : 'hover:bg-gray-100'}
                  >
                    Timetable View
                  </Button>
                </div>
                {showTimetableWarning && (
                  <p className="text-yellow-600 text-sm mt-2">
                    ⚠️ Timetable view works best with 5 or fewer stops. Consider using map view for better readability.
                  </p>
                )}
              </div>
            </div>

            <div className="h-[550px] rounded-lg border border-[#e2e8f0] overflow-hidden">
              <RouteTimesPreview slideId={slideId} />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 mt-4">
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePreview()}>Preview Screens</Button>
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePublish()}>Publish Screens</Button>
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
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4 overflow-y-auto">
          {/* Color Customization */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="flex items-center gap-2 text-[#4a5568] font-medium text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTitle}
                  onChange={(e) => setShowTitle(slideId, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                Show Title
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2 text-[#4a5568] font-medium text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFooter}
                  onChange={(e) => setShowFooter(slideId, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                Show Footer
              </label>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={backgroundColor} className="flex-1 text-xs" onChange={(e) => { setBackgroundColor(slideId, e.target.value); }} />
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
                    className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={titleColor} className="flex-1 text-xs" onChange={(e) => setTitleColor(slideId, e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table/List Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={tableColor}
                    onChange={(e) => setTableColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={tableColor} className="flex-1 text-xs" onChange={(e) => setTableColor(slideId, e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Table/List Text Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={tableTextColor}
                    onChange={(e) => setTableTextColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={tableTextColor} className="flex-1 text-xs" onChange={(e) => setTableTextColor(slideId, e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Image</label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden">
                  {bg.isUploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" /> : bgImage ? <img src={bgImage} alt="BG" className="w-full h-full object-cover" /> : <div className="w-4 h-4 bg-[#cbd5e0] rounded" />}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    <input type="file" accept="image/*" ref={bg.inputRef} onChange={bg.handleUpload} className="hidden" />
                    <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1" onClick={() => bg.inputRef.current?.click()}>Change</Button>
                    {bgImage && <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1" onClick={bg.handleRemove}>Remove</Button>}
                  </div>
                  {bg.uploadError && <p className="text-xs text-red-500">{bg.uploadError}</p>}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Logo Image</label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden">
                  {logo.isUploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" /> : logoImage ? <img src={logoImage} alt="Logo" className="w-full h-full object-cover" /> : <div className="w-4 h-4 bg-[#cbd5e0] rounded" />}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    <input type="file" accept="image/*" ref={logo.inputRef} onChange={logo.handleUpload} className="hidden" />
                    <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1" onClick={() => logo.inputRef.current?.click()}>Change</Button>
                    {logoImage && <Button variant="outline" size="sm" className="text-xs bg-transparent px-2 py-1" onClick={logo.handleRemove}>Remove</Button>}
                  </div>
                  {logo.uploadError && <p className="text-xs text-red-500">{logo.uploadError}</p>}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Title Text Size</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0 text-lg"
                  onClick={() => setTitleTextSize(slideId, Math.max(1, titleTextSize - 1))}
                  disabled={titleTextSize <= 1}
                >
                  −
                </Button>
                <span className="w-6 text-center text-sm font-medium">{titleTextSize}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0 text-lg"
                  onClick={() => setTitleTextSize(slideId, Math.min(10, titleTextSize + 1))}
                  disabled={titleTextSize >= 10}
                >
                  +
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Content Text Size</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0 text-lg"
                  onClick={() => setContentTextSize(slideId, Math.max(1, contentTextSize - 1))}
                  disabled={contentTextSize <= 1}
                >
                  −
                </Button>
                <span className="w-6 text-center text-sm font-medium">{contentTextSize}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0 text-lg"
                  onClick={() => setContentTextSize(slideId, Math.min(10, contentTextSize + 1))}
                  disabled={contentTextSize >= 10}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-[#4a5568] font-medium mb-3 pb-2 border-b border-[#e2e8f0] text-xs">Notifications</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[#4a5568] font-medium mb-1 text-xs">Message when data is unavailable</label>
                  <textarea
                    className="w-full border border-[#e2e8f0] rounded px-2 py-1.5 text-xs text-[#4a5568] resize-none focus:outline-none focus:border-blue-400"
                    rows={3}
                    placeholder="Live transit data is currently unavailable."
                    value={outageMessage}
                    onChange={(e) => setOutageMessage(slideId, e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`skip-on-error-rt-${slideId}`}
                    checked={skipOnError}
                    onChange={(e) => setSkipOnError(slideId, e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-500"
                  />
                  <label htmlFor={`skip-on-error-rt-${slideId}`} className="text-xs text-[#4a5568]">Skip this slide when data is unavailable</label>
                </div>
              </div>
            </div>

            <div className="mt-auto">
          <Button className="w-full bg-[#e2e8f0] hover:bg-[#cbd5e0] text-[#4a5568] font-medium text-xs mt-2" onClick={handleOpenSettings}>
            Screen Settings
          </Button>

              <Button className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2" onClick={() => { handleDelete(slideId); }}>
                Delete Screen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
