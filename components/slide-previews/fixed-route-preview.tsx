import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFixedRouteStore } from "@/stores/fixedRoute";
import { HelpCircle, ChevronRight, Plus } from "lucide-react"
import { useEffect } from "react";


export default function FixedRoutePreview({ slideId }: { slideId: string }) {

  const stopName = useFixedRouteStore((state) => state.slides[slideId]?.stopName || '');
  const description = useFixedRouteStore((state) => state.slides[slideId]?.description || '');

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
      <div className="w-full h-[550px] flex flex-col justify-between bg-[#192f51] text-white rounded-lg overflow-hidden mb-6">        <div className="bg-[#192f51] text-white rounded-lg overflow-hidden">
        {/* Schedule Header */}
        <div className="p-6">
          <div className="text-lg mb-2">Stop #10506 arrival times</div>
          <h2 className="text-3xl font-bold mb-2">{stopName?.toString().toUpperCase() || "UNKNOWN STOP"}</h2>
          <p className="text-[#a0aec0]">{description}</p>
        </div>

        {/* Schedule Table */}
        <div className="bg-white text-black">
          {scheduleData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border-b border-[#e2e8f0] last:border-b-0"
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
                <div className="text-[#606061] min-w-[80px] text-center">{item.duration}</div>
                <Button variant="outline" size="sm" className="min-w-[90px] bg-transparent">
                  Scheduled
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

        {/* Footer */}
        <div className="bg-[#F4F4F4] p-3 flex items-center justify-between rounded-b-lg">
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
