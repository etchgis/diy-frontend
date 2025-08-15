/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert kilometers to miles
 * @param km - Distance in kilometers
 * @returns Distance in miles
 */
export function kmToMiles(km: number): number {
  return km * 0.621371;
}

/**
 * Convert kilometers to feet
 * @param km - Distance in kilometers
 * @returns Distance in feet
 */
export function kmToFeet(km: number): number {
  return km * 3280.84;
}

/**
 * Format distance for display (auto-select miles or feet based on distance)
 * @param km - Distance in kilometers
 * @returns Formatted string with appropriate unit
 */
export function formatDistance(km: number): string {
  const miles = kmToMiles(km);

  if (miles < 0.1) {
    // Show in feet for distances less than 0.1 miles
    const feet = kmToFeet(km);
    return `${Math.round(feet)} ft`;
  } else if (miles < 10) {
    // Show one decimal place for distances less than 10 miles
    return `${miles.toFixed(1)} mi`;
  } else {
    // Show whole numbers for larger distances
    return `${Math.round(miles)} mi`;
  }
}
