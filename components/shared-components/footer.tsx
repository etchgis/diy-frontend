import { usePathname } from "next/navigation";


export default function Footer() {
  const pathname = usePathname();
  const isEditor = pathname.includes("/editor");

  return (
    <div
      className={`bg-[#F4F4F4] p-3 flex items-center justify-between ${
        isEditor ? "rounded-b-lg" : "flex-shrink-0"
      }`}
    >
      <img
        src="/images/statewide-mobility-services.png"
        alt="Statewide Mobility Services"
        className="h-[25px] w-[246px]"
      />
      <img src="/images/nysdot-footer-logo.png" alt="NYSDOT" className="h-8" />
    </div>
  );
}
