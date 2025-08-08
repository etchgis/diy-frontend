import { fetchTransitData } from "@/services/data-gathering/fetchTransitDestinationData";
import { getDestinationData } from "@/services/data-gathering/getDestinationData";
import { useGeneralStore } from "@/stores/general";
import { useTransitDestinationsStore } from "@/stores/transitDestinations";
import { formatDuration, formatTime } from "@/utils/formats";
import { usePathname } from "next/navigation";
import { use, useEffect } from "react";

export default function TransitDestinationPreview({ slideId }: { slideId: string }) {
  const pathname = usePathname();
  const isEditor = pathname.includes('/editor');
  const backgroundColor = useTransitDestinationsStore((state) => state.slides[slideId]?.backgroundColor || '#192F51');
  const rowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.rowColor || '#192F51');
  const alternateRowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.alternateRowColor || '#78B1DD');
  const tableHeaderTextColor = useTransitDestinationsStore((state) => state.slides[slideId]?.tableHeaderTextColor || '#ffffff');
  const tableTextColor = useTransitDestinationsStore((state) => state.slides[slideId]?.tableTextColor || '#ffffff');

  const mockDestinations: any = []
  const destinationData = useTransitDestinationsStore((state) => state.slides[slideId]?.destinationData || mockDestinations);
  const setDestinationData = useTransitDestinationsStore((state) => state.setDestinationData);

  const coordinates = useGeneralStore((state) => state.coordinates || null);

  const destinations = useTransitDestinationsStore((state) => state.slides[slideId]?.destinations || mockDestinations);

  // useEffect(() => {
  //   console.log(destinations);
  //   if (destinations.length > 0 && coordinates && !isEditor) {
  //     getDestinationData(destinations, slideId, setDestinationData);
  //     setInterval(() => {
  //       getDestinationData(destinations, slideId, setDestinationData);
  //     }
  //       , 60000 * 5);
  //   }
  // }, []);


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
          <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4 p-4 font-medium">
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
          {destinationData && destinationData.map((dest: any, index: number) => (
            <div
              key={index}
              className="flex-1 grid grid-cols-[1fr_2fr_1fr_1fr_1fr] w-full min-w-0 gap-4 px-4 items-center"
              style={{
                backgroundColor: index % 2 === 0 ? rowColor : alternateRowColor,
                color: tableTextColor,
              }}
            >
              <div className="flex items-center gap-2">
                <span>{dest.name}</span>
              </div>
              <div className={`flex items-center gap-2 overflow-hidden ${dest.legs.filter((l: any) => !(l.mode === 'WALK' && l.duration <= 240)).length > 4 ? 'flex-wrap py-2' : ''}`}>
                {dest.legs.map((leg: any, legIndex: number) => {
                  if (leg.mode === 'WALK' && leg.duration <= 240) {
                    return null;
                  }

                  const visibleLegs = dest.legs.filter((l: any) => !(l.mode === 'WALK' && l.duration <= 240));
                  const hasMany = visibleLegs.length > 4;
                  const currentVisibleIndex = visibleLegs.findIndex((l: any) => l === leg);
                  const isLastVisibleLeg = currentVisibleIndex === visibleLegs.length - 1;
                  console.log(visibleLegs);

                  return (
                    <div className="flex items-center gap-2" key={legIndex}>
                      <div className={hasMany ? "all-leg-content" : "all-leg-content"}>
                        <div className={hasMany ? "flex flex-col items-center gap-1" : "flex items-center gap-2"}>
                          {/* Leg icon */}
                          {leg.mode === 'WALK' ? (
                            <img
                              className="leg-icon"
                              src="/images/walking-man.png"
                              style={{ width: hasMany ? '24px' : '35px', height: hasMany ? '24px' : '35px' }}
                              alt=""
                            />
                          ) : (
                            <div className="bus-leg flex items-center gap-1">
                              <img
                                className="leg-icon"
                                src="/images/bus-icon.png"
                                style={{ width: hasMany ? '24px' : '35px', height: hasMany ? '24px' : '35px' }}
                                alt=""
                              />
                              <div
                                className={`bus-info rounded ${hasMany ? 'px-1 py-0.5' : 'px-2 py-1'}`}
                                style={{ backgroundColor: leg.routeColor ? `#${leg.routeColor}` : 'white' }}
                              >
                                <p className={hasMany ? "text-xs leading-tight text-center" : "text-sm"} style={{ color: leg.routeTextColor ? `#${leg.routeTextColor}` : 'black' }}>
                                  {leg.routeShortName?.length > 5
                                    ? `${leg.agencyId || "N/A"} ${leg.routeShortName.match(/\d+/)?.[0] || ""}`
                                    : leg.routeShortName || leg.tripShortName || "N/A"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Duration below icons */}
                        <p className={`leg-duration ${leg.mode === 'WALK' ? 'walk-duration' : ''} ${hasMany ? 'text-xs leading-tight' : ''}`}>
                          {formatDuration(leg.duration)}
                        </p>
                      </div>

                      {/* Arrow icon if not last visible leg */}
                      {!isLastVisibleLeg && (
                        <img
                          src="/images/right-arrow.png"
                          alt=""
                          className="arrow-icon flex-shrink-0"
                          style={{ width: hasMany ? '15px' : '25px', height: hasMany ? '15px' : '25px', marginLeft: hasMany ? '4px' : '8px', display: hasMany ? 'none' : 'block' }}
                        />
                      )}
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
          {Array.from({ length: Math.max(0, totalRows - destinationData.length) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="flex-1 grid grid-cols-[1fr_2fr_1fr_1fr_1fr] w-full min-w-0 gap-4 px-4 items-center"
              style={{
                backgroundColor: (destinationData.length + index) % 2 === 0 ? rowColor : alternateRowColor,
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