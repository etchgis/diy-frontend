import { fetchTransitData } from "@/services/data-gathering/fetchTransitDestinationData";
import { getDestinationData } from "@/services/data-gathering/getDestinationData";
import { useGeneralStore } from "@/stores/general";
import { useTransitDestinationsStore } from "@/stores/transitDestinations";
import { formatDuration, formatTime } from "@/utils/formats";
import { usePathname } from "next/navigation";
import { use, useEffect } from "react";

export default function TransitDestinationPreview({ slideId, mobileMode = false }: { slideId: string, mobileMode?: boolean }) {
  const pathname = usePathname();
  const isEditor = pathname.includes('/editor');
  const backgroundColor = useTransitDestinationsStore((state) => state.slides[slideId]?.backgroundColor || '#192F51');
  const rowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.rowColor || '#192F51');
  const alternateRowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.alternateRowColor || '#78B1DD');
  const tableHeaderTextColor = useTransitDestinationsStore((state) => state.slides[slideId]?.tableHeaderTextColor || '#ffffff');
  const tableTextColor = useTransitDestinationsStore((state) => state.slides[slideId]?.tableTextColor || '#ffffff');

  const mockDestinations: any = [];
  const destinationData = useTransitDestinationsStore((state) => state.slides[slideId]?.destinationData || mockDestinations);
  const setDestinationData = useTransitDestinationsStore((state) => state.setDestinationData);

  const coordinates = useGeneralStore((state) => state.coordinates || null);

  const destinations = useTransitDestinationsStore((state) => state.slides[slideId]?.destinations || mockDestinations);

  // Always show exactly 6 rows total
  const totalRows = 6;

  const destinationTags = [
    "Albany International Airport",
    "Downtown Schenectady",
    "Albany Medical Center",
    "Downtown Saratoga Springs",
    "Albany-Rensselaer Train Station",
  ];

  return (
    <div className={`w-full h-full flex flex-col text-white overflow-hidden ${mobileMode ? 'mb-4' : 'mb-6'}`} style={{ backgroundColor }}>
      {/* Header - Fixed height */}
      <div 
        className={`text-white flex-shrink-0 ${mobileMode ? 'text-sm p-2' : 'text-lg p-4'}`} 
        style={{ backgroundColor, color: tableHeaderTextColor }}
      >
        <div className={`grid ${mobileMode ? 'grid-cols-[1fr_1.5fr_1fr_1fr_1fr] gap-2' : 'grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4'} font-medium`}>
          <div>Destination</div>
          <div>Route</div>
          <div>Departure</div>
          <div>Arrival</div>
          <div>Travel</div>
        </div>
      </div>

      {/* Row Container - Flexible height */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Render actual destinations */}
        {destinationData && destinationData.map((dest: any, index: number) => (
          <div
            key={index}
            className={`flex-1 grid ${mobileMode ? 'grid-cols-[1fr_1.5fr_1fr_1fr_1fr] gap-2 px-2 text-sm' : 'grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4 px-4 text-base'} w-full min-w-0 items-center`}
            style={{
              backgroundColor: index % 2 === 0 ? rowColor : alternateRowColor,
              color: tableTextColor,
            }}
          >
            <div className="flex items-center gap-2 truncate">
              <span>{dest.name}</span>
            </div>
            <div className={`flex items-center gap-1 overflow-hidden ${dest.legs.filter((l: any) => !(l.mode === 'WALK' && l.duration <= 240)).length > 3 ? 'flex-wrap py-1' : ''}`}>
              {dest.legs.map((leg: any, legIndex: number) => {
                if (leg.mode === 'WALK' && leg.duration <= 240) {
                  return null;
                }

                const visibleLegs = dest.legs.filter((l: any) => !(l.mode === 'WALK' && l.duration <= 240));
                const hasMany = visibleLegs.length > 3;
                const currentVisibleIndex = visibleLegs.findIndex((l: any) => l === leg);
                const isLastVisibleLeg = currentVisibleIndex === visibleLegs.length - 1;

                return (
                  <div className="flex items-center gap-1" key={legIndex}>
                    <div className={hasMany ? "all-leg-content" : "all-leg-content"}>
                      <div className={hasMany ? "flex flex-col items-center gap-0.5" : "flex items-center gap-1"}>
                        {/* Leg icon */}
                        {leg.mode === 'WALK' ? (
                          <img
                            className="leg-icon"
                            src="/images/walking-man.png"
                            style={{ width: mobileMode || hasMany ? '20px' : '35px', height: mobileMode || hasMany ? '20px' : '35px' }}
                            alt=""
                          />
                        ) : (
                          <div className="bus-leg flex items-center gap-0.5">
                            <img
                              className="leg-icon"
                              src="/images/bus-icon.png"
                              style={{ width: mobileMode || hasMany ? '20px' : '35px', height: mobileMode || hasMany ? '20px' : '35px' }}
                              alt=""
                            />
                            <div
                              className={`bus-info rounded ${mobileMode || hasMany ? 'px-1 py-0.5' : 'px-2 py-1'}`}
                              style={{ backgroundColor: leg.routeColor ? `#${leg.routeColor}` : 'white' }}
                            >
                              <p 
                                className={mobileMode || hasMany ? "text-xs leading-tight text-center" : "text-sm"}
                                style={{ color: leg.routeTextColor ? `#${leg.routeTextColor}` : 'black' }}
                              >
                                {leg.routeShortName?.length > 5
                                  ? `${leg.agencyId || "N/A"} ${leg.routeShortName.match(/\d+/)?.[0] || ""}`
                                  : leg.routeShortName || leg.tripShortName || "N/A"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Duration below icons */}
                      <p className={`leg-duration ${leg.mode === 'WALK' ? 'walk-duration' : ''} ${mobileMode || hasMany ? 'text-xs leading-tight' : 'text-sm'}`}>
                        {formatDuration(leg.duration)}
                      </p>
                    </div>

                    {/* Arrow icon if not last visible leg */}
                    {!isLastVisibleLeg && (
                      <img
                        src="/images/right-arrow.png"
                        alt=""
                        className="arrow-icon flex-shrink-0"
                        style={{ 
                          width: mobileMode || hasMany ? '12px' : '25px', 
                          height: mobileMode || hasMany ? '12px' : '25px', 
                          marginLeft: mobileMode || hasMany ? '2px' : '8px',
                          display: mobileMode && hasMany ? 'none' : 'block'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="truncate">{dest.departure}</div>
            <div className="truncate">{dest.arrival}</div>
            <div>{dest.travel}</div>
          </div>
        ))}

        {/* Add empty rows to fill remaining space */}
        {Array.from({ length: Math.max(0, totalRows - destinationData.length) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className={`flex-1 grid ${mobileMode ? 'grid-cols-[1fr_1.5fr_1fr_1fr_1fr] gap-2 px-2 text-sm' : 'grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4 px-4 text-base'} w-full min-w-0 items-center`}
            style={{
              backgroundColor: (destinationData.length + index) % 2 === 0 ? rowColor : alternateRowColor,
              color: tableTextColor,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[#cbd5e0]">-</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={mobileMode ? 'text-lg' : 'text-2xl'}>-</div>
            </div>
            <div className="text-[#cbd5e0]">-</div>
            <div className="text-[#cbd5e0]">-</div>
            <div className="text-[#cbd5e0]">-</div>
          </div>
        ))}
      </div>

      {/* Footer - Fixed height */}
      <div className={`bg-[#F4F4F4] flex items-center justify-between flex-shrink-0 ${mobileMode ? 'p-2' : 'p-3'}`}>
        <img 
          src="/images/statewide-mobility-services.png" 
          alt="Statewide Mobility Services" 
          className={mobileMode ? 'h-[20px] w-[180px]' : 'h-[25px] w-[246px]'} 
        />
        <img 
          src="/images/nysdot-footer-logo.png" 
          alt="NYSDOT" 
          className={mobileMode ? 'h-6' : 'h-8'} 
        />
      </div>
    </div>
  );
}