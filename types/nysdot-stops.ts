/**
 * TypeScript types for NYSDOT Stops API responses
 *
 * API uses camelCase naming and normalized refs structure.
 */

// ============================================================================
// API Response Types (wire format)
// ============================================================================

/** Route details in refs.routes lookup table */
export interface RouteRef {
  id: string;
  shortName: string;
  longName?: string;
  color?: string;
  textColor?: string;
}

/** Service details in refs.services lookup table */
export interface ServiceRef {
  id: string;
  organizationId: string;
  agencyName: string;
}

/** A route at a specific stop, with headsigns for that stop */
export interface RouteAtStop {
  routeId: string;
  headsigns: string[];
}

/** A service's presence at a specific stop */
export interface ServiceAtStop {
  serviceId: string;  // Key into refs.services
  routes: RouteAtStop[];
}

/** A linked stop (part of same station complex) */
export interface LinkedStop {
  id: string;
  name: string;
  services: ServiceAtStop[];
}

/** A stop in the API response */
export interface Stop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  locationType?: number;
  services: ServiceAtStop[];
  linkedStops?: LinkedStop[];
}

/** The complete API response */
export interface ApiResponse {
  stops: Stop[];
  refs: {
    services: Record<string, ServiceRef>;
    routes: Record<string, RouteRef>;
  };
}

// ============================================================================
// Expanded/Denormalized Types (for component use)
// ============================================================================

/** Route with full details attached */
export interface ExpandedRoute {
  id: string;
  shortName: string;
  longName?: string;
  color?: string;
  textColor?: string;
  headsigns: string[];
}

/** Service with full details and expanded routes */
export interface ExpandedService {
  id: string;
  organizationId: string;
  agencyName: string;
  routes: ExpandedRoute[];
}

/** Linked stop with expanded data */
export interface ExpandedLinkedStop {
  id: string;
  name: string;
  services: ExpandedService[];
}

/** Stop with all references expanded */
export interface ExpandedStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  locationType?: number;
  services: ExpandedService[];
  linkedStops?: ExpandedLinkedStop[];
}
