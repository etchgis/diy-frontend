const NYSDOT_STOPS_URL = process.env.NEXT_PUBLIC_NYSDOT_STOPS_URL;
if (!NYSDOT_STOPS_URL) {
  throw new Error('NEXT_PUBLIC_NYSDOT_STOPS_URL environment variable is not configured');
}

interface Route {
  route_id: string;
  agency_id: string;
  route_short_name: string;
  route_long_name: string;
  route_desc: string;
  route_type: string;
  route_url: string;
  route_color: string;
  route_text_color: string;
  unique_route_id: string;
  services: Array<{
    organization_guid: string;
    service_guid: string;
    agency_name: string;
  }>;
}

/**
 * Fetches routes based on search term
 * @param search - The search term to match against route names (short or long)
 * @returns Promise with array of route objects
 */
export async function fetchRoutes(search: string): Promise<Route[]> {
  try {
    if (!search || search.trim() === '') {
      console.warn('Search term is required for fetching routes');
      return [];
    }

    const url = `${NYSDOT_STOPS_URL}/routes?search=${encodeURIComponent(search)}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! Status: ${response.status}, StatusText: ${response.statusText}, Response Body: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching routes:', error.message || error);
    throw error;
  }
}

/**
 * Fetches routes with debouncing support (useful for search-as-you-type)
 * @param search - The search term
 * @param debounceMs - Debounce delay in milliseconds
 * @returns Promise with array of route objects
 */
let routeSearchTimeout: ReturnType<typeof setTimeout> | null = null;

export async function fetchRoutesDebounced(
  search: string,
  debounceMs: number = 300
): Promise<Route[]> {
  return new Promise((resolve, reject) => {
    if (routeSearchTimeout) {
      clearTimeout(routeSearchTimeout);
    }

    routeSearchTimeout = setTimeout(async () => {
      try {
        const routes = await fetchRoutes(search);
        resolve(routes);
      } catch (error) {
        reject(error);
      }
    }, debounceMs);
  });
}

/**
 * Helper function to format route color for CSS
 * @param color - Hex color string from API (without #)
 * @returns Formatted color string with # prefix
 */
export function formatRouteColor(color: string): string {
  if (!color) {return '#000000';}
  return color.startsWith('#') ? color : `#${color}`;
}

/**
 * Helper function to format text color for CSS
 * @param textColor - Hex color string from API (without #)
 * @returns Formatted color string with # prefix
 */
export function formatRouteTextColor(textColor: string): string {
  if (!textColor) {return '#FFFFFF';}
  return textColor.startsWith('#') ? textColor : `#${textColor}`;
}

/**
 * Helper function to get route display name
 * Prioritizes short name, falls back to long name
 * @param route - Route object
 * @returns Display name for the route
 */
export function getRouteDisplayName(route: Route): string {
  return route.route_short_name || route.route_long_name || route.route_id;
}

/**
 * Helper function to get full route description
 * Combines short and long names when both are available
 * @param route - Route object
 * @returns Full description of the route
 */
export function getRouteFullDescription(route: Route): string {
  if (route.route_short_name && route.route_long_name) {
    return `${route.route_short_name} - ${route.route_long_name}`;
  }
  return getRouteDisplayName(route);
}
