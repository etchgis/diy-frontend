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
  Pencil,
} from "lucide-react";
import FixedRoutePreview from "./preview";
import { useEffect, useRef, useState, useCallback, JSXElementConstructor, ReactElement, ReactNode, ReactPortal, Key } from "react";
import { useFixedRouteStore, ServiceSelection, DirectionOption, RouteInfo } from "./store";
import { deleteImage } from "@/services/deleteImage";
import { uploadImage } from "@/services/uploadImage";
import { useGeneralStore } from "@/stores/general";
import { fetchAllStops } from "@/services/data-gathering/fetchAllStops";
import { fetchStopData, MAX_ARRIVALS_PER_SLIDE } from "@/services/data-gathering/fetchStopData";
import { fetchRoutes } from "@/services/data-gathering/fetchRoutes";
import { fetchRoutePatterns } from "@/services/route-times/routeDataFetcher";
import { calculateDistance, formatDistance } from "@/utils/distance";
import type { ExpandedStop, ExpandedService, ExpandedRoute, ExpandedLinkedStop } from "@/types/nysdot-stops";

// Stable empty array reference for Zustand selector
const EMPTY_SERVICE_SELECTIONS: ServiceSelection[] = [];
const DEFAULT_COLUMN_LABELS: [string, string] = ['Left', 'Right'];

const MAX_VISIBLE_SERVICES = 3;

// Auto-split serviceSelections into two column configs based on directionality
function autoSplitToColumns(serviceSelections: ServiceSelection[]): [ServiceSelection[], ServiceSelection[]] {
  const left: ServiceSelection[] = [];
  const right: ServiceSelection[] = [];
  for (const sel of serviceSelections) {
    const northHeadsigns = (sel.directionOptions || [])
      .filter((o: DirectionOption) => o.headsignFilter && (o.directionGroup === 'Northbound' || o.directionGroup === 'Eastbound'))
      .map((o: DirectionOption) => o.headsignFilter!);
    const southHeadsigns = (sel.directionOptions || [])
      .filter((o: DirectionOption) => o.headsignFilter && (o.directionGroup === 'Southbound' || o.directionGroup === 'Westbound'))
      .map((o: DirectionOption) => o.headsignFilter!);

    if (northHeadsigns.length > 0 && southHeadsigns.length > 0) {
      const combinedStopId = (sel.directionOptions || []).find((o: DirectionOption) => o.isAllDirections)?.stopId || sel.selectedStopId;
      left.push({ ...sel, selectedStopId: combinedStopId, selectedHeadsignFilters: northHeadsigns });
      right.push({ ...sel, selectedStopId: combinedStopId, selectedHeadsignFilters: southHeadsigns });
    } else {
      const northOption = (sel.directionOptions || []).find(
        (o: DirectionOption) => !o.isAllDirections && !o.headsignFilter && !o.groupHeadsigns && (o.label === 'Northbound' || o.label === 'Eastbound')
      );
      const southOption = (sel.directionOptions || []).find(
        (o: DirectionOption) => !o.isAllDirections && !o.headsignFilter && !o.groupHeadsigns && (o.label === 'Southbound' || o.label === 'Westbound')
      );
      if (northOption && southOption) {
        left.push({ ...sel, selectedStopId: northOption.stopId, selectedHeadsignFilters: undefined });
        right.push({ ...sel, selectedStopId: southOption.stopId, selectedHeadsignFilters: undefined });
      } else {
        left.push({ ...sel });
        right.push({ ...sel });
      }
    }
  }
  return [left, right];
}
const MAX_DISPLAYED_ROUTES = 6;

// Helper to deduplicate routes by id across all services
function getUniqueRoutes(services: ExpandedService[]): ExpandedRoute[] {
  const allRoutes = services?.flatMap((service) => service.routes || []) || [];
  return allRoutes.filter((route, idx) =>
    allRoutes.findIndex((r) => r.id === route.id) === idx
  );
}

// Helper to extract unique headsigns from all services at a linked stop
function getUniqueHeadsigns(services: ExpandedService[]): string[] {
  const headsignSet = new Set<string>();
  for (const service of services || []) {
    for (const route of service.routes || []) {
      for (const headsign of route.headsigns || []) {
        headsignSet.add(headsign);
      }
    }
  }
  return Array.from(headsignSet).sort();
}

// Compute direction options for a specific service using its _stopIds
// enabledRouteIds filters which routes' headsigns to include (undefined = all routes)
function computeDirectionOptions(
  service: any,
  _allStopsArray: any[],
  enabledRouteIds?: string[]
): DirectionOption[] {
  const stopIds: string[] = (service._stopIds || []).filter(Boolean);

  if (stopIds.length === 0) {
    return [{ stopId: '', label: 'All Directions', isAllDirections: true }];
  }

  // Separate parent stations from directional stops
  const parentStopIds: string[] = [];
  const directionalByLabel = new Map<string, string[]>(); // label -> [stopIds]

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
    const allDirStopIds = Array.from(directionalByLabel.values()).flat();
    const combinedStopId = allDirStopIds.join(',');

    // Only offer direction choice if there are 2+ distinct directions.
    if (directionalByLabel.size < 2) {
      return [{ stopId: combinedStopId, label: 'All Directions', isAllDirections: true }];
    }

    const stopIdData = service._stopIdData as Record<string, { routes: any[], locationType: number }> | undefined;
    const directionHeadsigns = new Map<string, string[]>(); // 'Northbound' → ['downtown', 'airport']
    for (const [label, dirStopIds] of directionalByLabel) {
      const headsigns: string[] = [];
      for (const stopId of dirStopIds) {
        const data = stopIdData?.[stopId];
        if (data?.routes) {
          for (const route of (data.routes as any[])) {
            if (!enabledRouteIds || enabledRouteIds.includes(route.id)) {
              for (const headsign of (route.headsigns || []) as string[]) {
                const key = headsign.toLowerCase().trim();
                if (!headsigns.includes(key)) headsigns.push(key);
              }
            }
          }
        }
      }
      directionHeadsigns.set(label, headsigns);
    }

    const hasHeadsigns = Array.from(directionHeadsigns.values()).some(h => h.length > 0);

    options.push({ stopId: combinedStopId, label: 'All Directions', isAllDirections: true });

    if (hasHeadsigns) {
      for (const [label, headsigns] of directionHeadsigns) {
        if (headsigns.length > 0) {
          options.push({ stopId: combinedStopId, label, isAllDirections: false, groupHeadsigns: headsigns });
          for (const headsign of headsigns) {
            options.push({ stopId: combinedStopId, label: headsign, isAllDirections: false, headsignFilter: headsign, directionGroup: label });
          }
        } else {
          options.push({ stopId: directionalByLabel.get(label)!.join(','), label, isAllDirections: false });
        }
      }
    } else {
      for (const [label, dirStopIds] of directionalByLabel) {
        options.push({ stopId: dirStopIds.join(','), label, isAllDirections: false });
      }
    }
    return options;
  }

  // No N/S/E/W suffixes - try route-based direction options using _stopIdData
  const stopIdData = service._stopIdData as Record<string, { routes: any[], locationType: number }> | undefined;
  if (stopIdData && Object.keys(stopIdData).length > 1) {
    // Group stopIds by route destination
    const routeDestinations = new Map<string, string[]>(); // destination label -> [stopIds]
    const parentStationIds: string[] = [];  // Collect ALL parent stations

    for (const stopId of stopIds) {
      const data = stopIdData[stopId];

      // Check if this is a parent station
      if (data?.locationType === 1) {
        parentStationIds.push(stopId);  // Collect all parent stations, not just the last one
        continue; // Parent stations get used for "All", not their own option
      }

      // Group by route - use shortName or id as the grouping key
      const routes = data?.routes || [];
      if (routes.length > 0) {
        const route = routes[0];
        // Use route short name as the label (e.g., "PATH", "A", "7")
        const routeLabel = route.shortName || route.id;

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
      // "All" option uses ALL parent stations if available, otherwise all child stopIds
      const allStopIds = parentStationIds.length > 0
        ? parentStationIds
        : Array.from(routeDestinations.values()).flat();

      options.push({
        stopId: allStopIds.join(','),
        label: 'All',
        isAllDirections: true
      });

      // Add each destination as an option
      for (const [destination, destStopIds] of routeDestinations) {
        options.push({
          stopId: destStopIds.join(','),
          label: destination,
          isAllDirections: false
        });
      }
      return options;
    }
  }

  // Try headsign-based direction options (e.g., "Jamaica", "Hempstead" for buses)
  // This works when a single stop serves multiple destinations
  const stopIdDataWithHeadsigns = service._stopIdData as Record<string, { routes: ExpandedRoute[], locationType: number }> | undefined;
  if (stopIdDataWithHeadsigns && stopIds.length > 0) {
    // Collect unique headsigns from enabled routes only
    // Use Map to deduplicate by lowercase key while preserving original for display
    const headsignMap = new Map<string, string>(); // lowercase -> original
    for (const stopId of stopIds) {
      const data = stopIdDataWithHeadsigns[stopId];
      if (data?.routes) {
        for (const route of data.routes) {
          // Only include headsigns from enabled routes (or all if no filter)
          if (!enabledRouteIds || enabledRouteIds.includes(route.id)) {
            for (const headsign of route.headsigns || []) {
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
        stopId: stopIds.join(','),
        label: 'All Directions',
        isAllDirections: true
      });

      const sortedHeadsigns = Array.from(headsignMap.values()).sort();
      for (const headsign of sortedHeadsigns) {
        options.push({
          stopId: stopIds.join(','),
          label: headsign,
          isAllDirections: false,
          headsignFilter: headsign.toLowerCase().trim()
        });
      }
      return options;
    }
  }

  // Fallback: no directional options available, just use all stopIds
  options.push({
    stopId: stopIds.join(','),
    label: 'All Directions',
    isAllDirections: true
  });

  return options;
}

// Deduplicate stops by name for search dropdown
// This merges all platforms/directions of the same station into one entry
function deduplicateStops(stops: ExpandedStop[]): ExpandedStop[] {
  const stopMap = new Map<string, any>();

  for (const stop of stops) {
    // Use name as the key so all "Grand Central-42 St" entries merge into one
    const key = (stop as any).name || (stop as any).stop_name;
    if (stopMap.has(key)) {
      // Merge services into existing stop
      const existing = stopMap.get(key);
      for (const svc of stop.services || []) {
        const existingServiceIdx = existing.services.findIndex(
          (f: any) => f.id === svc.id
        );
        if (existingServiceIdx === -1) {
          // New service - add it (clone to avoid mutation)
          existing.services.push({
            ...svc,
            routes: svc.routes ? [...svc.routes] : [],
            _stopIds: [stop.id],  // Track which stopIds this service uses
            _stopIdData: {  // Track per-stopId metadata for direction options
              [stop.id]: {
                routes: svc.routes ? [...svc.routes] : [],
                locationType: stop.locationType
              }
            }
          });
        } else {
          // Same service - merge routes arrays and stopIds
          const existingService = existing.services[existingServiceIdx];
          if (!existingService.routes) {
            existingService.routes = [];
          }
          for (const route of svc.routes || []) {
            if (!existingService.routes.some((r: any) => r.id === route.id)) {
              existingService.routes.push(route);
            }
          }
          // Track stopIds for this service
          if (!existingService._stopIds) {
            existingService._stopIds = [];
          }
          if (!existingService._stopIds.includes(stop.id)) {
            existingService._stopIds.push(stop.id);
          }
          // Track per-stopId metadata
          if (!existingService._stopIdData) {
            existingService._stopIdData = {};
          }
          existingService._stopIdData[stop.id] = {
            routes: svc.routes ? [...svc.routes] : [],
            locationType: stop.locationType
          };
        }
      }
      // Collect all related stopIds for direction computation later
      if (!existing._allStopIds) {
        existing._allStopIds = [existing.id];
      }
      if (!existing._allStopIds.includes(stop.id)) {
        existing._allStopIds.push(stop.id);
      }
      // Prefer version with locationType = 1 (parent station)
      if (stop.locationType === 1) {
        existing.id = stop.id;
        existing.locationType = stop.locationType;
      }
    } else {
      // Clone to avoid mutating original
      const clonedServices = (stop.services || []).map((f: any) => ({
        ...f,
        routes: f.routes ? [...f.routes] : [],
        _stopIds: [stop.id],
        _stopIdData: {
          [stop.id]: {
            routes: f.routes ? [...f.routes] : [],
            locationType: stop.locationType
          }
        }
      }));
      stopMap.set(key, {
        ...stop,
        services: clonedServices,
        _allStopIds: [stop.id]
      });
    }
  }

  // Deduplicate services with identical routes (e.g., MTA regular vs supplemented services)
  for (const stop of stopMap.values()) {
    const uniqueServices: any[] = [];
    const seenRouteKeys = new Set<string>();

    for (const svc of stop.services) {
      // Create a key from sorted route IDs
      const routeKey = (svc.routes || [])
        .map((r: any) => r.id)
        .sort()
        .join(',');

      // Don't deduplicate services with no routes — empty key would incorrectly collapse all of them
      if (!routeKey || !seenRouteKeys.has(routeKey)) {
        if (routeKey) seenRouteKeys.add(routeKey);
        uniqueServices.push(svc);
      } else {
        // Merge _stopIds and _stopIdData into the existing service with same routes
        const existingService = uniqueServices.find(f => {
          const existingKey = (f.routes || []).map((r: any) => r.id).sort().join(',');
          return existingKey === routeKey;
        });
        if (existingService && svc._stopIds) {
          for (const stopId of svc._stopIds) {
            if (!existingService._stopIds.includes(stopId)) {
              existingService._stopIds.push(stopId);
            }
          }
          // Merge _stopIdData
          if (svc._stopIdData) {
            if (!existingService._stopIdData) {
              existingService._stopIdData = {};
            }
            Object.assign(existingService._stopIdData, svc._stopIdData);
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
  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isBgUploading, setIsBgUploading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const renderCount = useRef(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [allStops, setAllStops] = useState<ExpandedStop[]>([]);
  const [filteredStops, setFilteredStops] = useState<ExpandedStop[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [nearbyStops, setNearbyStops] = useState<ExpandedStop[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [linkedStops, setLinkedStops] = useState<ExpandedLinkedStop[]>([]); // Stops in same station complex

  // Route-first search mode
  const [routeSearchMode, setRouteSearchMode] = useState(false);
  const [routeQuery, setRouteQuery] = useState('');
  const [routeResults, setRouteResults] = useState<any[]>([]);
  const [isSearchingRoutes, setIsSearchingRoutes] = useState(false);
  const [selectedRouteForStop, setSelectedRouteForStop] = useState<any>(null);
  const [routeStops, setRouteStops] = useState<any[]>([]);
  const [isLoadingRouteStops, setIsLoadingRouteStops] = useState(false);
  const routeSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeCacheRef = useRef<any[]>([]);

  const stopName = useFixedRouteStore(
    (state: { slides: { [x: string]: { stopName: any; }; }; }) => state.slides[slideId]?.stopName || ""
  );
  const setStopName = useFixedRouteStore((state: { setStopName: any; }) => state.setStopName);

  const displayName = useFixedRouteStore(
    (state: { slides: { [x: string]: { displayName: any; }; }; }) => state.slides[slideId]?.displayName ?? ""
  );
  const setDisplayName = useFixedRouteStore((state: { setDisplayName: any; }) => state.setDisplayName);

  const selectedStop = useFixedRouteStore(
    (state: { slides: { [x: string]: { selectedStop: any; }; }; }) => state.slides[slideId]?.selectedStop || undefined
  );
  const setSelectedStop = useFixedRouteStore((state: { setSelectedStop: any; }) => state.setSelectedStop);

  const serviceSelections = useFixedRouteStore(
    (state: { slides: { [x: string]: { serviceSelections: any; }; }; }) => state.slides[slideId]?.serviceSelections ?? EMPTY_SERVICE_SELECTIONS
  );
  const setServiceSelections = useFixedRouteStore((state: { setServiceSelections: any; }) => state.setServiceSelections);

  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [editingHeadsignsFor, setEditingHeadsignsFor] = useState<string | null>(null); // serviceId being renamed
  const [headsignDraft, setHeadsignDraft] = useState<Record<string, string>>({}); // headsignFilter → draft name

  const description = useFixedRouteStore(
    (state: { slides: { [x: string]: { description: any; }; }; }) => state.slides[slideId]?.description || ""
  );
  const setDescription = useFixedRouteStore((state: { setDescription: any; }) => state.setDescription);

  const backgroundColor = useFixedRouteStore(
    (state: { slides: { [x: string]: { backgroundColor: any; }; }; }) => state.slides[slideId]?.backgroundColor || "#192F51"
  );
  const setBackgroundColor = useFixedRouteStore(
    (state: { setBackgroundColor: any; }) => state.setBackgroundColor
  );

  const titleColor = useFixedRouteStore(
    (state: { slides: { [x: string]: { titleColor: any; }; }; }) => state.slides[slideId]?.titleColor || "#FFFFFF"
  );
  const setTitleColor = useFixedRouteStore((state: { setTitleColor: any; }) => state.setTitleColor);

  const tableColor = useFixedRouteStore(
    (state: { slides: { [x: string]: { tableColor: any; }; }; }) => state.slides[slideId]?.tableColor || "#78B1DD"
  );
  const setTableColor = useFixedRouteStore((state: { setTableColor: any; }) => state.setTableColor);

  const tableTextColor = useFixedRouteStore(
    (state: { slides: { [x: string]: { tableTextColor: any; }; }; }) => state.slides[slideId]?.tableTextColor || "#FFFFFF"
  );
  const setTableTextColor = useFixedRouteStore(
    (state: { setTableTextColor: any; }) => state.setTableTextColor
  );

  const bgImage = useFixedRouteStore(
    (state: { slides: { [x: string]: { bgImage: any; }; }; }) => state.slides[slideId]?.bgImage || ""
  );
  const setBgImage = useFixedRouteStore((state: { setBgImage: any; }) => state.setBgImage);

  const logoImage = useFixedRouteStore(
    (state: { slides: { [x: string]: { logoImage: any; }; }; }) => state.slides[slideId]?.logoImage || ""
  );
  const setLogoImage = useFixedRouteStore((state: { setLogoImage: any; }) => state.setLogoImage);

  const titleTextSize = useFixedRouteStore(
    (state: { slides: { [x: string]: { titleTextSize: any; }; }; }) => state.slides[slideId]?.titleTextSize || 5
  );
  const setTitleTextSize = useFixedRouteStore((state: { setTitleTextSize: any; }) => state.setTitleTextSize);

  const contentTextSize = useFixedRouteStore(
    (state: { slides: { [x: string]: { contentTextSize: any; }; }; }) => state.slides[slideId]?.contentTextSize || 5
  );
  const setContentTextSize = useFixedRouteStore((state: { setContentTextSize: any; }) => state.setContentTextSize);

  const showTitle = useFixedRouteStore(
    (state: { slides: { [x: string]: { showTitle: boolean; }; }; }) => state.slides[slideId]?.showTitle !== false
  );
  const setShowTitle = useFixedRouteStore((state: { setShowTitle: any; }) => state.setShowTitle);

  const columnMode = useFixedRouteStore((state: { slides: { [x: string]: { columnMode: any; }; }; }) => state.slides[slideId]?.columnMode || false);
  const setColumnMode = useFixedRouteStore((state: { setColumnMode: any; }) => state.setColumnMode);
  const columnLabels = useFixedRouteStore((state: { slides: { [x: string]: { columnLabels: any; }; }; }) => state.slides[slideId]?.columnLabels || DEFAULT_COLUMN_LABELS);
  const setColumnLabels = useFixedRouteStore((state: { setColumnLabels: any; }) => state.setColumnLabels);
  const showColumnHeaders = useFixedRouteStore((state: any) => state.slides[slideId]?.showColumnHeaders || false);
  const setShowColumnHeaders = useFixedRouteStore((state: any) => state.setShowColumnHeaders);
  const columnHeaderBgColor = useFixedRouteStore((state: any) => state.slides[slideId]?.columnHeaderBgColor || '#ffffff');
  const setColumnHeaderBgColor = useFixedRouteStore((state: any) => state.setColumnHeaderBgColor);
  const columnHeaderTextColor = useFixedRouteStore((state: any) => state.slides[slideId]?.columnHeaderTextColor || tableColor);
  const setColumnHeaderTextColor = useFixedRouteStore((state: any) => state.setColumnHeaderTextColor);
  const columnHeaderTextSize = useFixedRouteStore((state: any) => state.slides[slideId]?.columnHeaderTextSize || 5);
  const setColumnHeaderTextSize = useFixedRouteStore((state: any) => state.setColumnHeaderTextSize);
  const columnServiceSelections = useFixedRouteStore((state: any) => state.slides[slideId]?.columnServiceSelections as [ServiceSelection[], ServiceSelection[]] | undefined);
  const setColumnServiceSelections = useFixedRouteStore((state: any) => state.setColumnServiceSelections);
  const [columnActiveTab, setColumnActiveTab] = useState<0 | 1>(0);

  const setIsLoading = useFixedRouteStore((state: { setIsLoading: any; }) => state.setIsLoading);

  const outageMessage = useFixedRouteStore((state: any) => state.slides[slideId]?.outageMessage ?? '');
  const setOutageMessage = useFixedRouteStore((state: any) => state.setOutageMessage);
  const skipOnError = useFixedRouteStore((state: any) => state.slides[slideId]?.skipOnError ?? false);
  const setSkipOnError = useFixedRouteStore((state: any) => state.setSkipOnError);

  const shortcode = useGeneralStore((state) => state.shortcode || "");
  const coordinates = useGeneralStore(
    (state) => state.coordinates || { lat: 0, lng: 0 }
  );

  const setScheduleData = useFixedRouteStore((state: { setScheduleData: any; }) => state.setScheduleData);

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
              stop.lat,
              stop.lon
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
      stop.stop_name?.toLowerCase().includes(value.toLowerCase())
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
              stop.lat,
              stop.lon
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

  const handleRouteQueryChange = (value: string) => {
    setRouteQuery(value);
    setSelectedRouteForStop(null);
    setRouteStops([]);
    if (routeSearchTimeoutRef.current) clearTimeout(routeSearchTimeoutRef.current);
    if (!value.trim()) {
      setRouteResults([]);
      return;
    }
    setIsSearchingRoutes(true);
    routeSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await fetchRoutes(value.trim());

        const merged = [...routeCacheRef.current, ...(results || [])];
        const deduped = [...new Map(merged.map(r => [r.route_id, r])).values()];
        routeCacheRef.current = deduped;

        const q = value.trim().toLowerCase();
        const cacheMatches = deduped.filter(r =>
          r.route_short_name?.toLowerCase().startsWith(q) ||
          r.route_long_name?.toLowerCase().includes(q)
        );

        setRouteResults(cacheMatches);
      } catch {
        setRouteResults([]);
      } finally {
        setIsSearchingRoutes(false);
      }
    }, 300);
  };

  const handleSelectRouteForStop = async (route: any) => {
    setSelectedRouteForStop(route);
    setRouteQuery(`${route.route_short_name || ''} ${route.route_long_name || ''}`.trim());
    setRouteResults([]);
    setIsLoadingRouteStops(true);
    try {
      const patternData = await fetchRoutePatterns({
        route_id: route.route_id,
        route_short_name: route.route_short_name,
        route_long_name: route.route_long_name,
        services: route.services?.map((s: any) => ({
          organization_guid: s.organization_guid,
          service_guid: s.service_guid,
        })) || [],
      });
      const stops = patternData?.stops || [];
      stops.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
      setRouteStops(stops);
    } catch {
      setRouteStops([]);
    } finally {
      setIsLoadingRouteStops(false);
    }
  };

  const handleSelectStopFromRoute = async (routeStop: any) => {
    setIsLoadingRouteStops(true);
    try {
      const results = await fetchAllStops({
        coordinates: { lat: routeStop.lat, lng: routeStop.lon },
        radius: 100,
        search: routeStop.name,
      });
      const deduped = deduplicateStops(results);
      const match = deduped[0];
      if (match) {
        handleSelectStop(match);
      }
    } catch {
      // nothing
    } finally {
      setIsLoadingRouteStops(false);
      setRouteSearchMode(false);
      setSelectedRouteForStop(null);
      setRouteStops([]);
      setRouteQuery('');
    }
  };

  const handleSelectStop = (stop: any) => {
    setStopName(slideId, stop.name);
    setFilteredStops([]);
    setSelectedStop(slideId, stop);
    setShowDropdown(false);

    // Initialize service selections - all enabled by default
    const selections: ServiceSelection[] = (stop.services || []).map((svc: any) => {
      const directionOptions = computeDirectionOptions(svc, allStops);
      const defaultStopId = directionOptions.find(o => o.isAllDirections)?.stopId
        || directionOptions[0]?.stopId
        || stop.id;

      return {
        serviceId: svc.id,
        organizationId: svc.organizationId,
        agencyName: svc.agencyName,
        routes: svc.routes,
        enabled: true,  // All enabled by default
        selectedStopId: defaultStopId,
        directionOptions,
        enabledRouteIds: svc.routes?.map((r: any) => r.id) || []
      };
    });

    setServiceSelections(slideId, selections);
    setColumnServiceSelections(slideId, undefined);

    // Use linkedStops directly from the API response (full stop objects, already deduped by name)
    if (stop.linkedStops && stop.linkedStops.length > 0) {
      setLinkedStops(stop.linkedStops);
    } else {
      setLinkedStops([]);
    }
  };

  const handleAddStop = () => {
    if (selectedStop) {
      // Perform any additional logic with the selected stop
    }
  };

  // Add services from a linked stop to the current selections
  // Merges headsigns from the linked stop into existing services with matching serviceId
  const handleAddLinkedStop = (linkedStop: ExpandedLinkedStop) => {
    const updatedSelections = [...serviceSelections];
    let anyMerged = false;

    for (const linkedService of linkedStop.services || []) {
      const serviceId = linkedService.id;
      if (!serviceId) {
        console.warn('Skipping linked service without id');
        continue;
      }

      // Find existing selection with matching serviceId
      const existingIndex = updatedSelections.findIndex(
        s => s.serviceId === serviceId
      );

      if (existingIndex !== -1) {
        // Merge: add linked stop's headsigns to this service's _stopIdData
        const existing = updatedSelections[existingIndex];

        // Find the original service in selectedStop to get its _stopIdData
        const originalService = selectedStop?.services?.find(
          (f: any) => f.id === serviceId
        );

        // Build enriched service with merged headsigns
        const baseStopId = selectedStop?.id || 'unknown';
        const enrichedService = {
          ...originalService,
          _stopIds: originalService?._stopIds ? [...originalService._stopIds] : [baseStopId],
          _stopIdData: originalService?._stopIdData ? { ...originalService._stopIdData } : {
            [baseStopId]: {
              routes: originalService?.routes || [],
              locationType: selectedStop?.locationType
            }
          }
        };

        // Add the linked stop's headsigns
        if (!enrichedService._stopIds.includes(linkedStop.id)) {
          enrichedService._stopIds.push(linkedStop.id);
        }
        enrichedService._stopIdData[linkedStop.id] = {
          routes: linkedService.routes || originalService?.routes || [],
          locationType: 0
        };

        // Recompute direction options with merged data
        const newDirOptions = computeDirectionOptions(enrichedService, allStops, existing.enabledRouteIds);
        const defaultStopId = newDirOptions.find(o => o.isAllDirections)?.stopId
          || newDirOptions[0]?.stopId
          || existing.selectedStopId;

        updatedSelections[existingIndex] = {
          ...existing,
          directionOptions: newDirOptions,
          selectedStopId: defaultStopId
        };
        anyMerged = true;
      } else {
        // New service - add it
        const directionOptions = computeDirectionOptions(linkedService, allStops);
        const defaultStopId = directionOptions.find(o => o.isAllDirections)?.stopId
          || directionOptions[0]?.stopId
          || linkedStop.id;

        updatedSelections.push({
          serviceId: serviceId,
          organizationId: linkedService.organizationId,
          agencyName: linkedService.agencyName,
          routes: linkedService.routes,
          enabled: true,
          selectedStopId: defaultStopId,
          directionOptions,
          enabledRouteIds: linkedService.routes?.map((r: any) => r.id) || []
        });
        anyMerged = true;
      }
    }

    if (anyMerged) {
      setServiceSelections(slideId, updatedSelections);
    }

    // Remove this stop from linked stops list
    setLinkedStops(linkedStops.filter(s => s.name !== linkedStop.name));
  };

  const fetchData = useCallback(async () => {
    if (!selectedStop || !serviceSelections?.length) return;

    // Build queries from enabled service selections
    // selectedStopId can be comma-separated (e.g., "631N,723N,901N")
    // In column mode, fetch the union of stop IDs from both column configs
    const activeSelections: ServiceSelection[] = columnMode && columnServiceSelections
      ? [...columnServiceSelections[0], ...columnServiceSelections[1]]
      : serviceSelections;

    const queryMap = new Map<string, { serviceId: string; stopId: string; organizationId: string }>();

    for (const selection of activeSelections) {
      if (!selection.enabled) continue;

      const selectionServiceId = selection.serviceId ?? (selection as any).service_guid;
      if (!selectionServiceId) continue;

      // Prefer orgId stored on the selection (covers linked-stop services not in selectedStop.services)
      const orgId = (selection as any).organizationId
        || selectedStop.services?.find((service: any) => service.id === selectionServiceId)?.organizationId;

      if (!orgId) {
        console.warn(`[StopArrivals] Could not find organizationId for service ${selectionServiceId}`);
        continue;
      }

      const stopIds = (selection.selectedStopId || selectedStop.id || '').split(',').filter(Boolean);
      for (const stopId of stopIds) {
        const key = `${selectionServiceId}:${stopId}`;
        if (!queryMap.has(key)) {
          queryMap.set(key, { serviceId: selectionServiceId, stopId, organizationId: orgId });
        }
      }
    }

    const queries = Array.from(queryMap.values());

    if (queries.length === 0) return;

    setIsLoading(slideId, true);

    try {
      // Fetch sequentially to avoid overwhelming the API
      const allArrivals: any[] = [];
      let serverErrorCount = 0;
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
          serverErrorCount++;
          console.warn('[StopArrivals] Failed to fetch arrivals:', err);
        }
      }

      // Show error only if every query hit a server error (5xx/timeout)
      if (serverErrorCount > 0 && serverErrorCount === queries.length) {
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

      let filteredArrivals: any[];

      if (columnMode && columnServiceSelections) {
        filteredArrivals = uniqueArrivals;
      } else {
        const routeFilteredArrivals = uniqueArrivals.filter(arr => {
          const selection = serviceSelections.find((s: { serviceId: any; }) => s.serviceId === arr._sourceService);
          if (!selection || !selection.enabledRouteIds || selection.enabledRouteIds.length === 0) return true;
          return selection.enabledRouteIds.includes(arr.routeId);
        });
        filteredArrivals = routeFilteredArrivals.filter(arr => {
          const selection = serviceSelections.find((s: { serviceId: any; }) => s.serviceId === arr._sourceService);
          if (!selection?.selectedHeadsignFilters || selection.selectedHeadsignFilters.length === 0) return true;
          const destination = (arr.destination || '').toLowerCase().trim();
          return selection.selectedHeadsignFilters.some((filter: string) =>
            destination === filter.toLowerCase().trim()
          );
        });
      }

      // Build routeId → line name map from serviceSelections for LIRR/Metro-North display
      const routeLineNameMap: Record<string, string> = {};
      for (const sel of serviceSelections) {
        for (const route of sel.routes || []) {
          const routeId = route.id ?? (route as any).route_id;
          const longName = route.longName ?? (route as any).route_long_name ?? '';
          if (routeId && longName) {
            // Strip common suffixes to get a compact display label
            routeLineNameMap[routeId] = longName
              .replace(/\s+Branch$/i, '')
              .replace(/\s+Line$/i, '')
              .replace(/\s+Railroad$/i, '')
              .trim();
          }
        }
      }

      // In column mode, don't cap here — the preview applies per-column caps after filtering
      const storeCap = (columnMode && columnServiceSelections) ? Infinity : MAX_ARRIVALS_PER_SLIDE;
      const cappedArrivals = storeCap === Infinity ? filteredArrivals : filteredArrivals.slice(0, storeCap);

      const displayArrivals = cappedArrivals.map(arr => {
        if (arr.routeType === 2 && routeLineNameMap[arr.routeId]) {
          return { ...arr, routeShortName: `${arr.routeShortName} ${routeLineNameMap[arr.routeId]}` };
        }
        return arr;
      });

      setScheduleData(slideId, displayArrivals);
      useFixedRouteStore.getState().setDataError(slideId, false);
    } catch (error) {
      console.error("Error fetching stop data:", error);
      useFixedRouteStore.getState().setDataError(slideId, true);
    } finally {
      setIsLoading(slideId, false);
    }
  }, [selectedStop, serviceSelections, columnMode, columnServiceSelections, slideId, setIsLoading, setScheduleData]);

  // One-time refresh when allStops loads
  useEffect(() => {
    if (!allStops.length || allStopsRefreshedRef.current) return;
    allStopsRefreshedRef.current = true;

    const freshSlide = useFixedRouteStore.getState().slides[slideId];
    const freshSelectedStop = freshSlide?.selectedStop;
    const freshSelections = freshSlide?.serviceSelections;
    if (!freshSelectedStop || !freshSelections?.length) return;

    const deduped = deduplicateStops([freshSelectedStop, ...allStops.filter((s: any) => s.name === freshSelectedStop.name)]);
    const dedupedStop = deduped[0] || freshSelectedStop;

    let changed = false;
    const updated = freshSelections.map((selection: ServiceSelection) => {
      const svc = dedupedStop.services?.find((f: any) => f.id === selection.serviceId);
      if (!svc) return selection;

      // Pass enabledRouteIds to filter direction options by active routes
      const newDirOptions = computeDirectionOptions(svc, allStops, selection.enabledRouteIds);
      const validStopIds = new Set(newDirOptions.map((o: DirectionOption) => o.stopId));
      const currentValid = validStopIds.has(selection.selectedStopId);
      const newSelectedStopId = currentValid
        ? selection.selectedStopId
        : (newDirOptions.find((o: DirectionOption) => o.isAllDirections)?.stopId || newDirOptions[0]?.stopId || selection.selectedStopId);

      // Also validate selectedHeadsignFilters - remove any that are no longer valid
      const validHeadsignFilters = new Set(newDirOptions.map((o: DirectionOption) => o.headsignFilter).filter(Boolean));
      const newSelectedHeadsignFilters = (selection.selectedHeadsignFilters || []).filter((h: any) => validHeadsignFilters.has(h));

      // Also restore routes/agencyName if they were stripped by publish
      const needsRouteRestore = (!selection.routes?.length) && svc.routes?.length;
      const needsAgencyRestore = !selection.agencyName && svc.agencyName;

      if (needsRouteRestore || needsAgencyRestore ||
          newSelectedStopId !== selection.selectedStopId ||
          JSON.stringify(newSelectedHeadsignFilters) !== JSON.stringify(selection.selectedHeadsignFilters || []) ||
          JSON.stringify(newDirOptions) !== JSON.stringify(selection.directionOptions)) {
        changed = true;
        return {
          ...selection,
          directionOptions: newDirOptions,
          selectedStopId: newSelectedStopId,
          selectedHeadsignFilters: newSelectedHeadsignFilters.length > 0 ? newSelectedHeadsignFilters : undefined,
          ...(needsRouteRestore ? { routes: svc.routes, enabledRouteIds: selection.enabledRouteIds?.length ? selection.enabledRouteIds : svc.routes.map((r: any) => r.id) } : {}),
          ...(needsAgencyRestore ? { agencyName: svc.agencyName } : {}),
        };
      }
      return selection;
    });

    if (changed) {
      setServiceSelections(slideId, updated);
    }
  }, [allStops, slideId, setServiceSelections]);

  useEffect(() => {
    if (columnMode && !columnServiceSelections && serviceSelections && serviceSelections.length > 0) {
      setColumnServiceSelections(slideId, autoSplitToColumns(serviceSelections));
    }
  }, [columnMode, columnServiceSelections, serviceSelections, setColumnServiceSelections, slideId]);

  // Migration: Initialize serviceSelections if we have selectedStop but no selections
  useEffect(() => {
    if (selectedStop && (!serviceSelections || serviceSelections.length === 0)) {
      // Re-run handleSelectStop logic to initialize serviceSelections
      const deduped = deduplicateStops([selectedStop, ...allStops.filter(s => s.name === selectedStop.name)]);
      const dedupedStop = deduped[0] || selectedStop;

      const selections: ServiceSelection[] = (dedupedStop.services || []).map((svc: any) => {
        const directionOptions = computeDirectionOptions(svc, allStops);
        const defaultStopId = directionOptions.find(o => o.isAllDirections)?.stopId
          || directionOptions[0]?.stopId
          || selectedStop.id;

        return {
          serviceId: svc.id,
          organizationId: svc.organizationId,
          agencyName: svc.agencyName,
          routes: svc.routes,
          enabled: true,
          selectedStopId: defaultStopId,
          directionOptions,
          enabledRouteIds: svc.routes?.map((r: any) => r.id) || []
        };
      });

      if (selections.length > 0) {
        setServiceSelections(slideId, selections);
      }
    }
  }, [selectedStop, allStops, serviceSelections, setServiceSelections, slideId]);

  useEffect(() => {
    if (!selectedStop || !serviceSelections?.length) return;
    if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
    fetchDebounceRef.current = setTimeout(() => { fetchData(); }, 150);
    return () => { if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current); };
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

  const selectedRouteIds = new Set(
    serviceSelections.flatMap((s: { routes: any; }) => (s.routes || []).map((r: RouteInfo) => r.id ?? (r as any).route_id))
  );
  const filteredLinkedStops = linkedStops.filter(stop =>
    getUniqueRoutes(stop.services).some(r => !selectedRouteIds.has(r.id))
  );

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
        <div className="flex-1 min-w-0 bg-white overflow-x-hidden">
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[#4a5568] font-medium">
                    Fixed Route Stop
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#718096]">Search by:</span>
                    <div className="flex rounded border border-[#cbd5e0] overflow-hidden text-xs">
                      <button
                        onClick={() => {
                          if (routeSearchMode) {
                            setRouteSearchMode(false);
                            setRouteQuery('');
                            setRouteResults([]);
                            setSelectedRouteForStop(null);
                            setRouteStops([]);
                          }
                        }}
                        className={`px-3 py-1 transition-colors ${!routeSearchMode ? 'bg-blue-600 text-white' : 'bg-white text-[#4a5568] hover:bg-gray-50'}`}
                      >
                        Stop
                      </button>
                      <button
                        onClick={() => {
                          if (!routeSearchMode) {
                            setRouteSearchMode(true);
                          }
                        }}
                        className={`px-3 py-1 border-l border-[#cbd5e0] transition-colors ${routeSearchMode ? 'bg-blue-600 text-white' : 'bg-white text-[#4a5568] hover:bg-gray-50'}`}
                      >
                        Route
                      </button>
                    </div>
                  </div>
                </div>

                {routeSearchMode ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        className="bg-white border-[#cbd5e0]"
                        value={routeQuery}
                        onChange={(e) => handleRouteQueryChange(e.target.value)}
                        onBlur={() => setTimeout(() => setRouteResults([]), 200)}
                        placeholder="Search by route number or name (e.g. E, 117, 8 Avenue…)"
                      />
                      {(isSearchingRoutes || routeResults.length > 0) && (
                        <ul className="absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                          {isSearchingRoutes && (
                            <li className="px-4 py-2 text-gray-500 italic text-sm">Searching routes...</li>
                          )}
                          {routeResults.map((route, i) => (
                            <li
                              key={i}
                              onMouseDown={() => handleSelectRouteForStop(route)}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black flex items-center gap-2"
                            >
                              {route.route_short_name && (
                                <span
                                  className="px-2 py-0.5 rounded text-xs font-bold flex-shrink-0"
                                  style={{
                                    backgroundColor: route.route_color ? `#${route.route_color}` : '#6b7280',
                                    color: route.route_text_color ? `#${route.route_text_color}` : '#ffffff',
                                  }}
                                >
                                  {route.route_short_name}
                                </span>
                              )}
                              <span className="text-sm">{route.route_long_name || route.route_desc}</span>
                              {route.services?.[0]?.agency_name && (
                                <span className="text-gray-400 text-xs ml-auto flex-shrink-0">{route.services[0].agency_name}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {selectedRouteForStop && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">
                          {isLoadingRouteStops
                            ? 'Loading stops along route...'
                            : routeStops.length > 0
                            ? `${routeStops.length} stops on this route — pick one:`
                            : 'No stops found for this route.'}
                        </p>
                        {isLoadingRouteStops && (
                          <div className="flex items-center gap-2 py-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                          </div>
                        )}
                        {!isLoadingRouteStops && routeStops.length > 0 && (
                          <ul className="border rounded bg-white max-h-56 overflow-y-auto shadow-sm">
                            {routeStops.map((stop: any, i: number) => (
                              <li
                                key={i}
                                onClick={() => handleSelectStopFromRoute(stop)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-black border-b last:border-b-0 flex items-center gap-2"
                              >
                                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                {stop.name || stop.stopName}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
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
                        setTimeout(() => setShowDropdown(false), 200);
                      }}
                      placeholder="Search by stop name "
                    />
                    {showDropdown && filteredStops.length > 0 && (
                      <ul className="absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                        {isSearching && (
                          <li key="searching" className="px-4 py-2 text-gray-500 italic text-sm">
                            Searching stops...
                          </li>
                        )}
                        {deduplicateStops(filteredStops).map((stop, index) => (
                          <li
                            key={index}
                            onClick={() => handleSelectStop(stop)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black flex items-center gap-1.5"
                          >
                            {(stop as any).wheelchairBoarding === 1 && (
                              <span title="Wheelchair accessible" className="text-blue-500 flex-shrink-0">♿</span>
                            )}
                            <span>
                              {stop.name} -{" "}
                              {stop.services[0]?.agencyName || "No Agency"}
                              {stop.services.length > 1 && (
                                <span className="text-gray-400 text-xs ml-1">
                                  (+{stop.services.length - 1} more)
                                </span>
                              )}
                              {(stop as any).distance !== undefined && (
                                <span className="text-gray-500 text-sm ml-2">
                                  ({formatDistance((stop as any).distance)})
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
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
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-sm text-[#606061]">{selectedStop.name}</p>
                        {selectedStop.wheelchairBoarding === 1 && (
                          <span title="Wheelchair accessible" className="text-blue-500 text-sm">♿</span>
                        )}
                      </div>
                      <p className="text-xs text-[#718096]">
                        {selectedStop.services[0]?.agencyName || "No Agency"}
                      </p>
                      {selectedStop.distance !== undefined && (
                        <p className="text-xs text-[#718096] mt-1">
                          Distance: {formatDistance(selectedStop.distance)}
                        </p>
                      )}
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedStop.lat},${selectedStop.lon}`}
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

                      {/* Column mode: tab selector */}
                      {columnMode && columnServiceSelections && (
                        <div className="flex gap-1 mb-3">
                          {([0, 1] as const).map((tabIdx) => (
                            <button
                              key={tabIdx}
                              onClick={() => setColumnActiveTab(tabIdx)}
                              className={`px-4 py-1.5 text-xs font-medium rounded border transition-colors ${
                                columnActiveTab === tabIdx
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {columnLabels[tabIdx]}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3">
                        {(() => {
                          const activeSels: ServiceSelection[] = columnMode && columnServiceSelections
                            ? columnServiceSelections[columnActiveTab]
                            : serviceSelections;
                          const setActiveSels = (updated: ServiceSelection[]) => {
                            if (columnMode && columnServiceSelections) {
                              const next: [ServiceSelection[], ServiceSelection[]] = [
                                ...columnServiceSelections as [ServiceSelection[], ServiceSelection[]]
                              ];
                              next[columnActiveTab] = updated;
                              setColumnServiceSelections(slideId, next);
                            } else {
                              setServiceSelections(slideId, updated);
                            }
                          };
                          const visibleSels = servicesExpanded ? activeSels : activeSels.slice(0, MAX_VISIBLE_SERVICES);
                          return (
                            <>
                              {visibleSels.map((sel: any, index: number) => {
                              // In column mode, merge display-only fields (routes, directionOptions,
                              // agencyName) from serviceSelections — those aren't stored in columnServiceSelections
                              const baseDisplay: any = (columnMode && columnServiceSelections)
                                ? (serviceSelections || []).find((s: any) => s.serviceId === sel.serviceId) || {}
                                : {};
                              // Use ?? so explicit undefined values in sel (from autoSplitToColumns spreading stripped
                              // serviceSelections) don't override display-only fields from baseDisplay
                              const selection = {
                                ...baseDisplay,
                                ...sel,
                                routes: sel.routes ?? baseDisplay.routes,
                                agencyName: sel.agencyName ?? baseDisplay.agencyName,
                                directionOptions: sel.directionOptions ?? baseDisplay.directionOptions,
                                headsignAliases: sel.headsignAliases ?? baseDisplay.headsignAliases,
                              };
                              return (
                              <div
                            key={`${selection.serviceId}-${index}`}
                            className="p-3 bg-white rounded-lg border min-w-0"
                          >
                            {/* Route badges row */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <Checkbox
                                checked={selection.enabled}
                                onCheckedChange={(checked) => {
                                  const updated = activeSels.map((s: any, i: any) =>
                                    i === index ? { ...s, enabled: !!checked } : s
                                  );
                                  setActiveSels(updated);
                                }}
                              />
                              {selection.routes && selection.routes.length > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {selection.routes.map((route: RouteInfo, routeIdx: number) => {
                                    const routeId = route.id ?? (route as any).route_id;
                                    const isRouteEnabled = !selection.enabledRouteIds ||
                                      selection.enabledRouteIds.includes(routeId);
                                    const canToggle = selection.enabled && selection.routes!.length > 1;

                                    return (
                                      <button
                                        key={routeId ?? routeIdx}
                                        disabled={!canToggle}
                                        onClick={() => {
                                          if (!canToggle) return;
                                          const currentEnabled = selection.enabledRouteIds ||
                                            selection.routes!.map((r: RouteInfo) => r.id);
                                          // Prevent disabling all routes
                                          if (isRouteEnabled && currentEnabled.length === 1) return;
                                          const newEnabled = isRouteEnabled
                                            ? currentEnabled.filter((id: string) => id !== route.id)
                                            : [...currentEnabled, route.id];

                                          // Recalculate direction options based on new enabled routes
                                          const svc = selectedStop.services?.find((f: any) => f.id === selection.serviceId);
                                          const newDirOptions = svc ? computeDirectionOptions(svc, allStops, newEnabled) : selection.directionOptions;
                                          // Remove any headsign filters that are no longer valid
                                          const validHeadsigns = new Set(newDirOptions.map((o: { headsignFilter: any; }) => o.headsignFilter).filter(Boolean));
                                          const newHeadsignFilters = (selection.selectedHeadsignFilters || []).filter((h: unknown) => validHeadsigns.has(h));

                                          const updated = activeSels.map((s: any, i: any) =>
                                            i === index ? { ...s, enabledRouteIds: newEnabled, directionOptions: newDirOptions, selectedHeadsignFilters: newHeadsignFilters.length > 0 ? newHeadsignFilters : undefined } : s
                                          );
                                          setActiveSels(updated);
                                        }}
                                        className={`px-2 py-0.5 rounded text-xs font-bold min-w-[24px] text-center transition-opacity ${
                                          canToggle ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-400' : ''
                                        } ${isRouteEnabled ? 'opacity-100' : 'opacity-30'}`}
                                        style={{
                                          backgroundColor: route.color ? `#${route.color}` : '#6b7280',
                                          color: route.textColor ? `#${route.textColor}` : '#ffffff'
                                        }}
                                        title={canToggle ? `Click to ${isRouteEnabled ? 'hide' : 'show'} ${route.shortName || route.id} arrivals` : undefined}
                                      >
                                        {route.shortName || route.id}
                                      </button>
                                    );
                                  })}
                                  {/* Select All button for services with many routes */}
                                  {selection.enabled && selection.routes.length > 3 && (
                                    <button
                                      onClick={() => {
                                        const allRouteIds = selection.routes!.map((r: RouteInfo) => r.id);
                                        // Recalculate direction options with all routes enabled
                                        const svc = selectedStop.services?.find((f: any) => f.id === selection.serviceId);
                                        const newDirOptions = svc ? computeDirectionOptions(svc, allStops, allRouteIds) : selection.directionOptions;
                                        // Keep headsign filters that are still valid
                                        const validHeadsigns = new Set(newDirOptions.map((o: { headsignFilter: any; }) => o.headsignFilter).filter(Boolean));
                                        const newHeadsignFilters = (selection.selectedHeadsignFilters || []).filter((h: unknown) => validHeadsigns.has(h));
                                        const updated = activeSels.map((s: any, i: any) =>
                                          i === index ? { ...s, enabledRouteIds: allRouteIds, directionOptions: newDirOptions, selectedHeadsignFilters: newHeadsignFilters.length > 0 ? newHeadsignFilters : undefined } : s
                                        );
                                        setActiveSels(updated);
                                      }}
                                      className="text-xs text-blue-600 hover:underline ml-1"
                                    >
                                      Select All
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-[#4a5568]">
                                  {selection.agencyName}
                                </span>
                              )}
                            </div>

                            {/* Direction toggles row */}
                            {selection.enabled && (selection.directionOptions?.length ?? 0) > 1 && (() => {
                              const allOpts = selection.directionOptions || [];
                              const headsignOpts = allOpts.filter((o: DirectionOption) => !o.isAllDirections && o.headsignFilter);
                              const groupOpts = allOpts.filter((o: DirectionOption) => !o.isAllDirections && !o.headsignFilter && o.groupHeadsigns);
                              const topOpts = allOpts.filter((o: DirectionOption) => o.isAllDirections || (!o.headsignFilter && !o.groupHeadsigns));
                              // Show top-level options + group shortcuts on first row; individual headsigns on second row
                              const firstRowOpts = [...topOpts, ...groupOpts];
                              const isEditing = editingHeadsignsFor === selection.serviceId;
                              return (
                                <>
                                  <div className="flex items-center gap-1.5 ml-6 flex-wrap mt-2">
                                    {firstRowOpts.map((opt: DirectionOption) => {
                                      const currentFilters = selection.selectedHeadsignFilters || [];
                                      const normalizeIds = (s: string) =>
                                        (s || '').split(',').map(x => x.trim()).filter(Boolean).sort().join(',');

                                      let isSelected: boolean;
                                      if (opt.isAllDirections) {
                                        isSelected = !opt.headsignFilter
                                          ? currentFilters.length === 0 && normalizeIds(selection.selectedStopId) === normalizeIds(opt.stopId)
                                          : currentFilters.length === 0;
                                      } else if (opt.groupHeadsigns) {
                                        isSelected = opt.groupHeadsigns.every(h => currentFilters.includes(h));
                                      } else {
                                        isSelected = normalizeIds(selection.selectedStopId) === normalizeIds(opt.stopId);
                                      }

                                      const displayLabel = opt.isAllDirections ? 'All' : String(opt.label).replace('bound', '');

                                      return (
                                        <button
                                          key={String(opt.label)}
                                          onClick={() => {
                                            let newFilters: string[];
                                            if (opt.isAllDirections) {
                                              newFilters = [];
                                            } else if (opt.groupHeadsigns) {
                                              const allSelected = opt.groupHeadsigns.every(h => currentFilters.includes(h));
                                              if (allSelected) {
                                                newFilters = currentFilters.filter((f: string) => !opt.groupHeadsigns!.includes(f));
                                              } else {
                                                const toAdd = opt.groupHeadsigns.filter(h => !currentFilters.includes(h));
                                                newFilters = [...currentFilters, ...toAdd];
                                              }
                                            } else {
                                              newFilters = [];
                                            }
                                            const updated = activeSels.map((s: any, i: any) =>
                                              i === index ? {
                                                ...s,
                                                selectedStopId: opt.stopId,
                                                selectedHeadsignFilters: newFilters.length > 0 ? newFilters : undefined
                                              } : s
                                            );
                                            setActiveSels(updated);
                                          }}
                                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                            isSelected
                                              ? 'bg-blue-600 text-white border-blue-600'
                                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                          }`}
                                        >
                                          {displayLabel}
                                        </button>
                                      );
                                    })}
                                    {/* Individual headsign buttons (second row when grouped, or inline for plain headsigns) */}
                                    {headsignOpts.map((opt: DirectionOption) => {
                                      const currentFilters = selection.selectedHeadsignFilters || [];
                                      const isSelected = opt.headsignFilter ? currentFilters.includes(opt.headsignFilter) : false;
                                      const savedAlias = opt.headsignFilter
                                        ? (serviceSelections || []).find((s: any) => s.serviceId === selection.serviceId)?.headsignAliases?.[opt.headsignFilter]
                                        : undefined;
                                      const displayLabel = opt.headsignFilter
                                        ? (isEditing && headsignDraft[opt.headsignFilter] !== undefined
                                          ? (headsignDraft[opt.headsignFilter] || opt.headsignFilter)
                                          : (savedAlias || opt.headsignFilter))
                                        : opt.label;
                                      return (
                                        <button
                                          key={`hs-${opt.headsignFilter}`}
                                          onClick={() => {
                                            const f = opt.headsignFilter!;
                                            let newFilters: string[];
                                            if (currentFilters.includes(f)) {
                                              newFilters = currentFilters.filter((x: string) => x !== f);
                                            } else {
                                              newFilters = [...currentFilters, f];
                                            }
                                            const updated = activeSels.map((s: any, i: any) =>
                                              i === index ? {
                                                ...s,
                                                selectedHeadsignFilters: newFilters.length > 0 ? newFilters : undefined
                                              } : s
                                            );
                                            setActiveSels(updated);
                                          }}
                                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                            isSelected
                                              ? 'bg-blue-500 text-white border-blue-500'
                                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                          }`}
                                        >
                                          {displayLabel}
                                        </button>
                                      );
                                    })}
                                    {/* Rename button — only show if there are headsign options */}
                                    {headsignOpts.length > 0 && (
                                      <button
                                        onClick={() => {
                                          if (isEditing) {
                                            setEditingHeadsignsFor(null);
                                          } else {
                                            // Read current aliases directly from serviceSelections to avoid stale merge
                                            const baseSel = (serviceSelections || []).find((s: any) => s.serviceId === selection.serviceId);
                                            const draft: Record<string, string> = {};
                                            headsignOpts.forEach((o: DirectionOption) => {
                                              draft[o.headsignFilter!] = baseSel?.headsignAliases?.[o.headsignFilter!] ?? o.headsignFilter!;
                                            });
                                            setHeadsignDraft(draft);
                                            setEditingHeadsignsFor(selection.serviceId);
                                          }
                                        }}
                                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 ml-1"
                                        title="Rename headsigns"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  {/* Inline headsign rename form */}
                                  {isEditing && headsignOpts.length > 0 && (
                                    <div className="ml-6 mt-2 space-y-1">
                                      {headsignOpts.map((opt: DirectionOption) => (
                                        <div key={opt.headsignFilter} className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-400 w-24 truncate shrink-0" title={opt.headsignFilter}>{opt.headsignFilter}</span>
                                          <span className="text-xs text-gray-300">→</span>
                                          <input
                                            type="text"
                                            value={headsignDraft[opt.headsignFilter!] ?? opt.headsignFilter ?? ''}
                                            onChange={(e) => {
                                              const newDraft = { ...headsignDraft, [opt.headsignFilter!]: e.target.value };
                                              setHeadsignDraft(newDraft);
                                              // Save to store immediately so toggle labels and preview update live
                                              const newAliases: Record<string, string> = {};
                                              headsignOpts.forEach((o: DirectionOption) => {
                                                const val = (newDraft[o.headsignFilter!] ?? '').trim();
                                                if (val && val !== o.headsignFilter) {
                                                  newAliases[o.headsignFilter!] = val;
                                                }
                                              });
                                              const aliases = Object.keys(newAliases).length > 0 ? newAliases : undefined;
                                              const updatedBase = (serviceSelections || []).map((s: any) =>
                                                s.serviceId === selection.serviceId ? { ...s, headsignAliases: aliases } : s
                                              );
                                              setServiceSelections(slideId, updatedBase);
                                            }}
                                            onBlur={() => {
                                              // Final save on blur (trim whitespace edge cases)
                                              const newAliases: Record<string, string> = {};
                                              headsignOpts.forEach((o: DirectionOption) => {
                                                const val = (headsignDraft[o.headsignFilter!] ?? '').trim();
                                                if (val && val !== o.headsignFilter) {
                                                  newAliases[o.headsignFilter!] = val;
                                                }
                                              });
                                              const aliases = Object.keys(newAliases).length > 0 ? newAliases : undefined;
                                              const updatedBase = (serviceSelections || []).map((s: any) =>
                                                s.serviceId === selection.serviceId ? { ...s, headsignAliases: aliases } : s
                                              );
                                              setServiceSelections(slideId, updatedBase);
                                            }}
                                            className="flex-1 min-w-0 text-xs border rounded px-1.5 py-0.5 h-6 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            placeholder={opt.headsignFilter ?? ''}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ); })}
                        {activeSels.length > MAX_VISIBLE_SERVICES && (
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
                                Show {activeSels.length - MAX_VISIBLE_SERVICES} more
                              </>
                            )}
                          </Button>
                        )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Also at this location - Station Complex */}
              {selectedStop && filteredLinkedStops.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-hidden">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Also at this location
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredLinkedStops.map((stop, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white rounded border p-2 min-w-0"
                      >
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {stop.name}
                          </p>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {getUniqueRoutes(stop.services).slice(0, MAX_DISPLAYED_ROUTES).map((route: ExpandedRoute, routeIdx: number) => (
                              <span
                                key={route.id ?? routeIdx}
                                className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                                style={{
                                  backgroundColor: route.color ? `#${route.color}` : '#6b7280',
                                  color: route.textColor ? `#${route.textColor}` : '#ffffff'
                                }}
                              >
                                {route.shortName || route.id}
                              </span>
                            ))}
                            {getUniqueRoutes(stop.services).length > MAX_DISPLAYED_ROUTES && (
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                +{getUniqueRoutes(stop.services).length - MAX_DISPLAYED_ROUTES} more
                              </span>
                            )}
                          </div>
                          {getUniqueHeadsigns(stop.services).length > 0 && (
                            <p className="text-xs text-gray-500 mt-1 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {getUniqueHeadsigns(stop.services).join(' · ')}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 text-xs flex-shrink-0"
                          onClick={() => handleAddLinkedStop(stop)}
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
                  Display Name Override
                </label>
                <Input
                  placeholder={selectedStop?.name || selectedStop?.stop_name || "Leave blank to use agency name"}
                  className="bg-white border-[#cbd5e0]"
                  value={displayName}
                  onChange={(e) => setDisplayName(slideId, e.target.value)}
                />
                <p className="text-xs text-[#718096] mt-1">
                  Override the station name shown on screen. Leave blank to use the agency-provided name.
                </p>
              </div>

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
              <label className="flex items-center gap-2 text-[#4a5568] font-medium text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnMode}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setColumnMode(slideId, enabled);
                    if (enabled && serviceSelections.length > 0 && !columnServiceSelections) {
                      setColumnServiceSelections(slideId, autoSplitToColumns(serviceSelections));
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300"
                />
                Split View (2 Columns)
              </label>
            </div>

            {columnMode && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`show-col-headers-${slideId}`}
                    checked={showColumnHeaders}
                    onChange={(e) => setShowColumnHeaders(slideId, e.target.checked)}
                    className="w-3.5 h-3.5"
                  />
                  <label htmlFor={`show-col-headers-${slideId}`} className="text-[#4a5568] text-xs cursor-pointer">
                    Show column headers
                  </label>
                </div>
                {showColumnHeaders && (
                  <>
                    <div>
                      <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                        Left Column Header
                      </label>
                      <Input
                        value={columnLabels[0]}
                        className="flex-1 text-xs"
                        onChange={(e) => setColumnLabels(slideId, [e.target.value, columnLabels[1]])}
                      />
                    </div>
                    <div>
                      <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                        Right Column Header
                      </label>
                      <Input
                        value={columnLabels[1]}
                        className="flex-1 text-xs"
                        onChange={(e) => setColumnLabels(slideId, [columnLabels[0], e.target.value])}
                      />
                    </div>
                    <div>
                      <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                        Header Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="colorContainer">
                          <input
                            type="color"
                            value={columnHeaderBgColor}
                            onChange={(e) => setColumnHeaderBgColor(slideId, e.target.value)}
                            className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                          />
                        </div>
                        <Input
                          value={columnHeaderBgColor}
                          className="flex-1 text-xs"
                          onChange={(e) => setColumnHeaderBgColor(slideId, e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                        Header Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="colorContainer">
                          <input
                            type="color"
                            value={columnHeaderTextColor}
                            onChange={(e) => setColumnHeaderTextColor(slideId, e.target.value)}
                            className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                          />
                        </div>
                        <Input
                          value={columnHeaderTextColor}
                          className="flex-1 text-xs"
                          onChange={(e) => setColumnHeaderTextColor(slideId, e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                        Header Text Size ({columnHeaderTextSize})
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={columnHeaderTextSize}
                        onChange={(e) => setColumnHeaderTextSize(slideId, Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </>
            )}

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
                    id={`skip-on-error-fr-${slideId}`}
                    checked={skipOnError}
                    onChange={(e) => setSkipOnError(slideId, e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-500"
                  />
                  <label htmlFor={`skip-on-error-fr-${slideId}`} className="text-xs text-[#4a5568]">Skip this slide when data is unavailable</label>
                </div>
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
