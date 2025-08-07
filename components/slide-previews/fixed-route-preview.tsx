import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFixedRouteStore } from "@/stores/fixedRoute";
import { HelpCircle, ChevronRight, Plus } from "lucide-react"
import { usePathname } from "next/navigation";
import { useEffect } from "react";


export default function FixedRoutePreview({ slideId }: { slideId: string }) {

  const stopName = useFixedRouteStore((state) => state.slides[slideId]?.stopName || '');
  const description = useFixedRouteStore((state) => state.slides[slideId]?.description || '');
  const backgroundColor = useFixedRouteStore((state) => state.slides[slideId]?.backgroundColor || '#192F51');
  const titleColor = useFixedRouteStore((state) => state.slides[slideId]?.titleColor || '#FFFFFF');
  const tableColor = useFixedRouteStore((state) => state.slides[slideId]?.tableColor || '#FFFFFF');
  const tableTextColor = useFixedRouteStore((state) => state.slides[slideId]?.tableTextColor || '#000000');
  const bgImage = useFixedRouteStore((state) => state.slides[slideId]?.bgImage || '');
  const selectedStop = useFixedRouteStore((state) => state.slides[slideId]?.selectedStop || null);

  const pathname = usePathname();
  const isEditor = pathname.includes('/editor');


  const scheduleData = [
    {
      destination: "Airport directly to Rte 7 & Donald",
      route: "117",
      routeColor: "bg-green-600",
      time: "9:49 PM",
      duration: "27 min",
    },
    {
      destination: "Colonie Center to Downtown Albany",
      route: "1",
      routeColor: "bg-blue-800",
      time: "9:57 PM",
      duration: "35 min",
    },
    {
      destination: "Colonie Center to Downtown Albany",
      route: "1",
      routeColor: "bg-blue-800",
      time: "10:17 PM",
      duration: "55 min",
    },
    {
      destination: "Airport directly to Rte 7 & Donald",
      route: "117",
      routeColor: "bg-green-600",
      time: "10:19 PM",
      duration: "57 min",
    },
    {
      destination: "Airport directly to Rte 7 & Donald",
      route: "117",
      routeColor: "bg-green-600",
      time: "10:49 PM",
      duration: "1 hr 27 min",
    },
    {
      destination: "Colonie Center to Downtown Albany",
      route: "1",
      routeColor: "bg-blue-800",
      time: "10:57 PM",
      duration: "1 hr 35 min",
    },

  ]

  return (
    <>
      {/* Transit Schedule Display */}
      <div className={`w-full h-full flex flex-col justify-between text-white overflow-hidden mb-6 ${isEditor ? 'rounded-lg' : ''}`}>
        <div
          className={`w-full h-full flex flex-col justify-between text-white overflow-hidden relative ${isEditor ? 'rounded-lg' : ''}`}
          style={{
            backgroundColor: !bgImage ? backgroundColor : undefined,
            backgroundImage: bgImage ? `url(${bgImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: titleColor || '#ffffff',
          }}
        >
          {/* Schedule Header */}
          {isEditor ? (
            <div className="p-6">
              <div className="text-lg mb-2">Stop #{selectedStop?.stop_id} arrival times</div>
              <h2 className="text-3xl font-bold mb-2">{selectedStop?.stop_name?.toString().toUpperCase() || "UNKNOWN STOP"}</h2>
              <p className="text-[#a0aec0]">{description}</p>
            </div>
          ) : (
            <div className="p-2 sm:p-4 lg:p-6 xl:p-8" style={{ padding: 'clamp(0.5rem, 2vw, 2rem)' }}>
              <div
                className="mb-1 sm:mb-2"
                style={{
                  fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)',
                  marginBottom: 'clamp(0.25rem, 0.5vw, 0.5rem)'
                }}
              >
                Stop #10506 arrival times
              </div>
              <h2
                className="font-bold mb-1 sm:mb-2"
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                  marginBottom: 'clamp(0.25rem, 0.5vw, 0.5rem)'
                }}
              >
                {stopName?.toString().toUpperCase() || "UNKNOWN STOP"}
              </h2>
              <p
                className="text-[#a0aec0]"
                style={{ fontSize: 'clamp(0.75rem, 1.2vw, 1rem)' }}
              >
                {description}
              </p>
            </div>
          )}

          {/* Schedule Table */}
          {isEditor ? (
            <div className="text-black">
              {scheduleData.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between ${description ? 'p-[10px]' : 'p-[12px]'} border-b border-[#e2e8f0] last:border-b-0`}
                  style={{
                    backgroundColor: !bgImage ? tableColor : 'transparent',
                    color: tableTextColor,
                  }}
                >
                  <div className="flex-1">
                    <span className="font-medium">{item.destination}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`${item.routeColor} text-white px-3 py-1 rounded font-bold text-sm min-w-[50px] text-center`}
                    >
                      {item.route}
                    </div>
                    <div className="font-medium min-w-[80px] text-center">{item.time}</div>
                    <div className=" min-w-[80px] text-center">{item.duration}</div>
                    <Button variant="outline" size="sm" className="min-w-[90px] bg-transparent">
                      Scheduled
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-black flex flex-col" style={{ height: '80%' }}>
              {scheduleData.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 flex items-center justify-between border-b border-[#e2e8f0] last:border-b-0"
                  style={{
                    backgroundColor: !bgImage ? tableColor : 'transparent',
                    color: tableTextColor,
                    padding: `clamp(0.5rem, 1.5vw, ${description ? '0.625rem' : '0.75rem'})`,
                  }}
                >
                  <div className="flex-1">
                    <span
                      className="font-medium"
                      style={{ fontSize: 'clamp(0.875rem, 2vw, 1.125rem)' }}
                    >
                      {item.destination}
                    </span>
                  </div>
                  <div
                    className="flex items-center"
                    style={{ gap: 'clamp(0.5rem, 1vw, 1rem)' }}
                  >
                    <div
                      className={`${item.routeColor} text-white rounded font-bold text-center`}
                      style={{
                        padding: 'clamp(0.25rem, 0.5vw, 0.5rem) clamp(0.5rem, 1vw, 0.75rem)',
                        fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)',
                        minWidth: 'clamp(40px, 4vw, 50px)',
                      }}
                    >
                      {item.route}
                    </div>
                    <div
                      className="font-medium text-center"
                      style={{
                        fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                        minWidth: 'clamp(60px, 6vw, 80px)'
                      }}
                    >
                      {item.time}
                    </div>
                    <div
                      className="text-[#606061] text-center"
                      style={{
                        fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                        minWidth: 'clamp(60px, 6vw, 80px)'
                      }}
                    >
                      {item.duration}
                    </div>
                    <Button
                      variant="outline"
                      className="bg-transparent"
                      style={{
                        fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)',
                        padding: 'clamp(0.25rem, 0.5vw, 0.5rem) clamp(0.5rem, 1vw, 0.75rem)',
                        minWidth: 'clamp(70px, 7vw, 90px)',
                      }}
                    >
                      Scheduled
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`bg-[#F4F4F4] p-3 flex items-center justify-between ${isEditor ? 'rounded-b-lg' : 'flex-shrink-0'}`}>
          <img
            src="/images/statewide-mobility-services.png"
            alt="Statewide Mobility Services"
            className="h-[25px] w-[246px]"
          />
          <img src="/images/nysdot-footer-logo.png" alt="NYSDOT" className="h-8" />
        </div>
      </div>
    </>
  )

}
