export const formatTripData = (data: any[]) => {

  const shortestItinerary = data.reduce((minItinerary: any, currentItinerary: any) => {
    return currentItinerary.duration < minItinerary.duration ? currentItinerary : minItinerary;
  });

  // Remove legs with mode 'WALK' and duration under 240
  shortestItinerary.legs = shortestItinerary.legs.filter((leg: any) => {
    return !(leg.mode === 'WALK' && leg.duration < 240);
  });


  return shortestItinerary;
}