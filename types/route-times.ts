// Types for route times data structures

export interface Departure {
  tripId: string;
  headsign: string;
  departTime: number;
  realtime?: boolean;
}

export interface StopWithDepartures {
  stopId: string;
  stop_id: string;
  stopName: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  arrival_time: string | null;
  departure_time: string | null;
  stop_sequence: number;
  departures: Departure[];
}

export interface RouteDataItem {
  trip_id: string;
  stops: StopWithDepartures[];
}

export interface TripData {
  tripId: string;
  headsign: string;
  stops: Map<string, Departure>;
}

export interface StopInfo {
  id: string;
  name: string;
}

export interface PatternStop {
  id?: string;
  stopId?: string;
  name?: string;
  stopName?: string;
  coordinates?: number[];
  lon?: number;
  lat?: number;
}

export interface PatternData {
  stops: PatternStop[];
  coordinates: number[][];
}

export interface SelectedRoute {
  route_id?: string;
  route_short_name?: string;
  route_long_name?: string;
  route_color?: string;
  route_text_color?: string;
  services: Array<{
    organization_guid?: string;
    organization_id?: string;
    service_guid?: string;
    service_id?: string;
    agency_name?: string;
  }>;
}
