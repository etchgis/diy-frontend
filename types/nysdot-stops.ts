/**
 * TypeScript types for NYSDOT Stops API responses
 */

// Route information
export interface RouteInfo {
  route_id: string;
  route_short_name: string;
  route_long_name?: string;
  route_color?: string;
  route_text_color?: string;
}

// Service information (denormalized)
export interface ServiceInfo {
  service_guid: string;
  organization_guid: string;
  agency_name: string;
  routes: RouteInfo[];
  headsigns_by_route?: Record<string, string[]>;
}

// Stop in a station complex
export interface ComplexStop {
  stop_id: string;
  stop_name: string;
  stop_lat?: number;
  stop_lon?: number;
  services: ServiceInfo[];
}

// Full stop object (denormalized)
export interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  location_type?: number;
  services: ServiceInfo[];
  complex_stops?: ComplexStop[];
}

// --- Normalized API Response Types (wire format) ---

// Service reference in normalized response
export interface ServiceRef {
  ref: string;
  headsigns_by_route?: Record<string, string[]>;
}

// Stop entry in normalized response
export interface NormalizedStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  location_type?: number;
  services: ServiceRef[];
  complex_stops?: Array<{
    stop_id: string;
    stop_name: string;
    services: ServiceRef[];
  }>;
}

// Service entity in lookup table
export interface ServiceEntity {
  service_guid: string;
  organization_guid: string;
  agency_name: string;
  routes: string[];  // Keys into _routes
}

// Route entity in lookup table
export interface RouteEntity {
  route_id: string;
  route_short_name: string;
  route_color?: string;
  route_text_color?: string;
}

// Full normalized API response
export interface NormalizedApiResponse {
  stops: NormalizedStop[];
  _services: Record<string, ServiceEntity>;
  _routes: Record<string, RouteEntity>;
}
