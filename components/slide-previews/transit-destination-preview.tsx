import { useTransitDestinationsStore } from "@/stores/transitDestinations";
import { useEffect } from "react";

export default function TransitDestinationPreview({ slideId }: { slideId: string }) {

  const backgroundColor = useTransitDestinationsStore((state) => state.slides[slideId]?.backgroundColor || '#192F51');
  const rowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.rowColor || '#192F51');
  const alternateRowColor = useTransitDestinationsStore((state) => state.slides[slideId]?.alternateRowColor || '#78B1DD');
  const tableHeaderTextColor = useTransitDestinationsStore((state) => state.slides[slideId]?.tableHeaderTextColor || '#ffffff');
  const tableTextColor = useTransitDestinationsStore((state) => state.slides[slideId]?.tableTextColor || '#ffffff');

  const mockDestinations = [
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

  const destinations = useTransitDestinationsStore((state) => state.slides[slideId]?.destinations || mockDestinations);

  const destinationTags = [
    "Albany International Airport",
    "Downtown Schenectady",
    "Albany Medical Center",
    "Downtown Saratoga Springs",
    "Albany-Rensselaer Train Station",
  ]

  return (
    <>
      <div className="w-full h-full flex flex-col justify-between bg-[#192f51] text-white rounded-lg overflow-hidden mb-6">
        {/* Header */}
        <div className="text-white" style={{ backgroundColor, color: tableHeaderTextColor }}>
          <div className="grid grid-cols-5 gap-4 p-4 font-medium">
            <div>Destination</div>
            <div>Route</div>
            <div>Departure Time</div>
            <div>Arrival Time</div>
            <div>Travel Time</div>
          </div>
        </div>

        {/* Row Container — this must grow */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {destinations.map((dest, index) => (
            <div
              key={index}
              className="grid grid-cols-5 gap-4 p-[12.5px] items-center"
              style={{
                backgroundColor: index % 2 === 0 ? rowColor : alternateRowColor,
                color: tableTextColor,
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

          {/* Add empty rows if there are fewer than 6 destinations */}
          {Array.from({ length: Math.max(0, 6 - destinations.length) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="grid grid-cols-5 gap-4 p-[21px] items-center"
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

        {/* Footer */}
        <div className="bg-[#F4F4F4] p-3 flex items-center justify-between">
          <img src="/images/statewide-mobility-services.png" alt="Statewide Mobility Services" className="h-[25px] w-[246px]" />
          <img src="/images/nysdot-footer-logo.png" alt="NYSDOT" className="h-8" />
        </div>
      </div>

    </>
  );
}