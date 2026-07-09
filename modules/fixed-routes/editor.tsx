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
import React, { useEffect, useRef, useState, useCallback, JSXElementConstructor, ReactElement, ReactNode, ReactPortal, Key } from "react";
import { useFixedRouteStore, ServiceSelection, DirectionOption, RouteInfo } from "./store";
import { useGeneralStore } from "@/stores/general";
import { useLocalSaveStatus } from "@/hooks/useLocalSaveStatus";
import { useImageUploadField } from "@/hooks/useImageUploadField";
import { fetchAllStops } from "@/services/data-gathering/fetchAllStops";
import { fetchStopData, MAX_ARRIVALS_PER_SLIDE } from "@/services/data-gathering/fetchStopData";
import { matchesHeadsign } from "@/lib/stop-arrivals-filters";
import { fetchRoutes } from "@/services/data-gathering/fetchRoutes";
import { fetchRoutePatterns } from "@/services/route-times/routeDataFetcher";
import { calculateDistance, formatDistance } from "@/utils/distance";
import type { ExpandedStop, ExpandedService, ExpandedRoute, ExpandedLinkedStop } from "@/types/nysdot-stops";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY as string;

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
        const directionalStopId = directionalByLabel.get(label)!.join(',');
        if (headsigns.length > 0) {
          options.push({ stopId: directionalStopId, label, isAllDirections: false, groupHeadsigns: headsigns });
          for (const headsign of headsigns) {
            options.push({ stopId: directionalStopId, label: headsign, isAllDirections: false, headsignFilter: headsign, directionGroup: label });
          }
        } else {
          options.push({ stopId: directionalStopId, label, isAllDirections: false });
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
    // Build per-(routeShortName, headsign) pairs so each route gets its own rename card
    const headsignPairs: Array<{ original: string; normalized: string; routeShortName: string }> = [];
    const seenPairs = new Set<string>();
    for (const stopId of stopIds) {
      const data = stopIdDataWithHeadsigns[stopId];
      if (data?.routes) {
        for (const route of data.routes) {
          if (!enabledRouteIds || enabledRouteIds.includes(route.id)) {
            const rsn = route.shortName || '';
            for (const headsign of route.headsigns || []) {
              const normalized = headsign.toLowerCase().trim();
              const pairKey = `${rsn}|${normalized}`;
              if (!seenPairs.has(pairKey)) {
                seenPairs.add(pairKey);
                headsignPairs.push({ original: headsign, normalized, routeShortName: rsn });
              }
            }
          }
        }
      }
    }

    const uniqueHeadsigns = new Set(headsignPairs.map(p => p.normalized));
    if (uniqueHeadsigns.size > 1) {
      options.push({
        stopId: stopIds.join(','),
        label: 'All Directions',
        isAllDirections: true
      });

      const sortedPairs = [...headsignPairs].sort((a, b) =>
        a.routeShortName.localeCompare(b.routeShortName) || a.normalized.localeCompare(b.normalized)
      );
      for (const { original, normalized, routeShortName } of sortedPairs) {
        options.push({
          stopId: stopIds.join(','),
          label: original,
          isAllDirections: false,
          headsignFilter: normalized,
          routeShortName: routeShortName || undefined,
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
            const existingRouteIdx = existingService.routes.findIndex((r: any) => r.id === route.id);
            if (existingRouteIdx === -1) {
              existingService.routes.push(route);
            } else {
              // Same route on a different platform — merge headsigns so the combined
              // service entry has all destinations (e.g. both northbound and southbound).
              const existingRoute = existingService.routes[existingRouteIdx];
              const merged = new Set<string>([...(existingRoute.headsigns || []), ...(route.headsigns || [])]);
              existingRoute.headsigns = Array.from(merged);
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

function NearbyStopMap({
  nearbyStops,
  coordinates,
  mapContainerRef,
  mapRef,
  markersRef,
  onSelectStop,
}: {
  nearbyStops: ExpandedStop[];
  coordinates: { lat: number; lng: number };
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
  markersRef: React.MutableRefObject<mapboxgl.Marker[]>;
  onSelectStop: (stop: ExpandedStop) => void;
}) {
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const center: [number, number] = coordinates.lng && coordinates.lat
      ? [coordinates.lng, coordinates.lat]
      : [-74.006, 40.7128];

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 14,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    nearbyStops.forEach((stop) => {
      const lon = (stop as any).lon ?? (stop as any).lng;
      const lat = (stop as any).lat;
      if (lat == null || lon == null) return;

      const el = document.createElement('div');
      el.style.cssText = `
        width: 28px; height: 28px;
        background: #2563eb; border: 2px solid white;
        border-radius: 50%; cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      `;
      const dot = document.createElement('div');
      dot.style.cssText = 'width:8px;height:8px;background:white;border-radius:50%';
      el.appendChild(dot);

      const popup = new mapboxgl.Popup({ offset: 16, closeButton: false, maxWidth: '220px' })
        .setHTML(`
          <div style="font-size:13px;font-weight:600;color:#1e293b;line-height:1.3">${stop.name}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">${(stop as any).services?.[0]?.agencyName ?? ''}</div>
          ${(stop as any).distance != null ? `<div style="font-size:11px;color:#94a3b8;margin-top:1px">${formatDistance((stop as any).distance)}</div>` : ''}
          <button id="select-stop-btn" style="margin-top:6px;background:#2563eb;color:white;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;width:100%">Select this stop</button>
        `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => marker.togglePopup());

      popup.on('open', () => {
        setTimeout(() => {
          const btn = document.getElementById('select-stop-btn');
          if (btn) btn.addEventListener('click', () => onSelectStop(stop));
        }, 0);
      });

      markersRef.current.push(marker);
    });
  }, [nearbyStops, onSelectStop]);

  return (
    <div className="rounded border border-[#cbd5e0] overflow-hidden" style={{ height: '280px' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default function StopArrivalsSlide({
  slideId,
  handleDelete,
  handlePreview,
  handlePublish,
  handleOpenSettings,
}: {
  slideId: string;
  handleDelete: (id: string) => void;
  handlePreview: () => void;
  handlePublish: () => void;
  handleOpenSettings: () => void;
}) {
  const allStopsRefreshedRef = useRef(false);
  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [discoveredRoutes, setDiscoveredRoutes] = useState<Record<string, RouteInfo[]>>({});
  const [allStops, setAllStops] = useState<ExpandedStop[]>([]);
  const [filteredStops, setFilteredStops] = useState<ExpandedStop[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [nearbyStops, setNearbyStops] = useState<ExpandedStop[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [linkedStops, setLinkedStops] = useState<ExpandedLinkedStop[]>([]); // Stops in same station complex

  // Stop search mode: 'stop' | 'route' | 'nearby'
  const [searchMode, setSearchMode] = useState<'stop' | 'route' | 'nearby'>('stop');
  const [routeQuery, setRouteQuery] = useState('');
  const [routeResults, setRouteResults] = useState<any[]>([]);
  const [isSearchingRoutes, setIsSearchingRoutes] = useState(false);
  const [selectedRouteForStop, setSelectedRouteForStop] = useState<any>(null);
  const [routeStops, setRouteStops] = useState<any[]>([]);
  const [isLoadingRouteStops, setIsLoadingRouteStops] = useState(false);
  const routeSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeCacheRef = useRef<any[]>([]);

  // Nearby map refs
  const nearbyMapContainerRef = useRef<HTMLDivElement | null>(null);
  const nearbyMapRef = useRef<mapboxgl.Map | null>(null);
  const nearbyMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const stopName = useFixedRouteStore(
    (state: { slides: { [x: string]: { stopName: any; }; }; }) => state.slides[slideId]?.stopName || ""
  );
  const setStopName = useFixedRouteStore((state: { setStopName: any; }) => state.setStopName);

  const displayName = useFixedRouteStore(
    (state: { slides: { [x: string]: { displayName: any; }; }; }) => state.slides[slideId]?.displayName ?? ""
  );
  const setDisplayName = useFixedRouteStore((state: { setDisplayName: any; }) => state.setDisplayName);
  const showDisplayName = useFixedRouteStore((state: any) => state.slides[slideId]?.showDisplayName !== false);
  const setShowDisplayName = useFixedRouteStore((state: any) => state.setShowDisplayName);

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
  const minArrivalMinutes = useFixedRouteStore((state: any) => state.slides[slideId]?.minArrivalMinutes ?? 0);
  const setMinArrivalMinutes = useFixedRouteStore((state: any) => state.setMinArrivalMinutes);

  const showTitleHtml = useFixedRouteStore((state: any) => state.slides[slideId]?.showTitleHtml || false);
  const setShowTitleHtml = useFixedRouteStore((state: any) => state.setShowTitleHtml);
  const subtitleText = useFixedRouteStore((state: any) => state.slides[slideId]?.subtitleText ?? '');
  const setSubtitleText = useFixedRouteStore((state: any) => state.setSubtitleText);
  const showSubtitle = useFixedRouteStore((state: any) => state.slides[slideId]?.showSubtitle !== false);
  const setShowSubtitle = useFixedRouteStore((state: any) => state.setShowSubtitle);
  const logoHeightOverride = useFixedRouteStore((state: any) => state.slides[slideId]?.logoHeightOverride);
  const setLogoHeightOverride = useFixedRouteStore((state: any) => state.setLogoHeightOverride);
  const showTableColumnHeaders = useFixedRouteStore((state: any) => state.slides[slideId]?.showTableColumnHeaders || false);
  const setShowTableColumnHeaders = useFixedRouteStore((state: any) => state.setShowTableColumnHeaders);
  const tableHeaderLeft = useFixedRouteStore((state: any) => state.slides[slideId]?.tableHeaderLeft ?? 'Transit Service Line');
  const setTableHeaderLeft = useFixedRouteStore((state: any) => state.setTableHeaderLeft);
  const tableHeaderRight = useFixedRouteStore((state: any) => state.slides[slideId]?.tableHeaderRight ?? 'Est Arrival Time');
  const setTableHeaderRight = useFixedRouteStore((state: any) => state.setTableHeaderRight);

  const showFooter = useGeneralStore((state) => state.slides.find((s) => s.id === slideId)?.showFooter ?? true);
  const setShowFooter = useGeneralStore((state) => state.setShowFooter);

  const shortcode = useGeneralStore((state) => state.shortcode || "");
  const coordinates = useGeneralStore(
    (state) => state.coordinates || { lat: 0, lng: 0 }
  );

  const setScheduleData = useFixedRouteStore((state: { setScheduleData: any; }) => state.setScheduleData);
  const liveArrivals = useFixedRouteStore((state: any) => state.slides[slideId]?.scheduleData || []);

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
        const exactShortName = deduped.filter(r => r.route_short_name?.toLowerCase() === q);
        const startsWithShortName = deduped.filter(r => {
          const sn = r.route_short_name?.toLowerCase();
          return sn && sn !== q && sn.startsWith(q);
        });
        const longNameContains = deduped.filter(r => {
          const sn = r.route_short_name?.toLowerCase();
          return (!sn || !sn.startsWith(q)) && r.route_long_name?.toLowerCase().includes(q);
        });
        setRouteResults([...exactShortName, ...startsWithShortName, ...longNameContains].slice(0, 15));
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
      const allServices: Array<{ organization_guid: string; service_guid: string }> =
        route.services?.map((s: any) => ({
          organization_guid: s.organization_guid,
          service_guid: s.service_guid,
        })) || [];

      // Try each service in order until one returns stops
      let patternData: any = null;
      for (const service of allServices) {
        patternData = await fetchRoutePatterns({
          route_id: route.route_id,
          route_short_name: route.route_short_name,
          route_long_name: route.route_long_name,
          services: [service],
        });
        if (patternData?.stops?.length > 0) break;
      }

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
      // First attempt: coordinate + name within 400m (covers stations where SKIDS
      // and NYSDOT coordinates differ by up to a few hundred meters).
      let results = await fetchAllStops({
        coordinates: { lat: routeStop.lat, lng: routeStop.lon },
        radius: 400,
        search: routeStop.name,
      });

      // Fallback: if name didn't match, search by proximity only — the closest stop
      // to the route stop's coordinates is almost always the right one.
      if (!results?.length) {
        results = await fetchAllStops({
          coordinates: { lat: routeStop.lat, lng: routeStop.lon },
          radius: 400,
        });
      }

      const deduped = deduplicateStops(results);
      const match = deduped[0];
      if (match) {
        handleSelectStop(match);
      }
    } catch {
      // nothing
    } finally {
      setIsLoadingRouteStops(false);
      setSearchMode('stop');
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
        enabledRouteIds: undefined
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

        // Union routes across both stops so linked-only routes (e.g. 100/107 on 02168)
        // are selectable and renameable; enable the new ones by default.
        const existingRoutes = existing.routes || [];
        const existingRouteIds = new Set(existingRoutes.map((r: any) => r.id));
        const addedRoutes = (linkedService.routes || []).filter((r: any) => r.id && !existingRouteIds.has(r.id));
        const mergedRoutes = [...existingRoutes, ...addedRoutes];
        const mergedEnabledRouteIds = existing.enabledRouteIds
          ? Array.from(new Set([...existing.enabledRouteIds, ...addedRoutes.map((r: any) => r.id)]))
          : undefined;

        updatedSelections[existingIndex] = {
          ...existing,
          routes: mergedRoutes,
          ...(mergedEnabledRouteIds ? { enabledRouteIds: mergedEnabledRouteIds } : {}),
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
          enabledRouteIds: undefined
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
      // serviceId -> authoritative routes serving the stop (from skids), keyed by
      // route id so peak-only routes stay in the badge list even with no arrivals.
      const servingByService: Record<string, Map<string, RouteInfo>> = {};
      let serverErrorCount = 0;
      for (const q of queries) {
        try {
          const data = await fetchStopData(q.stopId, q.serviceId, q.organizationId);
          for (const r of ((data as any)?.routes || []) as RouteInfo[]) {
            const rid = r.id ?? (r as any).route_id;
            if (!rid) continue;
            if (!servingByService[q.serviceId]) servingByService[q.serviceId] = new Map();
            if (!servingByService[q.serviceId].has(rid)) servingByService[q.serviceId].set(rid, r);
          }
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

      const offsetMs = minArrivalMinutes * 60 * 1000;
      const offsetArrivals = offsetMs > 0
        ? uniqueArrivals.filter(arr => (arr.timestamp || 0) - Date.now() >= offsetMs)
        : uniqueArrivals;

      let filteredArrivals: any[];

      if (columnMode && columnServiceSelections) {
        filteredArrivals = offsetArrivals;
      } else {
        const routeFilteredArrivals = offsetArrivals.filter(arr => {
          const selection = serviceSelections.find((s: { serviceId: any; }) => s.serviceId === arr._sourceService);
          if (!selection || !selection.enabledRouteIds || selection.enabledRouteIds.length === 0) return true;
          if (!arr.routeId && !arr.routeShortName) return true;
          if (arr.routeId && selection.enabledRouteIds.includes(arr.routeId)) return true;
          if (arr.routeShortName && selection.enabledRouteIds.includes(arr.routeShortName)) return true;
          if (arr.routeShortName && selection.routes?.length) {
            for (const route of selection.routes) {
              if (selection.enabledRouteIds.includes(route.id) && route.shortName === arr.routeShortName) return true;
            }
          }
          return false;
        });
        filteredArrivals = routeFilteredArrivals.filter(arr => {
          const selection = serviceSelections.find((s: { serviceId: any; }) => s.serviceId === arr._sourceService);
          return matchesHeadsign(arr, selection);
        });
      }

      const routeLineNameMap: Record<string, string> = {};
      for (const sel of serviceSelections) {
        for (const route of sel.routes || []) {
          const routeId = route.id ?? (route as any).route_id;
          const longName = route.longName ?? (route as any).route_long_name ?? '';
          if (longName && routeId) {
            const cleanName = longName
              .replace(/\s+Branch$/i, '')
              .replace(/\s+Line$/i, '')
              .replace(/\s+Railroad$/i, '')
              .trim();
            // Key by serviceId:routeId to avoid collisions between agencies (e.g. LIRR and MNR
            // both use short numeric route IDs that can be identical across feeds)
            routeLineNameMap[`${sel.serviceId}:${routeId}`] = cleanName;
          }
        }
      }

      // Canonical abbreviations for commuter rail agencies keyed by serviceId
      const commuterRailNameMap: Record<string, string> = {};
      for (const sel of serviceSelections) {
        if (!sel.serviceId || !sel.agencyName) continue;
        const agency = sel.agencyName;
        if (/long island rail road|lirr/i.test(agency)) commuterRailNameMap[sel.serviceId] = 'LIRR';
        else if (/metro.north railroad/i.test(agency)) commuterRailNameMap[sel.serviceId] = 'MNR';
        else if (/staten island railway/i.test(agency)) commuterRailNameMap[sel.serviceId] = 'SIR';
        else if (/nj transit rail/i.test(agency)) commuterRailNameMap[sel.serviceId] = 'NJT';
        else if (/amtrak/i.test(agency)) commuterRailNameMap[sel.serviceId] = 'AMT';
      }

      // In column mode, don't cap here — the preview applies per-column caps after filtering
      const storeCap = (columnMode && columnServiceSelections) ? Infinity : MAX_ARRIVALS_PER_SLIDE;
      const cappedArrivals = storeCap === Infinity ? filteredArrivals : filteredArrivals.slice(0, storeCap);

      const displayArrivals = cappedArrivals.map(arr => {
        const svcKey = arr._sourceService || '';
        const lineName = routeLineNameMap[`${svcKey}:${arr.routeId}`] || routeLineNameMap[`${svcKey}:${arr.routeShortName}`];
        if (lineName) {
          return { ...arr, routeShortName: `${arr.routeShortName} - ${lineName}` };
        }
        const commuterSuffix = commuterRailNameMap[arr._sourceService];
        if (commuterSuffix) {
          return { ...arr, routeShortName: `${arr.routeShortName} ${commuterSuffix}` };
        }
        return arr;
      });

      // Badge list comes from skids' authoritative serving-routes (schedule-derived,
      // time-independent), not the arrivals sample — so peak-only/express routes with
      // no upcoming trips don't drop out of the options.
      const nextDiscovered: Record<string, RouteInfo[]> = {};
      for (const [svcId, routeMap] of Object.entries(servingByService)) {
        nextDiscovered[svcId] = Array.from(routeMap.values());
      }
      setDiscoveredRoutes(nextDiscovered);

      setScheduleData(slideId, displayArrivals);
      useFixedRouteStore.getState().setDataError(slideId, false);
    } catch (error) {
      console.error("Error fetching stop data:", error);
      useFixedRouteStore.getState().setDataError(slideId, true);
    } finally {
      setIsLoading(slideId, false);
    }
  }, [selectedStop, serviceSelections, columnMode, columnServiceSelections, slideId, setIsLoading, setScheduleData, minArrivalMinutes]);

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
          ...(needsRouteRestore ? { routes: svc.routes, enabledRouteIds: selection.enabledRouteIds?.length ? selection.enabledRouteIds : undefined } : {}),
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
          enabledRouteIds: undefined
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


  const saveStatus = useLocalSaveStatus(useFixedRouteStore, slideId);
  const bg = useImageUploadField(shortcode, bgImage, (url) => setBgImage(slideId, url));
  const logo = useImageUploadField(shortcode, logoImage, (url) => setLogoImage(slideId, url));

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
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 min-w-0 bg-white overflow-x-hidden overflow-y-auto">
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
                          setSearchMode('stop');
                          setRouteQuery('');
                          setRouteResults([]);
                          setSelectedRouteForStop(null);
                          setRouteStops([]);
                        }}
                        className={`px-3 py-1 transition-colors ${searchMode === 'stop' ? 'bg-blue-600 text-white' : 'bg-white text-[#4a5568] hover:bg-gray-50'}`}
                      >
                        Stop
                      </button>
                      <button
                        onClick={() => setSearchMode('route')}
                        className={`px-3 py-1 border-l border-[#cbd5e0] transition-colors ${searchMode === 'route' ? 'bg-blue-600 text-white' : 'bg-white text-[#4a5568] hover:bg-gray-50'}`}
                      >
                        Route
                      </button>
                      <button
                        onClick={() => setSearchMode('nearby')}
                        className={`px-3 py-1 border-l border-[#cbd5e0] transition-colors ${searchMode === 'nearby' ? 'bg-blue-600 text-white' : 'bg-white text-[#4a5568] hover:bg-gray-50'}`}
                      >
                        Nearby
                      </button>
                    </div>
                  </div>
                </div>

                {searchMode === 'route' ? (
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
                ) : searchMode === 'nearby' ? (
                  <NearbyStopMap
                    nearbyStops={nearbyStops}
                    coordinates={coordinates}
                    mapContainerRef={nearbyMapContainerRef}
                    mapRef={nearbyMapRef}
                    markersRef={nearbyMarkersRef}
                    onSelectStop={(stop) => {
                      handleSelectStop(stop);
                      setSearchMode('stop');
                    }}
                  />
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
                              onClick={() => { setColumnActiveTab(tabIdx); setEditingHeadsignsFor(null); }}
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
                              // Union configured routes with skids' authoritative serving-routes.
                              // Both are schedule-derived and complete; the union keeps configured
                              // routes if skids is cold and adds any skids-only routes if config is stale.
                              const baseRoutes: RouteInfo[] = selection.routes || [];
                              const liveRoutes: RouteInfo[] = discoveredRoutes[selection.serviceId] || [];
                              const seenRouteKeys = new Set<string>();
                              const allRoutes: RouteInfo[] = [];
                              for (const route of [...baseRoutes, ...liveRoutes]) {
                                const key = String(route.id ?? (route as any).route_id ?? route.shortName ?? '');
                                if (!key || seenRouteKeys.has(key)) continue;
                                seenRouteKeys.add(key);
                                allRoutes.push(route);
                              }
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
                              {allRoutes.length > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {allRoutes.map((route: RouteInfo, routeIdx: number) => {
                                    const routeId = route.id ?? (route as any).route_id;
                                    const isRouteEnabled = !selection.enabledRouteIds ||
                                      selection.enabledRouteIds.includes(routeId);
                                    const canToggle = selection.enabled && allRoutes.length > 1;

                                    return (
                                      <button
                                        key={routeId ?? routeIdx}
                                        disabled={!canToggle}
                                        onClick={() => {
                                          if (!canToggle) return;
                                          const currentEnabled = selection.enabledRouteIds ||
                                            allRoutes.map((r: RouteInfo) => r.id);
                                          // Prevent disabling all routes
                                          if (isRouteEnabled && currentEnabled.length === 1) return;
                                          const newEnabled = isRouteEnabled
                                            ? currentEnabled.filter((id: string) => id !== route.id)
                                            : [...currentEnabled, route.id];

                                          const updated = activeSels.map((s: any, i: any) =>
                                            i === index ? { ...s, enabledRouteIds: newEnabled } : s
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
                                  {selection.enabled && allRoutes.length > 3 && (
                                    <button
                                      onClick={() => {
                                        // Only reset enabledRouteIds — don't recompute directionOptions,
                                        // which can return the fallback (1 option) and hide the whole section.
                                        const updated = activeSels.map((s: any, i: any) =>
                                          i === index ? { ...s, enabledRouteIds: undefined } : s
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

                            {/* Direction toggles + rename row */}
                            {(() => {
                              const allOpts = selection.directionOptions || [];
                              const _liveHeadsigns = (() => {
                                const seen = new Set<string>();
                                const opts: DirectionOption[] = [];
                                // First: headsigns from stop API route data
                                for (const route of (selection.routes || []) as RouteInfo[]) {
                                  if (selection.enabledRouteIds && !selection.enabledRouteIds.includes(route.id)) continue;
                                  const rsn = route.shortName || '';
                                  for (const headsign of (route.headsigns || []) as string[]) {
                                    const normalized = headsign.toLowerCase().trim();
                                    const key = rsn ? `${rsn}|${normalized}` : normalized;
                                    if (!seen.has(key)) {
                                      seen.add(key);
                                      opts.push({ stopId: '', label: headsign, isAllDirections: false, headsignFilter: normalized, routeShortName: rsn || undefined });
                                    }
                                  }
                                }
                                // Second: destinations from live arrivals — fills the gap when the stop
                                // API returns empty headsigns (e.g. G train, PATH) or only one direction
                                for (const arr of liveArrivals) {
                                  if (arr._sourceService !== selection.serviceId) continue;
                                  if (selection.enabledRouteIds && arr.routeId && !selection.enabledRouteIds.includes(arr.routeId)) continue;
                                  const rsn = arr.routeShortName || arr.routeId || '';
                                  const headsign = arr.destination || '';
                                  if (!headsign) continue;
                                  const normalized = headsign.toLowerCase().trim();
                                  const key = rsn ? `${rsn}|${normalized}` : normalized;
                                  if (!seen.has(key)) {
                                    seen.add(key);
                                    opts.push({ stopId: '', label: headsign, isAllDirections: false, headsignFilter: normalized, routeShortName: rsn || undefined });
                                  }
                                }
                                return opts;
                              })();
                              const hasDirectionToggles = allOpts.length > 1 || _liveHeadsigns.length > 0;
                              // Toggle buttons: deduplicate by headsignFilter only (one toggle per unique destination)
                              const _seenHsToggle = new Set<string>();
                              const headsignOpts = _liveHeadsigns.filter((o: DirectionOption) => {
                                const k = o.headsignFilter!;
                                if (_seenHsToggle.has(k)) return false;
                                _seenHsToggle.add(k);
                                return true;
                              });
                              const _seenHsRename = new Set<string>();
                              const headsignRenameOpts = _liveHeadsigns.filter((o: DirectionOption) => {
                                const k = o.routeShortName ? `${o.routeShortName}|${o.headsignFilter!}` : o.headsignFilter!;
                                if (_seenHsRename.has(k)) return false;
                                _seenHsRename.add(k);
                                return true;
                              });
                              const getAliasKey = (o: DirectionOption) =>
                                o.routeShortName ? `${o.routeShortName}|${o.headsignFilter!}` : o.headsignFilter!;
                              const groupOpts = allOpts.filter((o: DirectionOption) => !o.isAllDirections && !o.headsignFilter && o.groupHeadsigns);
                              const topOpts = allOpts.filter((o: DirectionOption) => o.isAllDirections || (!o.headsignFilter && !o.groupHeadsigns));
                              // Show top-level options + group shortcuts on first row; individual headsigns on second row
                              const firstRowOpts = [...topOpts, ...groupOpts];
                              const isEditing = editingHeadsignsFor === selection.serviceId;
                              return (
                                <>
                                  {hasDirectionToggles && <div className="flex items-center gap-1.5 ml-6 flex-wrap mt-2">
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
                                        // Compare by stopId — headsign inclusion is unreliable because
                                        // a directional stop's data often contains headsigns from both
                                        // directions, which would make every group appear "selected".
                                        isSelected = normalizeIds(selection.selectedStopId) === normalizeIds(opt.stopId);
                                      } else {
                                        isSelected = normalizeIds(selection.selectedStopId) === normalizeIds(opt.stopId);
                                      }

                                      const displayLabel = opt.isAllDirections ? 'All' : String(opt.label).replace('bound', '');

                                      return (
                                        <button
                                          key={String(opt.label)}
                                          onClick={() => {
                                            // Always clear headsign filters so the stopId is the sole discriminator.
                                            const updated = activeSels.map((s: any, i: any) =>
                                              i === index ? {
                                                ...s,
                                                selectedStopId: opt.stopId,
                                                selectedHeadsignFilters: undefined
                                              } : s
                                            );
                                            setActiveSels(updated);
                                            setIsLoading(slideId, true);
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
                                    {headsignOpts.map((opt: DirectionOption, hsIdx: number) => {
                                      const currentFilters = selection.selectedHeadsignFilters || [];
                                      const isSelected = opt.headsignFilter ? currentFilters.includes(opt.headsignFilter) : false;
                                      const savedAlias = opt.headsignFilter
                                        ? (() => {
                                          const aliases = (serviceSelections || []).find((s: any) => s.serviceId === selection.serviceId)?.headsignAliases;
                                          if (!aliases) return undefined;
                                          if (opt.routeShortName) {
                                            const ck = `${opt.routeShortName}|${opt.headsignFilter}`;
                                            if (aliases[ck] !== undefined) return aliases[ck];
                                          }
                                          return aliases[opt.headsignFilter];
                                        })()
                                        : undefined;
                                      const displayLabel = savedAlias || opt.label || opt.headsignFilter;
                                      return (
                                        <button
                                          key={`hs-${index}-${hsIdx}`}
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
                                            setIsLoading(slideId, true);
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
                                  </div>}
                                  {/* Rename + reset buttons — always show when there are headsigns to alias */}
                                  {headsignRenameOpts.length > 0 && (
                                    <div className="flex items-center ml-6 mt-1.5 gap-1">
                                      <button
                                        onClick={() => {
                                          if (isEditing) {
                                            setEditingHeadsignsFor(null);
                                          } else {
                                            const baseSel = (serviceSelections || []).find((s: any) => s.serviceId === selection.serviceId);
                                            const draft: Record<string, string> = {};
                                            headsignRenameOpts.forEach((o: DirectionOption) => {
                                              const k = getAliasKey(o);
                                              draft[k] = baseSel?.headsignAliases?.[k] ?? o.label ?? o.headsignFilter!;
                                            });
                                            setHeadsignDraft(draft);
                                            setEditingHeadsignsFor(selection.serviceId);
                                          }
                                        }}
                                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                                        title="Rename headsigns"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      {(serviceSelections || []).find((s: any) => s.serviceId === selection.serviceId)?.headsignAliases && (
                                        <button
                                          onClick={() => {
                                            const updatedBase = (serviceSelections || []).map((s: any) =>
                                              s.serviceId === selection.serviceId ? { ...s, headsignAliases: undefined } : s
                                            );
                                            setServiceSelections(slideId, updatedBase);
                                            setHeadsignDraft({});
                                          }}
                                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                                          title="Reset all aliases"
                                        >
                                          Reset
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  {/* Inline headsign rename form */}
                                  {isEditing && headsignRenameOpts.length > 0 && (
                                    <div className="ml-6 mt-2 space-y-1">
                                      {headsignRenameOpts.map((opt: DirectionOption) => {
                                        const k = getAliasKey(opt);
                                        const cardLabel = opt.routeShortName
                                          ? `${opt.routeShortName}: ${opt.label || opt.headsignFilter}`
                                          : (opt.label || opt.headsignFilter);
                                        return (
                                        <div key={k} className="flex items-center gap-1.5">
                                          <span className="text-xs text-gray-400 shrink min-w-0 break-words leading-tight">{cardLabel} <span className="text-gray-300">→</span></span>
                                          <input
                                            type="text"
                                            value={headsignDraft[k] ?? opt.label ?? opt.headsignFilter ?? ''}
                                            onChange={(e) => {
                                              const newDraft = { ...headsignDraft, [k]: e.target.value };
                                              setHeadsignDraft(newDraft);
                                              // Save to store immediately so preview updates live
                                              const newAliases: Record<string, string> = {};
                                              headsignRenameOpts.forEach((o: DirectionOption) => {
                                                const ok = getAliasKey(o);
                                                const val = (newDraft[ok] ?? '').trim();
                                                const isDefault = !val || val === o.headsignFilter || val === o.label;
                                                if (!isDefault) {
                                                  newAliases[ok] = val;
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
                                              headsignRenameOpts.forEach((o: DirectionOption) => {
                                                const ok = getAliasKey(o);
                                                const val = (headsignDraft[ok] ?? '').trim();
                                                const isDefault = !val || val === o.headsignFilter || val === o.label;
                                                if (!isDefault) {
                                                  newAliases[ok] = val;
                                                }
                                              });
                                              const aliases = Object.keys(newAliases).length > 0 ? newAliases : undefined;
                                              const updatedBase = (serviceSelections || []).map((s: any) =>
                                                s.serviceId === selection.serviceId ? { ...s, headsignAliases: aliases } : s
                                              );
                                              setServiceSelections(slideId, updatedBase);
                                            }}
                                            className="flex-1 min-w-0 text-xs border rounded px-1.5 py-0.5 h-6 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            placeholder={opt.label ?? opt.headsignFilter ?? ''}
                                          />
                                        </div>
                                        );
                                      })}
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[#4a5568] font-medium">
                    Display Name Override
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-[#718096] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDisplayName}
                      onChange={(e) => setShowDisplayName(slideId, e.target.checked)}
                      className="w-3.5 h-3.5"
                    />
                    Show
                  </label>
                </div>
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[#4a5568] font-medium">
                    Subtitle Text
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-[#718096] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSubtitle}
                      onChange={(e) => setShowSubtitle(slideId, e.target.checked)}
                      className="w-3.5 h-3.5"
                    />
                    Show
                  </label>
                </div>
                <Input
                  placeholder={selectedStop ? `Stop #${selectedStop.id} arrival times` : "e.g. Stop #12345 arrival times"}
                  className="bg-white border-[#cbd5e0]"
                  value={subtitleText}
                  onChange={(e) => setSubtitleText(slideId, e.target.value)}
                />
                <p className="text-xs text-[#718096] mt-1">
                  Customize or hide the small text beneath the slide title. Leave blank to use the auto-generated stop ID text.
                </p>
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
                Show Header
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2 text-[#4a5568] font-medium text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTitleHtml}
                  onChange={(e) => setShowTitleHtml(slideId, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                Show Custom Title
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
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Logo Image
              </label>
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
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Logo Height Override (px)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={500}
                  placeholder="Global default"
                  value={logoHeightOverride ?? ''}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    setLogoHeightOverride(slideId, isNaN(v) || v <= 0 ? undefined : v);
                  }}
                  className="w-24 border border-[#e2e8f0] rounded px-2 py-1 text-xs text-[#4a5568] focus:outline-none focus:border-blue-400"
                />
                {logoHeightOverride != null && (
                  <button
                    onClick={() => setLogoHeightOverride(slideId, undefined)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Reset
                  </button>
                )}
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
              <h3 className="text-[#4a5568] font-medium mb-3 pb-2 border-b border-[#e2e8f0] text-xs">Table Column Headers</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`show-table-col-headers-${slideId}`}
                    checked={showTableColumnHeaders}
                    onChange={(e) => setShowTableColumnHeaders(slideId, e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-500"
                  />
                  <label htmlFor={`show-table-col-headers-${slideId}`} className="text-xs text-[#4a5568] cursor-pointer">
                    Show column headers
                  </label>
                </div>
                {showTableColumnHeaders && (
                  <>
                    <div>
                      <label className="block text-[#4a5568] font-medium mb-1 text-xs">Left Header</label>
                      <Input
                        value={tableHeaderLeft}
                        className="text-xs"
                        onChange={(e) => setTableHeaderLeft(slideId, e.target.value)}
                        placeholder="Transit Service Line"
                      />
                    </div>
                    <div>
                      <label className="block text-[#4a5568] font-medium mb-1 text-xs">Right Header</label>
                      <Input
                        value={tableHeaderRight}
                        className="text-xs"
                        onChange={(e) => setTableHeaderRight(slideId, e.target.value)}
                        placeholder="Est Arrival Time"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-[#4a5568] font-medium mb-3 pb-2 border-b border-[#e2e8f0] text-xs">Data Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                    Minimum arrival time (minutes)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={minArrivalMinutes}
                      onChange={(e) => setMinArrivalMinutes(slideId, Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 border border-[#e2e8f0] rounded px-2 py-1 text-xs text-[#4a5568] focus:outline-none focus:border-blue-400"
                    />
                    <span className="text-xs text-[#718096]">Hide arrivals sooner than this</span>
                  </div>
                </div>
                <div>
                  <Button
                    variant="outline"
                    className="text-xs h-7 px-3"
                    onClick={() => fetchData()}
                  >
                    Refresh Data
                  </Button>
                </div>
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
          <Button className="w-full bg-[#e2e8f0] hover:bg-[#cbd5e0] text-[#4a5568] font-medium text-xs mt-2" onClick={handleOpenSettings}>
            Screen Settings
          </Button>

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
