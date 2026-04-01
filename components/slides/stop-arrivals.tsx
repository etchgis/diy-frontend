import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  HelpCircle,
  ChevronRight,
  Plus,
  ExternalLink,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import FixedRoutePreview from "../slide-previews/fixed-route-preview";
import { useEffect, useRef, useState, useCallback } from "react";
import { useFixedRouteStore, ServiceSelection, DirectionOption } from "../../stores/fixedRoute";
import { deleteImage } from "@/services/deleteImage";
import { uploadImage } from "@/services/uploadImage";
import { useGeneralStore } from "@/stores/general";
import { fetchAllStops } from "@/services/data-gathering/fetchAllStops";
import { fetchStopData, MAX_ARRIVALS_PER_SLIDE } from "@/services/data-gathering/fetchStopData";
import { calculateDistance, formatDistance } from "@/utils/distance";

// Stable empty array reference for Zustand selector
const EMPTY_SERVICE_SELECTIONS: ServiceSelection[] = [];

const MAX_VISIBLE_SERVICES = 3;
const MAX_DISPLAYED_ROUTES = 6;

// Helper to deduplicate routes by route_id across all services
function getUniqueRoutes(services: any[]): any[] {
  const allRoutes = services?.flatMap((svc: any) => svc.routes || []) || [];
  return allRoutes.filter((route: any, idx: number) =>
    allRoutes.findIndex((r: any) => r.route_id === route.route_id) === idx
  );
}

// Compute direction options for a specific service using its _stopIds
// enabledRouteIds filters which routes' headsigns to include (undefined = all routes)
function computeDirectionOptions(
  service: any,
  _allStopsArray: any[],
  enabledRouteIds?: string[]
): DirectionOption[] {
  const stopIds: string[] = service._stopIds || [];

  if (stopIds.length === 0) {
    return [{ stop_id: '', label: 'All Directions', isAllDirections: true }];
  }

  // Separate parent stations from directional stops
  const parentStopIds: string[] = [];
  const directionalByLabel = new Map<string, string[]>(); // label -> [stop_ids]

  for (const stopId of stopIds) {
    // Check if this is a directional stop (ends with N/S/E/W)
    const match = stopId.match(/([NSEW])$/);
    if (match) {
      const suffix = match[1];
      const suffixMap: Record<string, string> = {
        'N': 'Northbound',
        'S': 'Southbound',
        'E': 'Eastbound',
        'W': 'Westbound'
      };
      const label = suffixMap[suffix];
      if (!directionalByLabel.has(label)) {
        directionalByLabel.set(label, []);
      }
      directionalByLabel.get(label)!.push(stopId);
    } else {
      parentStopIds.push(stopId);
    }
  }

  const options: DirectionOption[] = [];

  // If we have directional stops (N/S/E/W suffixes), offer direction options
  if (directionalByLabel.size > 0) {
    // Always use the actual directional stop IDs for "All Directions"
    const allDirStopIds = Array.from(directionalByLabel.values()).flat();

    // Only offer direction choice if there are 2+ distinct directions.
    if (directionalByLabel.size < 2) {
      return [{
        stop_id: allDirStopIds.join(','),
        label: 'All Directions',
        isAllDirections: true
      }];
    }

    options.push({
      stop_id: allDirStopIds.join(','),
      label: 'All Directions',
      isAllDirections: true
    });

    // Add each unique direction with all its stop_ids combined
    for (const [label, dirStopIds] of directionalByLabel) {
      options.push({
        stop_id: dirStopIds.join(','),
        label,
        isAllDirections: false
      });
    }
    return options;
  }

  // No N/S/E/W suffixes - try route-based direction options using _stopIdData
  const stopIdData = service._stopIdData as Record<string, { routes: any[], location_type: number }> | undefined;
  if (stopIdData && Object.keys(stopIdData).length > 1) {
    // Group stop_ids by route destination
    const routeDestinations = new Map<string, string[]>(); // destination label -> [stop_ids]
    const parentStationIds: string[] = [];  // Collect ALL parent stations

    for (const stopId of stopIds) {
      const data = stopIdData[stopId];

      // Check if this is a parent station
      if (data?.location_type === 1) {
        parentStationIds.push(stopId);  // Collect all parent stations, not just the last one
        continue; // Parent stations get used for "All", not their own option
      }

      // Group by route - use route_short_name or route_id as the grouping key
      const routes = data?.routes || [];
      if (routes.length > 0) {
        const route = routes[0];
        // Use route short name as the label (e.g., "PATH", "A", "7")
        const routeLabel = route.route_short_name || route.route_id;

        if (routeLabel) {
          if (!routeDestinations.has(routeLabel)) {
            routeDestinations.set(routeLabel, []);
          }
          routeDestinations.get(routeLabel)!.push(stopId);
        }
      }
    }

    // If we found multiple destinations, create route-based options
    if (routeDestinations.size > 1) {
      // "All" option uses ALL parent stations if available, otherwise all child stop_ids
      const allStopIds = parentStationIds.length > 0
        ? parentStationIds
        : Array.from(routeDestinations.values()).flat();

      options.push({
        stop_id: allStopIds.join(','),
        label: 'All',
        isAllDirections: true
      });

      // Add each destination as an option
      for (const [destination, destStopIds] of routeDestinations) {
        options.push({
          stop_id: destStopIds.join(','),
          label: destination,
          isAllDirections: false
        });
      }
      return options;
    }
  }

  // Try headsign-based direction options (e.g., "Jamaica", "Hempstead" for buses)
  // This works when a single stop serves multiple destinations
  const stopIdDataWithHeadsigns = service._stopIdData as Record<string, { routes: any[], headsigns_by_route?: Record<string, string[]>, location_type: number }> | undefined;
  if (stopIdDataWithHeadsigns && stopIds.length > 0) {
    // Collect unique headsigns from enabled routes only
    // Use Map to deduplicate by lowercase key while preserving original for display
    const headsignMap = new Map<string, string>(); // lowercase -> original
    for (const stopId of stopIds) {
      const data = stopIdDataWithHeadsigns[stopId];
      if (data?.headsigns_by_route) {
        for (const [routeId, headsigns] of Object.entries(data.headsigns_by_route)) {
          // Only include headsigns from enabled routes (or all if no filter)
          if (!enabledRouteIds || enabledRouteIds.includes(routeId)) {
            for (const headsign of headsigns) {
              const key = headsign.toLowerCase().trim();
              if (!headsignMap.has(key)) {
                headsignMap.set(key, headsign);
              }
            }
          }
        }
      }
    }

    // If we have multiple headsigns, offer them as direction options
    if (headsignMap.size > 1) {
      options.push({
        stop_id: stopIds.join(','),
        label: 'All Directions',
        isAllDirections: true
      });

      // Add each headsign as a direction option (sorted by original label)
      const sortedHeadsigns = Array.from(headsignMap.values()).sort();
      for (const headsign of sortedHeadsigns) {
        options.push({
          stop_id: stopIds.join(','),
          label: headsign,
          isAllDirections: false,
          headsignFilter: headsign.toLowerCase().trim()  // Normalized for filtering
        });
      }
      return options;
    }
  }

  // Fallback: no directional options available, just use all stop_ids
  options.push({
    stop_id: stopIds.join(','),
    label: 'All Directions',
    isAllDirections: true
  });

  return options;
}

// Deduplicate stops by stop_name for search dropdown
// This merges all platforms/directions of the same station into one entry
function deduplicateStops(stops: any[]): any[] {
  const stopMap = new Map<string, any>();

  for (const stop of stops) {
    // Use stop_name as the key so all "Grand Central-42 St" entries merge into one
    const key = stop.stop_name;
    if (stopMap.has(key)) {
      // Merge services into existing stop
      const existing = stopMap.get(key);
      for (const service of stop.services || []) {
        const existingServiceIdx = existing.services.findIndex(
          (s: any) => s.service_guid === service.service_guid
        );
        if (existingServiceIdx === -1) {
          // New service - add it (clone to avoid mutation)
          existing.services.push({
            ...service,
            routes: service.routes ? [...service.routes] : [],
            _stopIds: [stop.stop_id],  // Track which stop_ids this service uses
            _stopIdData: {  // Track per-stop_id metadata for direction options
              [stop.stop_id]: {
                routes: service.routes ? [...service.routes] : [],
                headsigns_by_route: service.headsigns_by_route ? { ...service.headsigns_by_route } : undefined,
                location_type: stop.location_type
              }
            }
          });
        } else {
          // Same service - merge routes arrays and stop_ids
          const existingService = existing.services[existingServiceIdx];
          if (!existingService.routes) {
            existingService.routes = [];
          }
          for (const route of service.routes || []) {
            if (!existingService.routes.some((r: any) => r.route_id === route.route_id)) {
              existingService.routes.push(route);
            }
          }
          // Track stop_ids for this service
          if (!existingService._stopIds) {
            existingService._stopIds = [];
          }
          if (!existingService._stopIds.includes(stop.stop_id)) {
            existingService._stopIds.push(stop.stop_id);
          }
          // Track per-stop_id metadata
          if (!existingService._stopIdData) {
            existingService._stopIdData = {};
          }
          existingService._stopIdData[stop.stop_id] = {
            routes: service.routes ? [...service.routes] : [],
            headsigns_by_route: service.headsigns_by_route ? { ...service.headsigns_by_route } : undefined,
            location_type: stop.location_type
          };
        }
      }
      // Collect all related stop_ids for direction computation later
      if (!existing._allStopIds) {
        existing._allStopIds = [existing.stop_id];
      }
      if (!existing._allStopIds.includes(stop.stop_id)) {
        existing._allStopIds.push(stop.stop_id);
      }
      // Prefer version with location_type = 1 (parent station)
      if (stop.location_type === 1) {
        existing.stop_id = stop.stop_id;
        existing.location_type = stop.location_type;
        existing.unique_stop_id = stop.unique_stop_id;
      }
    } else {
      // Clone to avoid mutating original
      const clonedServices = (stop.services || []).map((s: any) => ({
        ...s,
        routes: s.routes ? [...s.routes] : [],
        _stopIds: [stop.stop_id],
        _stopIdData: {
          [stop.stop_id]: {
            routes: s.routes ? [...s.routes] : [],
            headsigns_by_route: s.headsigns_by_route ? { ...s.headsigns_by_route } : undefined,
            location_type: stop.location_type
          }
        }
      }));
      stopMap.set(key, {
        ...stop,
        services: clonedServices,
        _allStopIds: [stop.stop_id]
      });
    }
  }

  // Deduplicate services with identical routes (e.g., MTA regular vs supplemented feeds)
  for (const stop of stopMap.values()) {
    const uniqueServices: any[] = [];
    const seenRouteKeys = new Set<string>();

    for (const service of stop.services) {
      // Create a key from sorted route IDs
      const routeKey = (service.routes || [])
        .map((r: any) => r.route_id)
        .sort()
        .join(',');

      if (!seenRouteKeys.has(routeKey)) {
        seenRouteKeys.add(routeKey);
        uniqueServices.push(service);
      } else {
        // Merge _stopIds and _stopIdData into the existing service with same routes
        const existingService = uniqueServices.find(s => {
          const existingKey = (s.routes || []).map((r: any) => r.route_id).sort().join(',');
          return existingKey === routeKey;
        });
        if (existingService && service._stopIds) {
          for (const stopId of service._stopIds) {
            if (!existingService._stopIds.includes(stopId)) {
              existingService._stopIds.push(stopId);
            }
          }
          // Merge _stopIdData
          if (service._stopIdData) {
            if (!existingService._stopIdData) {
              existingService._stopIdData = {};
            }
            Object.assign(existingService._stopIdData, service._stopIdData);
          }
        }
      }
    }
    stop.services = uniqueServices;
  }

  return Array.from(stopMap.values());
}

export default function StopArrivalsSlide({
  slideId,
  handleDelete,
  handlePreview,
  handlePublish,
}: {
  slideId: string;
  handleDelete: (id: string) => void;
  handlePreview: () => void;
  handlePublish: () => void;
}) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const allStopsRefreshedRef = useRef(false);
  const [isBgUploading, setIsBgUploading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const renderCount = useRef(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [allStops, setAllStops] = useState<any[]>([]);
  const [filteredStops, setFilteredStops] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [nearbyStops, setNearbyStops] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [complexStops, setComplexStops] = useState<any[]>([]); // Stops in same station complex

  const stopName = useFixedRouteStore(
    (state) => state.slides[slideId]?.stopName || ""
  );
  const setStopName = useFixedRouteStore((state) => state.setStopName);

  const selectedStop = useFixedRouteStore(
    (state) => state.slides[slideId]?.selectedStop || undefined
  );
  const setSelectedStop = useFixedRouteStore((state) => state.setSelectedStop);

  const serviceSelections = useFixedRouteStore(
    (state) => state.slides[slideId]?.serviceSelections ?? EMPTY_SERVICE_SELECTIONS
  );
  const setServiceSelections = useFixedRouteStore((state) => state.setServiceSelections);

  const [servicesExpanded, setServicesExpanded] = useState(false);

  const description = useFixedRouteStore(
    (state) => state.slides[slideId]?.description || ""
  );
  const setDescription = useFixedRouteStore((state) => state.setDescription);

  const backgroundColor = useFixedRouteStore(
    (state) => state.slides[slideId]?.backgroundColor || "#192F51"
  );
  const setBackgroundColor = useFixedRouteStore(
    (state) => state.setBackgroundColor
  );

  const titleColor = useFixedRouteStore(
    (state) => state.slides[slideId]?.titleColor || "#FFFFFF"
  );
  const setTitleColor = useFixedRouteStore((state) => state.setTitleColor);

  const tableColor = useFixedRouteStore(
    (state) => state.slides[slideId]?.tableColor || "#FFFFFF"
  );
  const setTableColor = useFixedRouteStore((state) => state.setTableColor);

  const tableTextColor = useFixedRouteStore(
    (state) => state.slides[slideId]?.tableTextColor || "#000000"
  );
  const setTableTextColor = useFixedRouteStore(
    (state) => state.setTableTextColor
  );

  const bgImage = useFixedRouteStore(
    (state) => state.slides[slideId]?.bgImage || ""
  );
  const setBgImage = useFixedRouteStore((state) => state.setBgImage);

  const logoImage = useFixedRouteStore(
    (state) => state.slides[slideId]?.logoImage || ""
  );
  const setLogoImage = useFixedRouteStore((state) => state.setLogoImage);

  const titleTextSize = useFixedRouteStore(
    (state) => state.slides[slideId]?.titleTextSize || 5
  );
  const setTitleTextSize = useFixedRouteStore((state) => state.setTitleTextSize);

  const contentTextSize = useFixedRouteStore(
    (state) => state.slides[slideId]?.contentTextSize || 5
  );
  const setContentTextSize = useFixedRouteStore((state) => state.setContentTextSize);

  const showTitle = useFixedRouteStore(
    (state) => state.slides[slideId]?.showTitle !== false
  );
  const setShowTitle = useFixedRouteStore((state) => state.setShowTitle);

  const setIsLoading = useFixedRouteStore((state) => state.setIsLoading);

  const shortcode = useGeneralStore((state) => state.shortcode || "");
  const coordinates = useGeneralStore(
    (state) => state.coordinates || { lat: 0, lng: 0 }
  );

  const setScheduleData = useFixedRouteStore((state) => state.setScheduleData);

  useEffect(() => {
    // Fetch stops within 5km by default
    fetchAllStops({ coordinates, radius: 5000 })
      .then((stops) => {
        setAllStops(stops);

        // Calculate and sort stops by distance, show top 10 nearby stops
        if (coordinates.lat && coordinates.lng) {
          const stopsWithDistance = stops.map((stop: any) => ({
            ...stop,
            distance: calculateDistance(
              coordinates.lat,
              coordinates.lng,
              stop.stop_lat,
              stop.stop_lon
            ),
          }));

          const sortedStops = stopsWithDistance
            .sort((a: any, b: any) => a.distance - b.distance)
            .slice(0, 10);

          setNearbyStops(sortedStops);
          setFilteredStops(sortedStops);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch stops:", err);
      });
  }, [coordinates]);

  const handleInputChange = (value: string) => {
    setStopName(slideId, value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If input is empty, show nearby stops immediately
    if (value.trim() === "") {
      setFilteredStops(nearbyStops);
      setShowDropdown(nearbyStops.length > 0);
      setIsSearching(false);
      return;
    }

    // For non-empty input, first do local filtering for immediate feedback
    const localFiltered = allStops.filter((stop) =>
      stop.stop_name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredStops(localFiltered);
    setShowDropdown(localFiltered.length > 0);

    // Only do API search if 3 or more characters are entered
    if (value.trim().length < 3) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const localResultsCount = localFiltered.length;
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const searchResults = await fetchAllStops({
          coordinates,
          radius: 1000000, // TODO comment out: no distance restriction for text search
          search: value,
        });

        if (searchResults && searchResults.length > 0) {
          const resultsWithDistance = searchResults.map((stop: any) => ({
            ...stop,
            distance: calculateDistance(
              coordinates.lat,
              coordinates.lng,
              stop.stop_lat,
              stop.stop_lon
            ),
          }));

          resultsWithDistance.sort((a: any, b: any) => a.distance - b.distance);

          setFilteredStops(resultsWithDistance);
          setShowDropdown(true);
        } else {
          console.log("No API results found for:", value);
          // only hide dropdown if local also had no results
          if (localResultsCount === 0) {
            setShowDropdown(false);
          }
        }
        setIsSearching(false);
      } catch (error) {
        console.error("Error searching stops:", error);
        setIsSearching(false);
        // Keep the local filtered results on error
      }
    }, 300); // 300ms debounce delay
  };

  const handleSelectStop = (stop: any) => {
    setStopName(slideId, stop.stop_name);
    setFilteredStops([]);
    setSelectedStop(slideId, stop);
    setShowDropdown(false);

    // Initialize service selections - all enabled by default
    const selections: ServiceSelection[] = (stop.services || []).map((service: any) => {
      const directionOptions = computeDirectionOptions(service, allStops);
      const defaultStopId = directionOptions.find(o => o.isAllDirections)?.stop_id
        || directionOptions[0]?.stop_id
        || stop.stop_id;

      return {
        service_guid: service.service_guid,
        agency_name: service.agency_name,
        routes: service.routes,
        enabled: true,  // All enabled by default
        selectedStopId: defaultStopId,
        directionOptions,
        enabledRouteIds: service.routes?.map((r: any) => r.route_id) || []
      };
    });

    setServiceSelections(slideId, selections);

    // Use complex_stops directly from the API response (full stop objects, already deduped by stop_name)
    if (stop.complex_stops && stop.complex_stops.length > 0) {
      setComplexStops(stop.complex_stops);
    } else {
      setComplexStops([]);
    }
  };

  const handleAddStop = () => {
    if (selectedStop) {
      // Perform any additional logic with the selected stop
    }
  };

  // Add services from a complex stop to the current selections
  // Merges headsigns from the complex stop into existing services with matching service_guid
  const handleAddComplexStop = (complexStop: any) => {
    const updatedSelections = [...serviceSelections];
    let anyMerged = false;

    for (const complexService of complexStop.services || []) {
      const serviceGuid = complexService.service_guid;
      if (!serviceGuid) {
        console.warn('Skipping complex service without service_guid');
        continue;
      }

      // Find existing selection with matching service_guid
      const existingIndex = updatedSelections.findIndex(
        s => s.service_guid === serviceGuid
      );

      if (existingIndex !== -1) {
        // Merge: add complex stop's headsigns to this service's _stopIdData
        const existing = updatedSelections[existingIndex];

        // Find the original service in selectedStop to get its _stopIdData
        const originalService = selectedStop?.services?.find(
          (s: any) => s.service_guid === serviceGuid
        );

        // Build enriched service with merged headsigns
        const baseStopId = selectedStop?.stop_id || 'unknown';
        const enrichedService = {
          ...originalService,
          _stopIds: originalService?._stopIds ? [...originalService._stopIds] : [baseStopId],
          _stopIdData: originalService?._stopIdData ? { ...originalService._stopIdData } : {
            [baseStopId]: {
              routes: originalService?.routes || [],
              headsigns_by_route: originalService?.headsigns_by_route,
              location_type: selectedStop?.location_type
            }
          }
        };

        // Add the complex stop's headsigns
        if (!enrichedService._stopIds.includes(complexStop.stop_id)) {
          enrichedService._stopIds.push(complexStop.stop_id);
        }
        enrichedService._stopIdData[complexStop.stop_id] = {
          routes: complexService.routes || originalService?.routes || [],
          headsigns_by_route: complexService.headsigns_by_route,
          location_type: complexStop.location_type || 0
        };

        // Recompute direction options with merged data
        const newDirOptions = computeDirectionOptions(enrichedService, allStops, existing.enabledRouteIds);
        const defaultStopId = newDirOptions.find(o => o.isAllDirections)?.stop_id
          || newDirOptions[0]?.stop_id
          || existing.selectedStopId;

        updatedSelections[existingIndex] = {
          ...existing,
          directionOptions: newDirOptions,
          selectedStopId: defaultStopId
        };
        anyMerged = true;
      } else {
        // New service - add it
        const directionOptions = computeDirectionOptions(complexService, allStops);
        const defaultStopId = directionOptions.find(o => o.isAllDirections)?.stop_id
          || directionOptions[0]?.stop_id
          || complexStop.stop_id;

        updatedSelections.push({
          service_guid: serviceGuid,
          agency_name: complexService.agency_name,
          routes: complexService.routes,
          enabled: true,
          selectedStopId: defaultStopId,
          directionOptions,
          enabledRouteIds: complexService.routes?.map((r: any) => r.route_id) || []
        });
        anyMerged = true;
      }
    }

    if (anyMerged) {
      setServiceSelections(slideId, updatedSelections);
    }

    // Remove this stop from complex stops list
    setComplexStops(complexStops.filter(s => s.stop_name !== complexStop.stop_name));
  };

  const fetchData = useCallback(async () => {
    if (!selectedStop || !serviceSelections?.length) return;

    // Build queries from enabled service selections
    // selectedStopId can be comma-separated (e.g., "631N,723N,901N")
    const queries: { service_guid: string; stop_id: string; organization_guid: string }[] = [];

    for (const selection of serviceSelections) {
      if (!selection.enabled) continue;

      const orgGuid = selectedStop.services?.find(
        (svc: any) => svc.service_guid === selection.service_guid
      )?.organization_guid;

      // Skip if we can't find the organization_guid
      if (!orgGuid) {
        console.warn(`[StopArrivals] Could not find organization_guid for service ${selection.service_guid}`);
        continue;
      }

      // Split comma-separated stop_ids into individual queries
      const stopIds = selection.selectedStopId.split(',').filter(Boolean);
      for (const stopId of stopIds) {
        queries.push({
          service_guid: selection.service_guid,
          stop_id: stopId,
          organization_guid: orgGuid
        });
      }
    }

    if (queries.length === 0) return;

    setIsLoading(slideId, true);

    try {
      // Fetch all in parallel with partial failure resilience
      const results = await Promise.allSettled(
        queries.map(async (q) => {
          const data = await fetchStopData(
            q.stop_id,
            q.service_guid,
            q.organization_guid
          );
          // Tag each arrival with its source service
          return (data?.trains || []).map((item: any) => ({
            destination: item.destination,
            routeId: item.routeId,              // GTFS route_id for filtering
            routeShortName: item.routeShortName,  // Display name for UI
            routeType: item.routeType,
            routeColor: item.routeColor,
            routeTextColor: item.routeTextColor,
            time: item.arrivalTime,
            timestamp: item.arrivalTimestamp,  // Raw timestamp for sorting
            duration: item.arrival,
            status: item.status,
            _sourceService: q.service_guid
          }));
        })
      );

      // Collect successful results, log failures
      const allArrivals: any[] = [];
      let serverErrorCount = 0;
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allArrivals.push(...result.value);
        } else {
          serverErrorCount++;
          console.warn('[StopArrivals] Failed to fetch arrivals:', result.reason);
        }
      }

      // Show error only if every query hit a server error (5xx/timeout)
      if (serverErrorCount > 0 && serverErrorCount === results.length) {
        useFixedRouteStore.getState().setDataError(slideId, true);
        return;
      }

      // Sort by arrival timestamp
      allArrivals.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      // Deduplicate arrivals (same train can appear from multiple platform queries)
      const seen = new Set<string>();
      const uniqueArrivals = allArrivals.filter(arr => {
        const key = `${arr.routeId}|${arr.destination}|${arr.timestamp}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Filter by enabled routes
      const routeFilteredArrivals = uniqueArrivals.filter(arr => {
        const selection = serviceSelections.find(s => s.service_guid === arr._sourceService);
        // If no selection found, no enabledRouteIds, or empty array, include the arrival
        if (!selection || !selection.enabledRouteIds || selection.enabledRouteIds.length === 0) return true;
        return selection.enabledRouteIds.includes(arr.routeId);
      });

      // Filter by headsign (destination) when direction filters are selected
      const filteredArrivals = routeFilteredArrivals.filter(arr => {
        const selection = serviceSelections.find(s => s.service_guid === arr._sourceService);
        // If no headsign filters are set, include the arrival
        if (!selection?.selectedHeadsignFilters || selection.selectedHeadsignFilters.length === 0) return true;
        // Match the arrival's destination to any of the selected headsigns (exact match, case-insensitive)
        const destination = (arr.destination || '').toLowerCase().trim();
        return selection.selectedHeadsignFilters.some(filter =>
          destination === filter.toLowerCase().trim()
        );
      });

      // Limit arrivals (already sorted by timestamp)
      setScheduleData(slideId, filteredArrivals.slice(0, MAX_ARRIVALS_PER_SLIDE));
      useFixedRouteStore.getState().setDataError(slideId, false);
    } catch (error) {
      console.error("Error fetching stop data:", error);
      useFixedRouteStore.getState().setDataError(slideId, true);
    } finally {
      setIsLoading(slideId, false);
    }
  }, [selectedStop, serviceSelections, slideId, setIsLoading, setScheduleData]);

  // One-time refresh when allStops loads
  useEffect(() => {
    if (!allStops.length || allStopsRefreshedRef.current) return;
    allStopsRefreshedRef.current = true;

    const freshSlide = useFixedRouteStore.getState().slides[slideId];
    const freshSelectedStop = freshSlide?.selectedStop;
    const freshSelections = freshSlide?.serviceSelections;
    if (!freshSelectedStop || !freshSelections?.length) return;

    const deduped = deduplicateStops([freshSelectedStop, ...allStops.filter((s: any) => s.stop_name === freshSelectedStop.stop_name)]);
    const dedupedStop = deduped[0] || freshSelectedStop;

    let changed = false;
    const updated = freshSelections.map((selection: ServiceSelection) => {
      const service = dedupedStop.services?.find((s: any) => s.service_guid === selection.service_guid);
      if (!service) return selection;

      // Pass enabledRouteIds to filter direction options by active routes
      const newDirOptions = computeDirectionOptions(service, allStops, selection.enabledRouteIds);
      const validStopIds = new Set(newDirOptions.map((o: DirectionOption) => o.stop_id));
      const currentValid = validStopIds.has(selection.selectedStopId);
      const newSelectedStopId = currentValid
        ? selection.selectedStopId
        : (newDirOptions.find((o: DirectionOption) => o.isAllDirections)?.stop_id || newDirOptions[0]?.stop_id || selection.selectedStopId);

      // Also validate selectedHeadsignFilters - remove any that are no longer valid
      const validHeadsignFilters = new Set(newDirOptions.map((o: DirectionOption) => o.headsignFilter).filter(Boolean));
      const newSelectedHeadsignFilters = (selection.selectedHeadsignFilters || []).filter(h => validHeadsignFilters.has(h));

      if (newSelectedStopId !== selection.selectedStopId ||
          JSON.stringify(newSelectedHeadsignFilters) !== JSON.stringify(selection.selectedHeadsignFilters || []) ||
          JSON.stringify(newDirOptions) !== JSON.stringify(selection.directionOptions)) {
        changed = true;
        return { ...selection, directionOptions: newDirOptions, selectedStopId: newSelectedStopId, selectedHeadsignFilters: newSelectedHeadsignFilters.length > 0 ? newSelectedHeadsignFilters : undefined };
      }
      return selection;
    });

    if (changed) {
      setServiceSelections(slideId, updated);
    }
  }, [allStops, slideId, setServiceSelections]);

  // Migration: Initialize serviceSelections if we have selectedStop but no selections
  useEffect(() => {
    if (selectedStop && (!serviceSelections || serviceSelections.length === 0)) {
      // Re-run handleSelectStop logic to initialize serviceSelections
      const deduped = deduplicateStops([selectedStop, ...allStops.filter(s => s.stop_name === selectedStop.stop_name)]);
      const dedupedStop = deduped[0] || selectedStop;

      const selections: ServiceSelection[] = (dedupedStop.services || []).map((service: any) => {
        const directionOptions = computeDirectionOptions(service, allStops);
        const defaultStopId = directionOptions.find(o => o.isAllDirections)?.stop_id
          || directionOptions[0]?.stop_id
          || selectedStop.stop_id;

        return {
          service_guid: service.service_guid,
          agency_name: service.agency_name,
          routes: service.routes,
          enabled: true,
          selectedStopId: defaultStopId,
          directionOptions,
          enabledRouteIds: service.routes?.map((r: any) => r.route_id) || []
        };
      });

      if (selections.length > 0) {
        setServiceSelections(slideId, selections);
      }
    }
  }, [selectedStop, allStops, serviceSelections, setServiceSelections, slideId]);

  useEffect(() => {
    if (selectedStop && serviceSelections?.length > 0) {
      fetchData();
    }
  }, [selectedStop, serviceSelections, fetchData]);

  useEffect(() => {
    renderCount.current += 1;
    const isDev = process.env.NODE_ENV === "development";
    const shouldSkip =
      (isDev && renderCount.current <= 2) ||
      (!isDev && renderCount.current === 1);

    if (shouldSkip) {
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("saving");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saved");
    }, 600);
  }, [
    stopName,
    description,
    backgroundColor,
    titleColor,
    tableColor,
    tableTextColor,
    titleTextSize,
    contentTextSize,
  ]);

  type ImageTarget = "bg" | "logo";

  const imageTargetMap = {
    bg: {
      get: () => bgImage,
      set: (url: string) => setBgImage(slideId, url),
    },
    logo: {
      get: () => logoImage,
      set: (url: string) => setLogoImage(slideId, url),
    },
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: ImageTarget
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentImage = imageTargetMap[target].get();
    const setLoadingFn = target === 'bg' ? setIsBgUploading : setIsLogoUploading;

    setLoadingFn(true);
    try {
      const data = await uploadImage(shortcode, file);

      if (currentImage) {
        await deleteImage(currentImage);
      }

      imageTargetMap[target].set(data.url);

      if (target === 'bg') bgInputRef.current!.value = '';
      if (target === 'logo') logoInputRef.current!.value = '';
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setLoadingFn(false);
    }
  };

  const handleRemoveImage = async (target: ImageTarget) => {
    const currentImage = imageTargetMap[target].get();
    if (!currentImage) return;
  
    try {
      await deleteImage(currentImage);
      imageTargetMap[target].set('');

      if (target === 'bg' && bgInputRef.current) bgInputRef.current.value = '';
      if (target === 'logo' && logoInputRef.current) logoInputRef.current.value = '';
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  const scheduleData = [
    {
      destination: "Airport directly to Rte 7 & Donald",
      route: "117",
      routeColor: "bg-green-600",
      time: "9:49 PM",
      duration: "27 min",
    },
  ];

  return (
    <>
      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Main Content */}
        <div className="flex-1 bg-white">
          <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[#4a5568] mb-4">
              <span>Home</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium">Stop Arrivals Page Template</span>
            </div>

            <p className="text-[#606061] mb-6">
              This table displays a single stop with the various routes that
              pass through this stop. Input the single fixed route stop that you
              would like for the table to show.{" "}
            </p>

            {/* Fixed Route Stop Input */}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[#4a5568] font-medium mb-2">
                  Fixed Route Stop
                </label>
                <div className="relative">
                  <Input
                    className="flex-1 bg-white border-[#cbd5e0]"
                    value={stopName}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => {
                      if (stopName.trim() === "" && nearbyStops.length > 0) {
                        setFilteredStops(nearbyStops);
                        setShowDropdown(true);
                      } else if (filteredStops.length > 0) {
                        setShowDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click on dropdown items
                      setTimeout(() => setShowDropdown(false), 200);
                    }}
                    placeholder="Enter text here... "
                  />
                  {showDropdown && filteredStops.length > 0 && (
                    <ul className="absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                      {isSearching && (
                        <li className="px-4 py-2 text-gray-500 italic text-sm">
                          Searching stops...
                        </li>
                      )}
                      {deduplicateStops(filteredStops).map((stop, index) => (
                        <li
                          key={index}
                          onClick={() => handleSelectStop(stop)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black"
                        >
                          {stop.stop_name} -{" "}
                          {stop.services[0]?.agency_name || "No Agency"}
                          {stop.services.length > 1 && (
                            <span className="text-gray-400 text-xs ml-1">
                              (+{stop.services.length - 1} more)
                            </span>
                          )}
                          {stop.distance !== undefined && (
                            <span className="text-gray-500 text-sm ml-2">
                              ({formatDistance(stop.distance)})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {selectedStop && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <h4 className="font-medium text-[#4a5568] text-sm">
                          Selected Stop
                        </h4>
                      </div>
                      <p className="text-sm text-[#606061] mb-1">
                        {selectedStop.stop_name}
                      </p>
                      <p className="text-xs text-[#718096]">
                        {selectedStop.services[0]?.agency_name || "No Agency"}
                      </p>
                      {selectedStop.distance !== undefined && (
                        <p className="text-xs text-[#718096] mt-1">
                          Distance: {formatDistance(selectedStop.distance)}
                        </p>
                      )}
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedStop.stop_lat},${selectedStop.stop_lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      View on Map
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Service & Direction Selection */}
                  {serviceSelections.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <label className="block text-[#4a5568] font-medium text-sm mb-2">
                        Lines & Directions
                      </label>
                      <div className="space-y-3">
                        {(servicesExpanded
                          ? serviceSelections
                          : serviceSelections.slice(0, MAX_VISIBLE_SERVICES)
                        ).map((selection, index) => (
                          <div
                            key={`${selection.service_guid}-${index}`}
                            className="p-3 bg-white rounded-lg border"
                          >
                            {/* Route badges row */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <Checkbox
                                checked={selection.enabled}
                                onCheckedChange={(checked) => {
                                  const updated = serviceSelections.map((s, i) =>
                                    i === index ? { ...s, enabled: !!checked } : s
                                  );
                                  setServiceSelections(slideId, updated);
                                }}
                              />
                              {selection.routes && selection.routes.length > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {selection.routes.map((route: any) => {
                                    const isRouteEnabled = !selection.enabledRouteIds ||
                                      selection.enabledRouteIds.includes(route.route_id);
                                    const canToggle = selection.enabled && selection.routes!.length > 1;

                                    return (
                                      <button
                                        key={route.route_id}
                                        disabled={!canToggle}
                                        onClick={() => {
                                          if (!canToggle) return;
                                          const currentEnabled = selection.enabledRouteIds ||
                                            selection.routes!.map((r: any) => r.route_id);
                                          // Prevent disabling all routes
                                          if (isRouteEnabled && currentEnabled.length === 1) return;
                                          const newEnabled = isRouteEnabled
                                            ? currentEnabled.filter((id: string) => id !== route.route_id)
                                            : [...currentEnabled, route.route_id];

                                          // Recalculate direction options based on new enabled routes
                                          const service = selectedStop.services?.find((s: any) => s.service_guid === selection.service_guid);
                                          const newDirOptions = service ? computeDirectionOptions(service, allStops, newEnabled) : selection.directionOptions;
                                          // Remove any headsign filters that are no longer valid
                                          const validHeadsigns = new Set(newDirOptions.map(o => o.headsignFilter).filter(Boolean));
                                          const newHeadsignFilters = (selection.selectedHeadsignFilters || []).filter(h => validHeadsigns.has(h));

                                          const updated = serviceSelections.map((s, i) =>
                                            i === index ? { ...s, enabledRouteIds: newEnabled, directionOptions: newDirOptions, selectedHeadsignFilters: newHeadsignFilters.length > 0 ? newHeadsignFilters : undefined } : s
                                          );
                                          setServiceSelections(slideId, updated);
                                        }}
                                        className={`px-2 py-0.5 rounded text-xs font-bold min-w-[24px] text-center transition-opacity ${
                                          canToggle ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-400' : ''
                                        } ${isRouteEnabled ? 'opacity-100' : 'opacity-30'}`}
                                        style={{
                                          backgroundColor: route.route_color ? `#${route.route_color}` : '#6b7280',
                                          color: route.route_text_color ? `#${route.route_text_color}` : '#ffffff'
                                        }}
                                        title={canToggle ? `Click to ${isRouteEnabled ? 'hide' : 'show'} ${route.route_short_name || route.route_id} arrivals` : undefined}
                                      >
                                        {route.route_short_name || route.route_id}
                                      </button>
                                    );
                                  })}
                                  {/* Select All button for services with many routes */}
                                  {selection.enabled && selection.routes.length > 3 && (
                                    <button
                                      onClick={() => {
                                        const allRouteIds = selection.routes!.map((r: any) => r.route_id);
                                        // Recalculate direction options with all routes enabled
                                        const service = selectedStop.services?.find((s: any) => s.service_guid === selection.service_guid);
                                        const newDirOptions = service ? computeDirectionOptions(service, allStops, allRouteIds) : selection.directionOptions;
                                        // Keep headsign filters that are still valid
                                        const validHeadsigns = new Set(newDirOptions.map(o => o.headsignFilter).filter(Boolean));
                                        const newHeadsignFilters = (selection.selectedHeadsignFilters || []).filter(h => validHeadsigns.has(h));
                                        const updated = serviceSelections.map((s, i) =>
                                          i === index ? { ...s, enabledRouteIds: allRouteIds, directionOptions: newDirOptions, selectedHeadsignFilters: newHeadsignFilters.length > 0 ? newHeadsignFilters : undefined } : s
                                        );
                                        setServiceSelections(slideId, updated);
                                      }}
                                      className="text-xs text-blue-600 hover:underline ml-1"
                                    >
                                      Select All
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-[#4a5568]">
                                  {selection.agency_name}
                                </span>
                              )}
                            </div>

                            {/* Direction toggles row - multi-select for headsign filters */}
                            {selection.enabled && selection.directionOptions.length > 1 && (
                              <div className="flex items-center gap-1.5 ml-6 flex-wrap">
                                {selection.directionOptions.map((opt) => {
                                  // "All" is selected when no filters are active
                                  // Individual headsigns are selected when in the selectedHeadsignFilters array
                                  const currentFilters = selection.selectedHeadsignFilters || [];
                                  const isAllOption = opt.isAllDirections;
                                  const isSelected = isAllOption
                                    ? currentFilters.length === 0
                                    : opt.headsignFilter ? currentFilters.includes(opt.headsignFilter) : false;

                                  return (
                                    <button
                                      key={opt.label}
                                      onClick={() => {
                                        let newFilters: string[];

                                        if (isAllOption) {
                                          // Clicking "All" clears all filters
                                          newFilters = [];
                                        } else if (opt.headsignFilter) {
                                          // Toggle this headsign filter
                                          if (currentFilters.includes(opt.headsignFilter)) {
                                            newFilters = currentFilters.filter(f => f !== opt.headsignFilter);
                                          } else {
                                            newFilters = [...currentFilters, opt.headsignFilter];
                                          }
                                        } else {
                                          newFilters = currentFilters;
                                        }

                                        const updated = serviceSelections.map((s, i) =>
                                          i === index ? {
                                            ...s,
                                            selectedStopId: opt.stop_id,
                                            selectedHeadsignFilters: newFilters.length > 0 ? newFilters : undefined
                                          } : s
                                        );
                                        setServiceSelections(slideId, updated);
                                      }}
                                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                        isSelected
                                          ? 'bg-blue-600 text-white border-blue-600'
                                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                      }`}
                                    >
                                      {opt.label === 'All Directions' ? 'All' : opt.label.replace('bound', '')}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}

                        {serviceSelections.length > MAX_VISIBLE_SERVICES && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-blue-600 hover:text-blue-700"
                            onClick={() => setServicesExpanded(!servicesExpanded)}
                          >
                            {servicesExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                Show {serviceSelections.length - MAX_VISIBLE_SERVICES} more
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Also at this location - Station Complex */}
              {selectedStop && complexStops.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Also at this location
                  </h4>
                  <div className="space-y-2">
                    {complexStops.map((stop, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white rounded border p-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {stop.stop_name}
                          </p>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {getUniqueRoutes(stop.services).slice(0, MAX_DISPLAYED_ROUTES).map((route: any) => (
                              <span
                                key={route.route_id}
                                className="px-1.5 py-0.5 rounded text-xs font-bold"
                                style={{
                                  backgroundColor: route.route_color ? `#${route.route_color}` : '#6b7280',
                                  color: route.route_text_color ? `#${route.route_text_color}` : '#ffffff'
                                }}
                              >
                                {route.route_short_name || route.route_id}
                              </span>
                            ))}
                            {getUniqueRoutes(stop.services).length > MAX_DISPLAYED_ROUTES && (
                              <span className="text-xs text-gray-400">
                                +{getUniqueRoutes(stop.services).length - MAX_DISPLAYED_ROUTES} more
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 text-xs flex-shrink-0"
                          onClick={() => handleAddComplexStop(stop)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[#4a5568] font-medium mb-2">
                  Sub Description
                </label>
                <Input
                  placeholder="Enter text here..."
                  className="bg-white border-[#cbd5e0]"
                  value={description}
                  onChange={(e) => setDescription?.(slideId, e.target.value)}
                />
              </div>
            </div>

            <div className="h-[550px] rounded-lg border border-[#e2e8f0] overflow-hidden">
              <FixedRoutePreview slideId={slideId} />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 mt-4">
              <Button
                className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium"
                onClick={() => handlePreview()}
              >
                Preview Screens
              </Button>
              <Button
                className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium"
                onClick={() => handlePublish()}
              >
                Publish Screens
              </Button>
              {saveStatus !== "idle" && (
                <div className="flex items-center text-xs text-gray-500 ml-2 animate-fade-in">
                  {saveStatus === "saving" ? (
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
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4">
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
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) =>
                      setBackgroundColor(slideId, e.target.value)
                    }
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input
                  value={backgroundColor}
                  className="flex-1 text-xs"
                  onChange={(e) => {
                    setBackgroundColor(slideId, e.target.value);
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Slide Title Color
              </label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={titleColor}
                    onChange={(e) => setTitleColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>

                <Input
                  value={titleColor}
                  className="flex-1 text-xs"
                  onChange={(e) => setTitleColor(slideId, e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Table Color
              </label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={tableColor}
                    onChange={(e) => setTableColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input
                  value={tableColor}
                  className="flex-1 text-xs"
                  onChange={(e) => setTableColor(slideId, e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Table Text Color
              </label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={tableTextColor}
                    onChange={(e) => setTableTextColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input
                  value={tableTextColor}
                  className="flex-1 text-xs"
                  onChange={(e) => setTableTextColor(slideId, e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Background Image
              </label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden">
                  {isBgUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  ) : bgImage ? (
                    <img
                      src={bgImage}
                      alt="BG"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 bg-[#cbd5e0] rounded" />
                  )}
                </div>
                <div className="flex gap-1">
                  {/* Hidden input */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={bgInputRef}
                    onChange={(e) => handleImageUpload(e, 'bg')}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent px-2 py-1"
                    onClick={() => bgInputRef.current?.click()}
                  >
                    Change
                  </Button>
                  {bgImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-transparent px-2 py-1"
                      onClick={() => handleRemoveImage('bg')}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Logo Image
              </label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden">
                  {isLogoUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  ) : logoImage ? (
                    <img
                      src={logoImage}
                      alt="BG"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 bg-[#cbd5e0] rounded" />
                  )}
                </div>
                <div className="flex gap-1">
                  {/* Hidden input */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={logoInputRef}
                    onChange={(e) => handleImageUpload(e, 'logo')}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent px-2 py-1"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    Change
                  </Button>
                  {logoImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-transparent px-2 py-1"
                      onClick={() => handleRemoveImage('logo')}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Title Text Size
              </label>
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
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Content Text Size
              </label>
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

            <div className="mt-auto">
              <Button
                className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2"
                onClick={() => {
                  handleDelete(slideId);
                }}
              >
                Delete Screen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
