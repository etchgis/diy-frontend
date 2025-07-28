import { useTransitDestinationsStore } from "@/stores/transitDestinations";
import { useEffect } from "react";

export default function TransitDestinationPreview({ slideId }: { slideId: string }) {

  const backgroundColor = useTransitDestinationsStore((state) => state.slides[slideId]?.backgroundColor || '');
  const rowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.rowColor || '');
  const alternateRowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.alternateRowColor || '');

  const destinations = [
    {
      name: "Albany International Airport",
      route: "1 hr 9 min",
      departure: "8:31 PM",
      arrival: "9:40 PM",
      travel: "1 hr 9 min",
      dark: true,
    },
    {
      name: "Downtown Schenectady",
      route: "3 hr 48 min",
      departure: "8:31 PM",
      arrival: "12:19 AM",
      travel: "3 hr 48 min",
      dark: false,
    },
    {
      name: "Albany Medical Center",
      route: "2 hr 2 min",
      departure: "8:31 PM",
      arrival: "10:33 PM",
      travel: "2 hr 2 min",
      dark: true,
    },
    {
      name: "Downtown Saratoga Springs",
      route: "2 hr 53 min",
      departure: "8:31 PM",
      arrival: "11:24 PM",
      travel: "2 hr 53 min",
      dark: false,
    },
    {
      name: "Albany-Rensselaer Train Station",
      route: "2 hr 11 min",
      departure: "8:31 PM",
      arrival: "10:42 PM",
      travel: "2 hr 11 min",
      dark: true,
    },
    {
      name: "Downtown Troy",
      route: "1 hr 3 min",
      departure: "8:31 PM",
      arrival: "9:34 PM",
      travel: "1 hr 3 min",
      dark: false,
    },
  ]

  const destinationTags = [
    "Albany International Airport",
    "Downtown Schenectady",
    "Albany Medical Center",
    "Downtown Saratoga Springs",
    "Albany-Rensselaer Train Station",
  ]

  return (
    <>
      {/* Transit Table */}
      <div className="mb-6">
        <div className="text-white" style={{ backgroundColor }} >
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 p-4 font-medium">
            <div>Destination</div>
            <div>Route</div>
            <div>Departure Time</div>
            <div>Arrival Time</div>
            <div>Travel Time</div>
          </div>

          {/* Table Rows */}
          {destinations.map((dest, index) => (
            <div
              key={index}
              className="grid grid-cols-5 gap-4 p-4"
              style={{
                backgroundColor: index % 2 === 0 ? rowColor : alternateRowColor, 
              }}
            >
              <div className="flex items-center gap-2">
                <span>{dest.name}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl">🚶</div>
                <div className="text-xs">{dest.route}</div>
              </div>
              <div>{dest.departure}</div>
              <div>{dest.arrival}</div>
              <div>{dest.travel}</div>
            </div>
          ))}
        </div>

        {/* Table Footer */}
        <div className="bg-[#F4F4F4] p-3 flex items-center justify-between">
          <img
            src="/images/statewide-mobility-services.png"
            alt="Statewide Mobility Services"
            className="h-[25px] w-[246px]"
          />
          <img src="/images/nysdot-footer-logo.png" alt="NYSDOT" className="h-8" />
        </div>
      </div>

    </>
  );
}