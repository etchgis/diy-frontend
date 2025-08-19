/**
 * Shared time formatting utilities
 */

/**
 * Format a timestamp as 12-hour time with AM/PM
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string (e.g., "3:45 PM")
 */
export function formatTime12Hour(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Format a timestamp as 24-hour time
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string (e.g., "15:45")
 */
export function formatTime24Hour(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format a duration in minutes to a human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted duration (e.g., "5 min", "1 hr 30 min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hr ${mins} min`;
}

/**
 * Get relative time string (e.g., "in 5 minutes", "2 hours ago")
 * @param timestamp - Unix timestamp in milliseconds
 * @param now - Current time in milliseconds (optional)
 * @returns Relative time string
 */
export function getRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  const minutes = Math.floor(absDiff / 60000);

  if (minutes < 1) {
    return diff > 0 ? 'arriving' : 'departed';
  }

  if (minutes < 60) {
    const str = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    return diff > 0 ? `in ${str}` : `${str} ago`;
  }

  const hours = Math.floor(minutes / 60);
  const str = `${hours} hour${hours !== 1 ? 's' : ''}`;
  return diff > 0 ? `in ${str}` : `${str} ago`;
}
