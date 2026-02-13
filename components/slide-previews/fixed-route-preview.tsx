import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFixedRouteStore } from "@/stores/fixedRoute";
import { useGeneralStore } from "@/stores/general";
import { HelpCircle, ChevronRight, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import Footer from "../shared-components/footer";
import { useEffect } from "react";

export default function FixedRoutePreview({ slideId }: { slideId: string }) {
  const stopName = useFixedRouteStore(
    (state) => state.slides[slideId]?.stopName || ""
  );
  const description = useFixedRouteStore(
    (state) => state.slides[slideId]?.description || ""
  );
  const backgroundColor = useFixedRouteStore(
    (state) => state.slides[slideId]?.backgroundColor || "#192F51"
  );
  const titleColor = useFixedRouteStore(
    (state) => state.slides[slideId]?.titleColor || "#FFFFFF"
  );
  const tableColor = useFixedRouteStore(
    (state) => state.slides[slideId]?.tableColor || "#FFFFFF"
  );
  const tableTextColor = useFixedRouteStore(
    (state) => state.slides[slideId]?.tableTextColor || "#000000"
  );
  const bgImage = useFixedRouteStore(
    (state) => state.slides[slideId]?.bgImage || ""
  );
  const logoImage = useFixedRouteStore(
    (state) => state.slides[slideId]?.logoImage || ""
  );
  const selectedStop = useFixedRouteStore(
    (state) => state.slides[slideId]?.selectedStop || null
  );
  const scheduleData = useFixedRouteStore(
    (state) => state.slides[slideId]?.scheduleData || null
  );
  const dataError = useFixedRouteStore(
    (state) => state.slides[slideId]?.dataError || null
  );
  const showTitle = useFixedRouteStore(
    (state) => state.slides[slideId]?.showTitle !== false
  );

  const pathname = usePathname();
  const isEditor = pathname.includes("/editor");
  const defaultFontFamily = useGeneralStore((state) => state.defaultFontFamily);

  const isLoading = useFixedRouteStore(
    (state) => state.slides[slideId]?.isLoading
  );
  const titleTextSize = useFixedRouteStore(
    (state) => state.slides[slideId]?.titleTextSize || 5
  );
  const contentTextSize = useFixedRouteStore(
    (state) => state.slides[slideId]?.contentTextSize || 5
  );

  // Convert 1-10 scale to multiplier (5 = 1.0x, 1 = 0.6x, 10 = 1.5x)
  const titleSizeMultiplier = 0.5 + titleTextSize * 0.1;
  const contentSizeMultiplier = 0.5 + contentTextSize * 0.1;

  // Get rail icon based on organization/agency name
  const getRailIcon = (): string => {
    const orgId = selectedStop?.services?.[0]?.organization_guid || selectedStop?.organization_guid || '';
    const orgName = selectedStop?.services?.[0]?.agency_name || selectedStop?.agency_name || '';
    const combined = `${orgId} ${orgName}`.toLowerCase();

    console.log(combined);

    if (combined.includes('lirr') || combined.includes('long island')) {
      return '/images/lirr-rail-icon.png';
    }
    if (combined.includes('mnr') || combined.includes('metro-north') || combined.includes('metronorth') || combined.includes('metro north')) {
      console.log('yes');
      return '/images/mn-rail-icon.png';
    }
    if (combined.includes('amtrak') || combined.includes('amtk')) {
      return '/images/amtrack-rail-icon.png';
    }
    return '/images/rail-icon.png';
  };

  // Determine the correct icon based on routeType from schedule data
  const getModeIcon = (): string => {
    // Get routeType from first arrival in scheduleData
    console.log(scheduleData);
    const routeTypeRaw = scheduleData?.[0]?.routeType;
    const routeType = routeTypeRaw !== undefined ? Number(routeTypeRaw) : undefined;


    // GTFS route types: 0=tram/light rail, 1=subway, 2=rail, 3=bus
    switch (routeType) {
      case 0: // Tram/Light Rail
      case 2: // Rail (LIRR, Metro-North, Amtrak, etc.)
        const railIcon = getRailIcon();
        return railIcon;
      case 1: // Subway/Metro
        return '/images/subway-icon.png';
      case 3: // Bus
        return '/images/bus-icon.png';
      default:
        return getRailIcon();;
    }
  };

  const modeIcon = getModeIcon();


  // Loading Spinner Component
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-16 h-16 border-4 border-gray-300 rounded-full animate-spin border-t-white"></div>
      <div className="mt-4 text-white text-lg font-medium">
        Loading schedule...
      </div>
    </div>
  );

  return (
    <>
      {/* Transit Schedule Display */}
      <div
        className={`w-full h-full flex flex-col justify-between text-white overflow-hidden mb-6 `}
      >
        <div
          className={`w-full h-full flex flex-col justify-between text-white overflow-hidden relative `}
          style={{
            backgroundColor: !bgImage ? backgroundColor : undefined,
            backgroundImage: bgImage ? `url(${bgImage})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: titleColor || "#ffffff",
            fontFamily: defaultFontFamily && defaultFontFamily !== 'System Default' ? defaultFontFamily : undefined,
          }}
        >
          {/* Schedule Header */}
          {showTitle && (
            isEditor ? (
              <div className="p-6 flex items-center">
                <div className="flex-1">
                  <div className="mb-2" style={{display: 'flex', alignItems: 'center', fontSize: `${18 * titleSizeMultiplier}px`}}>
                    <img src={modeIcon} style={{height: `${25 * titleSizeMultiplier}px`, width: `${25 * titleSizeMultiplier}px`, marginRight: '5px', objectFit: 'contain'}} alt="" />
                    <p>Stop #{selectedStop?.stop_id} arrival times</p>
                  </div>

                  <h2 className="font-bold mb-2" style={{ fontSize: `${30 * titleSizeMultiplier}px` }}>
                    {selectedStop?.stop_name?.toString().toUpperCase() ||
                      "UNKNOWN STOP"}
                  </h2>

                  <p style={{ fontSize: `${16 * titleSizeMultiplier}px` }}>{description}</p>
                </div>
                {logoImage && (
                  <img
                    src={logoImage}
                    alt="Logo"
                    className="max-h-16 object-contain ml-4 flex-shrink-0"
                  />
                )}
              </div>
            ) : (
              <div
                className="p-2 sm:p-4 lg:p-6 xl:p-8 flex items-center flex-shrink-0 overflow-hidden"
                style={{ padding: "clamp(0.5rem, 2vw, 2rem)", maxHeight: "25%" }}
              >
                <div className="flex-1 overflow-hidden">
                  <div
                    className="mb-1 sm:mb-2 overflow-hidden"
                    style={{
                      fontSize: `clamp(0.75rem, ${2.5 * titleSizeMultiplier}vh, 3rem)`,
                      marginBottom: "clamp(0.25rem, 0.5vw, 0.5rem)",
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <img src={modeIcon} style={{height: `clamp(16px, ${3 * titleSizeMultiplier}vh, 4rem)`, width: `clamp(16px, ${3 * titleSizeMultiplier}vh, 4rem)`, marginRight: '5px', objectFit: 'contain'}} alt="" />
                    <span className="truncate">Stop #{selectedStop?.stop_id} arrival times</span>
                  </div>

                  <h2
                    className="font-bold mb-1 sm:mb-2 truncate"
                    style={{
                      fontSize: `clamp(1.25rem, ${6 * titleSizeMultiplier}vh, 6rem)`,
                      marginBottom: "clamp(0.25rem, 0.5vw, 0.5rem)",
                    }}
                  >
                    {stopName?.toString().toUpperCase() || "UNKNOWN STOP"}
                  </h2>

                  <p className="truncate" style={{ fontSize: `clamp(0.625rem, ${2 * titleSizeMultiplier}vh, 2.5rem)` }}>
                    {description}
                  </p>
                </div>
                {logoImage && (
                  <img
                    src={logoImage}
                    alt="Logo"
                    className="max-h-16 object-contain ml-4 flex-shrink-0"
                  />
                )}
              </div>
            )
          )}

          {/* Schedule Table or Loading Spinner */}
          {isLoading ? (
            <LoadingSpinner />
          ) : dataError ? (
            // Show warning message if dataError is true
            <div className="flex items-center justify-center h-full">
              <div
                className="p-6 bg-white rounded-lg shadow-md"
                style={{
                  backgroundColor: tableColor,
                  color: tableTextColor,
                  maxWidth: "400px",
                  textAlign: "center",
                }}
              >
                <p className="text-yellow-600 text-sm">
                  ⚠️ Stop arrival data currently not available. Please check
                  again later.
                </p>
              </div>
            </div>
          ) : (
            <>
              {isEditor ? (
                <div className="text-black">
                  {scheduleData &&
                    scheduleData.map((item: any, index: number) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between ${
                          description ? "p-[10px]" : "p-[12px]"
                        } border-b border-[#e2e8f0] last:border-b-0`}
                        style={{
                          backgroundColor: !bgImage
                            ? tableColor
                            : "transparent",
                          color: tableTextColor,
                        }}
                      >
                        <div className="flex-1">
                          <span className="font-medium" style={{ fontSize: `${14 * contentSizeMultiplier}px` }}>
                            {item.destination}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div
                            className={`rounded font-bold text-center`}
                            style={{
                              padding:
                                "clamp(0.25rem, 0.5vw, 0.5rem) clamp(0.5rem, 1vw, 0.75rem)",
                              fontSize: `${12 * contentSizeMultiplier}px`,
                              minWidth: `${40 * contentSizeMultiplier}px`,
                              color: `#${item.routeTextColor}`,
                              backgroundColor: `#${item.routeColor}`,
                            }}
                          >
                            {item.routeId}
                          </div>
                          <div className="font-medium text-center" style={{ fontSize: `${14 * contentSizeMultiplier}px`, minWidth: `${80 * contentSizeMultiplier}px` }}>
                            {item.time}
                          </div>
                          <div className="text-center" style={{ fontSize: `${14 * contentSizeMultiplier}px`, minWidth: `${80 * contentSizeMultiplier}px` }}>
                            {item.duration}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent"
                            style={{ fontSize: `${12 * contentSizeMultiplier}px`, minWidth: `${90 * contentSizeMultiplier}px` }}
                          >
                            {item.status}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div
                  className="text-black flex flex-col overflow-hidden"
                  style={{ flex: "1 1 0", minHeight: 0 }}
                >
                  {scheduleData &&
                    scheduleData.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b border-[#e2e8f0] last:border-b-0 overflow-hidden"
                        style={{
                          flex: "1 1 0",
                          minHeight: 0,
                          backgroundColor: !bgImage
                            ? tableColor
                            : "transparent",
                          color: tableTextColor,
                          padding: `clamp(0.5rem, 1.5vw, ${
                            description ? "0.625rem" : "0.75rem"
                          })`,
                        }}
                      >
                        <div className="flex-1 overflow-hidden">
                          <span
                            className="font-medium block truncate"
                            style={{
                              fontSize: `clamp(0.75rem, ${3 * contentSizeMultiplier}vh, 3rem)`,
                            }}
                          >
                            {item.destination}
                          </span>
                        </div>
                        <div
                          className="flex items-center flex-shrink-0"
                          style={{ gap: "clamp(0.5rem, 1vw, 1rem)" }}
                        >
                          <div
                            className={`rounded font-bold text-center`}
                            style={{
                              padding:
                                "clamp(0.25rem, 0.5vw, 0.5rem) clamp(0.5rem, 1vw, 0.75rem)",
                              fontSize: `clamp(0.625rem, ${2.5 * contentSizeMultiplier}vh, 2.5rem)`,
                              minWidth: `clamp(40px, ${5 * contentSizeMultiplier}vh, 80px)`,
                              color: `#${item.routeTextColor}`,
                              backgroundColor: `#${item.routeColor}`,
                            }}
                          >
                            {item.routeId}
                          </div>
                          <div
                            className="font-medium text-center"
                            style={{
                              fontSize: `clamp(0.75rem, ${3 * contentSizeMultiplier}vh, 3rem)`,
                              minWidth: `clamp(60px, ${8 * contentSizeMultiplier}vh, 120px)`,
                            }}
                          >
                            {item.time}
                          </div>
                          <div
                            className="text-center"
                            style={{
                              fontSize: `clamp(0.75rem, ${3 * contentSizeMultiplier}vh, 3rem)`,
                              minWidth: `clamp(60px, ${8 * contentSizeMultiplier}vh, 120px)`,
                            }}
                          >
                            {item.duration}
                          </div>
                          <Button
                            variant="outline"
                            className="bg-transparent"
                            style={{
                              fontSize: `clamp(0.625rem, ${2.5 * contentSizeMultiplier}vh, 2.5rem)`,
                              padding:
                                "clamp(0.25rem, 0.5vw, 0.5rem) clamp(0.5rem, 1vw, 0.75rem)",
                              minWidth: `clamp(70px, ${10 * contentSizeMultiplier}vh, 150px)`,
                            }}
                          >
                            {item.status}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
