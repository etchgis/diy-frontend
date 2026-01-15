import { useGeneralStore } from "@/stores/general";
import { useTransitDestinationsStore } from "@/stores/transitDestinations";
import { formatDuration, formatTime } from "@/utils/formats";
import { usePathname } from "next/navigation";
import { use, useEffect } from "react";

export default function TransitDestinationPreview({
  slideId,
  mobileMode = false,
}: {
  slideId: string;
  mobileMode?: boolean;
}) {
  const pathname = usePathname();
  const isEditor = pathname.includes("/editor");
  const backgroundColor = useTransitDestinationsStore(
    (state) => state.slides[slideId]?.backgroundColor || "#192F51"
  );
  const rowColor = useTransitDestinationsStore(
    (state) => state.slides[slideId]?.rowColor || "#192F51"
  );
  const alternateRowColor = useTransitDestinationsStore(
    (state) => state.slides[slideId]?.alternateRowColor || "#78B1DD"
  );
  const tableHeaderTextColor = useTransitDestinationsStore(
    (state) => state.slides[slideId]?.tableHeaderTextColor || "#ffffff"
  );
  const tableTextColor = useTransitDestinationsStore(
    (state) => state.slides[slideId]?.tableTextColor || "#ffffff"
  );
  const alternateRowTextColor = useTransitDestinationsStore(
    (state) => state.slides[slideId]?.alternateRowTextColor || "#ffffff"
  );
  const dataError = useTransitDestinationsStore(
    (state) => state.slides[slideId]?.dataError || false
  );

  const mockDestinations: any = [];
  const destinationData = useTransitDestinationsStore(
    (state) => state.slides[slideId]?.destinationData || mockDestinations
  );

  // Always show exactly 6 rows total
  const totalRows = 6;

  const destinationTags = [
    "Albany International Airport",
    "Downtown Schenectady",
    "Albany Medical Center",
    "Downtown Saratoga Springs",
    "Albany-Rensselaer Train Station",
  ];

  // Dynamic styling based on editor mode
  const getHeaderStyles = () => {
    if (mobileMode) return "text-sm p-2";
    return isEditor ? "text-lg p-4" : "text-[3.0vh] p-[2.5vh]";
  };

  const getRowStyles = () => {
    if (mobileMode) return "text-sm";
    return isEditor ? "text-base" : "text-[2.8vh]";
  };

  const getGridGap = () => {
    if (mobileMode) return "gap-2";
    return isEditor ? "gap-4" : "gap-[1vh]";
  };

  const getRowPadding = () => {
    if (mobileMode) return "px-2";
    return isEditor ? "px-4" : "px-[1.5vh]";
  };

  const getIconSize = () => {
    if (mobileMode) return { width: "20px", height: "20px" };
    if (isEditor) return { width: "35px", height: "35px" };
    return { width: "3vh", height: "3vh" };
  };

  const getIconSizeForManyLegs = (hasMany: boolean, mode?: string) => {
    if (mode === "RAIL") {
      if (mobileMode || hasMany) return { width: "42px", height: "42px" };
      if (isEditor) return { width: "48px", height: "48px" };
      return { width: "6vh", height: "6vh" };
    }

    if (mobileMode || hasMany) return { width: "30px", height: "30px" };
    if (isEditor) return { width: "35px", height: "35px" };
    return { width: "4.2vh", height: "4.2vh" };
  };

  const getBusPadding = (hasMany: boolean) => {
    if (mobileMode || hasMany) return "px-1 py-0.5";
    if (isEditor) return "px-2 py-1";
    return "px-[0.8vh] py-[0.4vh]";
  };

  const getBusTextSize = (hasMany: boolean) => {
    if (mobileMode || hasMany) return "text-xs";
    if (isEditor) return "text-sm";
    return "text-[1.8vh]";
  };

  /**
   * Format route name for display.
   * For long route names (e.g., "M34-SBS"), show agencyId + route number like "MTA NYCT 34"
   * For short route names (e.g., "N", "Q"), show as-is
   */
  const formatRouteName = (leg: any): string => {
    const name = leg.routeShortName || leg.tripShortName || "N/A";

    // For short names display as-is
    if (name.length <= 5) return name;

    // For longer names, use agencyId + extracted route number
    const routeNumber = name.match(/\d+/)?.[0];
    if (routeNumber && leg.agencyId) {
      return `${leg.agencyId} ${routeNumber}`;
    }

    return name;
  };

  const getDurationTextSize = (hasMany: boolean) => {
    if (mobileMode || hasMany) return "text-sm";
    if (isEditor) return "text-sm";
    return "text-[2.4vh]";
  };

  const getArrowSize = (hasMany: boolean) => {
    if (mobileMode || hasMany) return { width: "18px", height: "18px" };
    if (isEditor) return { width: "25px", height: "25px" };
    return { width: "2.5vh", height: "2.5vh" };
  };

  const getArrowMargin = (hasMany: boolean) => {
    if (mobileMode || hasMany) return "2px";
    if (isEditor) return "8px";
    return "0.6vh";
  };

  const getFooterPadding = () => {
    if (mobileMode) return "p-2";
    return isEditor ? "p-3" : "p-[1.2vh]";
  };

  const getFooterImageSize = () => {
    if (mobileMode) return { logo: "h-[20px] w-[180px]", nysdot: "h-6" };
    if (isEditor) return { logo: "h-[25px] w-[246px]", nysdot: "h-8" };
    return { logo: "h-[2.5vh] w-[20vh]", nysdot: "h-[3vh]" };
  };

  const getEmptyRowTextSize = () => {
    if (mobileMode) return "text-lg";
    if (isEditor) return "text-2xl";
    return "text-[2.5vh]";
  };

  return (
    <div
      className={`w-full h-full flex flex-col text-white overflow-hidden ${
        mobileMode ? "mb-4" : "mb-6"
      }`}
      style={{ backgroundColor }}
    >
      {/* Header - Fixed height */}
      <div
        className={`text-white flex-shrink-0 ${getHeaderStyles()}`}
        style={{ backgroundColor, color: tableHeaderTextColor }}
      >
        <div
          className={`grid ${
            mobileMode
              ? "grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr]"
              : "grid-cols-[1.5fr_2fr_1fr_1fr_1fr]"
          } ${getGridGap()} font-medium`}
        >
          <div>Destination</div>
          <div>Route</div>
          <div>Departure</div>
          <div>Arrival</div>
          <div>Travel</div>
        </div>
      </div>

      {/* Row Container - Flexible height */}
      <div className="flex-1 flex flex-col min-h-0">
        {dataError ? (
          // Show warning message in the first row if dataError is true
          <div
            className={`flex-1 grid ${
              mobileMode
                ? "grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr]"
                : "grid-cols-[1.5fr_2fr_1fr_1fr_1fr]"
            } ${getGridGap()} ${getRowPadding()} ${getRowStyles()} w-full min-w-0 items-center`}
            style={{
              backgroundColor: rowColor,
              color: tableTextColor,
            }}
          >
            <div className="col-span-5 flex items-center justify-center">
              <p className="text-yellow-600 text-sm">
                ⚠️ Transit destination data currently not available. Please try
                again later.
              </p>
            </div>
          </div>
        ) : (
          // Render actual destinations if no dataError
          <>
            {destinationData &&
              destinationData.map((dest: any, index: number) => {
                // Sanitize values with a dash if nothing exists
                const name = dest.name || "-";
                const route = dest.route || "-";
                const departure = dest.departure || "-";
                const arrival = dest.arrival || "-";
                const travel = dest.travel || "-";
                const legs = dest.legs && dest.legs.length > 0 ? dest.legs : [];

                return (
                  <div
                    key={index}
                    className={`flex-1 grid ${
                      mobileMode
                        ? "grid-cols-[1fr_1.5fr_1fr_1fr_1fr]"
                        : "grid-cols-[1.5fr_2fr_1fr_1fr_1fr]"
                    } ${getGridGap()} ${getRowPadding()} ${getRowStyles()} w-full min-w-0 items-center`}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? rowColor : alternateRowColor,
                      color:
                        index % 2 === 0
                          ? tableTextColor
                          : alternateRowTextColor,
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{name}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1 overflow-hidden ${
                        legs.filter(
                          (l: any) => !(l.mode === "WALK" && l.duration <= 240)
                        ).length > 3
                          ? "flex-wrap py-1"
                          : ""
                      }`}
                    >
                      {legs && legs.length > 0
                        ? legs.map((leg: any, legIndex: number) => {
                            if (leg.mode === "WALK" && leg.duration <= 240)
                              return null;

                            const visibleLegs = legs.filter(
                              (l: any) =>
                                !(l.mode === "WALK" && l.duration <= 240)
                            );
                            const hasMany = visibleLegs.length > 3;
                            const currentVisibleIndex = visibleLegs.findIndex(
                              (l: any) => l === leg
                            );
                            const isLastVisibleLeg =
                              currentVisibleIndex === visibleLegs.length - 1;

                            return (
                              <div
                                className="flex items-center gap-1"
                                key={legIndex}
                              >
                                <div
                                  className={
                                    hasMany
                                      ? "all-leg-content"
                                      : "all-leg-content"
                                  }
                                >
                                  <div
                                    className={
                                      hasMany
                                        ? "flex flex-col items-center gap-0.5"
                                        : "flex items-center gap-1"
                                    }
                                  >
                                    {leg.mode === "WALK" ? (
                                      <img
                                        className="leg-icon"
                                        src="/images/walking-man.png"
                                        style={getIconSizeForManyLegs(hasMany)}
                                        alt=""
                                      />
                                    ) : leg.mode === "RAIL" ? (
                                      <div className="rail-leg flex items-center gap-0.5">
                                        <img
                                          className="leg-icon"
                                          src="/images/rail-icon.png"
                                          style={getIconSizeForManyLegs(
                                            hasMany
                                          )}
                                          alt=""
                                        />
                                        <div
                                          className={`rail-info rounded ${getBusPadding(
                                            hasMany
                                          )}`}
                                          style={{
                                            backgroundColor: leg.routeColor
                                              ? `#${leg.routeColor}`
                                              : "white",
                                          }}
                                        >
                                          <p
                                            className={`${getBusTextSize(
                                              hasMany
                                            )} leading-tight text-center`}
                                            style={{
                                              color: leg.routeTextColor
                                                ? `#${leg.routeTextColor}`
                                                : "black",
                                            }}
                                          >
                                            {formatRouteName(leg)}
                                          </p>
                                        </div>
                                      </div>
                                    ) : leg.mode === "SUBWAY" ? (
                                      <div className="rail-leg flex items-center gap-0.5">
                                        <img
                                          className="leg-icon"
                                          src="/images/subway-icon.png"
                                          style={getIconSizeForManyLegs(
                                            hasMany
                                          )}
                                          alt=""
                                        />
                                        <div
                                          className={`rail-info rounded ${getBusPadding(
                                            hasMany
                                          )}`}
                                          style={{
                                            backgroundColor: leg.routeColor
                                              ? `#${leg.routeColor}`
                                              : "white",
                                          }}
                                        >
                                          <p
                                            className={`${getBusTextSize(
                                              hasMany
                                            )} leading-tight text-center`}
                                            style={{
                                              color: leg.routeTextColor
                                                ? `#${leg.routeTextColor}`
                                                : "black",
                                            }}
                                          >
                                            {formatRouteName(leg)}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bus-leg flex items-center gap-0.5">
                                        <img
                                          className="leg-icon"
                                          src="/images/bus-icon.png"
                                          style={getIconSizeForManyLegs(
                                            hasMany
                                          )}
                                          alt=""
                                        />
                                        <div
                                          className={`bus-info rounded ${getBusPadding(
                                            hasMany
                                          )}`}
                                          style={{
                                            backgroundColor: leg.routeColor
                                              ? `#${leg.routeColor}`
                                              : "white",
                                          }}
                                        >
                                          <p
                                            className={`${getBusTextSize(
                                              hasMany
                                            )} leading-tight text-center`}
                                            style={{
                                              color: leg.routeTextColor
                                                ? `#${leg.routeTextColor}`
                                                : "black",
                                            }}
                                          >
                                            {formatRouteName(leg)}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <p
                                    className={`leg-duration mt-2 ${
                                      leg.mode === "WALK" ? "walk-duration" : ""
                                    } ${getDurationTextSize(
                                      hasMany
                                    )} leading-tight`}
                                  >
                                    {leg.duration
                                      ? formatDuration(leg.duration)
                                      : "-"}
                                  </p>
                                </div>
                                {!isLastVisibleLeg && (
                                  <img
                                    src="/images/right-arrow.png"
                                    alt=""
                                    className="arrow-icon flex-shrink-0"
                                    style={{
                                      ...getArrowSize(hasMany),
                                      marginLeft: getArrowMargin(hasMany),
                                      display:
                                        mobileMode && hasMany
                                          ? "none"
                                          : "block",
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })
                        : "No transit option available"}
                    </div>
                    <div className="truncate">{departure}</div>
                    <div className="truncate">{arrival}</div>
                    <div>{travel}</div>
                  </div>
                );
              })}

            {/* Add empty rows to fill remaining space */}
            {Array.from({
              length: Math.max(0, totalRows - destinationData.length),
            }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className={`flex-1 grid ${
                  mobileMode
                    ? "grid-cols-[1fr_1.5fr_1fr_1fr_1fr]"
                    : "grid-cols-[1.5fr_2fr_1fr_1fr_1fr]"
                } ${getGridGap()} ${getRowPadding()} ${getRowStyles()} w-full min-w-0 items-center`}
                style={{
                  backgroundColor:
                    (destinationData.length + index) % 2 === 0
                      ? rowColor
                      : alternateRowColor,
                  color:
                    index % 2 === 0 ? tableTextColor : alternateRowTextColor,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="">-</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`${getEmptyRowTextSize()}`}>-</div>
                </div>
                <div className="">-</div>
                <div className="">-</div>
                <div className="">-</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer - Fixed height */}
      <div
        className={`bg-[#F4F4F4] flex items-center justify-between flex-shrink-0 ${getFooterPadding()}`}
      >
        <img
          src="/images/statewide-mobility-services.png"
          alt="Statewide Mobility Services"
          className={getFooterImageSize().logo}
        />
        <img
          src="/images/nysdot-footer-logo.png"
          alt="NYSDOT"
          className={getFooterImageSize().nysdot}
        />
      </div>
    </div>
  );
}
