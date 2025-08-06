import { useTransitDestinationsStore } from "@/stores/transitDestinations";
import { formatDuration } from "@/utils/formats";

export default function TransitDestinationPreview({ slideId }: { slideId: string }) {
  const backgroundColor = useTransitDestinationsStore((state) => state.slides[slideId]?.backgroundColor || '#192F51');
  const rowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.rowColor || '#192F51');
  const alternateRowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.alternateRowColor || '#78B1DD');
  const tableHeaderTextColor = useTransitDestinationsStore((state) => state.slides[slideId]?.tableHeaderTextColor || '#ffffff');
  const tableTextColor = useTransitDestinationsStore((state) => state.slides[slideId]?.tableTextColor || '#ffffff');

  const mockDestinations: any = []
  const destinations = useTransitDestinationsStore((state) => state.slides[slideId]?.destinations || mockDestinations);


  // Always show exactly 6 rows total
  const totalRows = 6;

  const destinationTags = [
    "Albany International Airport",
    "Downtown Schenectady",
    "Albany Medical Center",
    "Downtown Saratoga Springs",
    "Albany-Rensselaer Train Station",
  ]

  return (
    <>
      <div className="w-full h-full flex flex-col bg-[#192f51] text-white overflow-hidden mb-6">
        {/* Header - Fixed height */}
        <div className="text-white flex-shrink-0" style={{ backgroundColor, color: tableHeaderTextColor, fontSize: '18px' }}>
          <div className="grid grid-cols-5 gap-4 p-4 font-medium">
            <div>Destination</div>
            <div>Route</div>
            <div>Departure Time</div>
            <div>Arrival Time</div>
            <div>Travel Time</div>
          </div>
        </div>

        {/* Row Container - Flexible height that grows to fill space */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Render actual destinations */}
          {destinations.map((dest, index) => (
            <div
              key={index}
              className="flex-1 grid grid-cols-5 w-full min-w-0 gap-4 px-4 items-center"
              style={{
                backgroundColor: index % 2 === 0 ? rowColor : alternateRowColor,
                color: tableTextColor,
              }}
            >
              <div className="flex items-center gap-2">
                <span>{dest.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {dest.legs.map((leg: any, index: number) => {
                  if (leg.mode === 'WALK' && leg.duration <= 240) {
                    return null; // Do not render anything if the condition is true
                  }
                  return (
                    <div className="all-leg-content" key={index}>
                      <div>
                        <div>
                          {leg.mode === 'WALK' ? (
                            <img className="leg-icon" src='/images/walking-man.png' style={{width: '45px', height: '45px'}} alt="" />
                          ) : (
                            <div className="bus-leg">
                              <img className="leg-icon" src='/images/bus-icon.png' alt="" />
                              <div style={{ backgroundColor: leg.routeColor ? `#${leg.routeColor}` : 'white' }} className="bus-info">
                                <p>{leg.routeShortName}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className={`leg-duration ${leg.mode === 'WALK' ? 'walk-duration' : ''}`}>
                          {formatDuration(leg.duration)}
                        </p>

                      </div>
                      {index !== dest.legs.length - 1 &&
                        <img className="arrow-icon" src='/images/right-arrow.png' alt="" />
                      }
                    </div>
                  );
                })}
              </div>
              <div>{dest.departure}</div>
              <div>{dest.arrival}</div>
              <div>{dest.travel}</div>
            </div>
          ))}

          {/* Add empty rows to fill remaining space */}
          {Array.from({ length: Math.max(0, totalRows - destinations.length) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="flex-1 grid grid-cols-5 w-full min-w-0 gap-4 px-4 items-center"
              style={{
                backgroundColor: (destinations.length + index) % 2 === 0 ? rowColor : alternateRowColor,
                color: tableTextColor,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[#cbd5e0]">-</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl text-[#cbd5e0]">-</div>
              </div>
              <div className="text-[#cbd5e0]">-</div>
              <div className="text-[#cbd5e0]">-</div>
              <div className="text-[#cbd5e0]">-</div>
            </div>
          ))}
        </div>

        {/* Footer - Fixed height */}
        <div className="bg-[#F4F4F4] p-3 flex items-center justify-between flex-shrink-0">
          <img src="/images/statewide-mobility-services.png" alt="Statewide Mobility Services" className="h-[25px] w-[246px]" />
          <img src="/images/nysdot-footer-logo.png" alt="NYSDOT" className="h-8" />
        </div>
      </div>
    </>
  );
}