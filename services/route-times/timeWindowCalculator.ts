/**
 * Utility for calculating time windows for route schedule fetching
 */

export interface TimeWindow {
  startTime: number;
  endTime: number;
  isNextDay: boolean;
  isLaterToday: boolean;
}

/**
 * Calculate the appropriate time window for fetching route schedules
 * @param fetchNextPeriod - Whether to fetch the next period (tomorrow or later today)
 * @returns TimeWindow object with start/end times and flags
 */
export function calculateTimeWindow(fetchNextPeriod: boolean = false): TimeWindow {
  const now = Date.now();
  let startTime = now;
  let endTime = now + (3 * 60 * 60 * 1000); // 3 hours from now by default
  let isNextDay = false;
  let isLaterToday = false;

  if (fetchNextPeriod) {
    const currentDate = new Date();
    const currentHour = currentDate.getHours();

    // If it's early morning (before 4 AM), fetch rest of today first
    if (currentHour < 4) {
      // Fetch from now until end of service day (4 AM next calendar day)
      const endOfServiceDay = new Date();
      endOfServiceDay.setDate(endOfServiceDay.getDate() + 1);
      endOfServiceDay.setHours(4, 0, 0, 0);
      startTime = now;
      endTime = endOfServiceDay.getTime();
      isNextDay = true;
      isLaterToday = true;
    } else {
      // It's after 4 AM, so fetch tomorrow's data
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(4, 0, 0, 0); // Start at 4 AM tomorrow
      startTime = tomorrow.getTime();
      endTime = startTime + (24 * 60 * 60 * 1000); // Full next day
      isNextDay = true;
      isLaterToday = false;
    }
  }

  return {
    startTime,
    endTime,
    isNextDay,
    isLaterToday,
  };
}

/**
 * Determine if we're in the early morning hours (late night service period)
 * @returns true if current time is between midnight and 4 AM
 */
export function isEarlyMorningHours(): boolean {
  const currentHour = new Date().getHours();
  return currentHour < 4;
}
