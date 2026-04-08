const MAX_ITINERARY_DURATION_SECONDS = 3 * 60 * 60; // 3 hours — anything longer is unrealistic

export const formatTripData = (data: any[]) => {

  const realistic = data.filter((it: any) => it.duration <= MAX_ITINERARY_DURATION_SECONDS);
  if (realistic.length === 0) {
    throw new Error("No realistic route found for this destination.");
  }

  const shortestItinerary = realistic.reduce((minItinerary: any, currentItinerary: any) => {
    return currentItinerary.duration < minItinerary.duration ? currentItinerary : minItinerary;
  });

  // Remove legs with mode 'WALK' and duration under 240
  shortestItinerary.legs = shortestItinerary.legs.filter((leg: any) => {
    return !(leg.mode === 'WALK' && leg.duration < 240);
  });


  return shortestItinerary;
}