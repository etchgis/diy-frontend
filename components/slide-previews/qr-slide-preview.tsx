import { useQRStore } from "@/stores/qr";

export default function QRSlidePreview({ slideId }: { slideId: string }) {
  const text = useQRStore((state) => state.slides[slideId]?.text || '');

  return (
    <div className="w-full h-[550px] flex flex-col justify-between bg-[#192f51] text-white rounded-lg overflow-hidden mb-6 relative">
      {/* QR Code and Text */}
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-6">
        <div className="bg-white p-4 rounded-lg mb-4">
          <div className="w-36 h-36 flex items-center justify-center">
            <img
              src="/placeholder.svg?height=192&width=192"
              alt="QR Code"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <div className="text-lg font-medium text-center">{text}</div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 w-full bg-[#F4F4F4] p-3 flex items-center justify-between rounded-b-lg z-10">
        <img
          src="/images/statewide-mobility-services.png"
          alt="Statewide Mobility Services"
          className="h-[25px] w-[246px]"
        />
        <img src="/images/nysdot-footer-logo.png" alt="NYSDOT" className="h-8" />
      </div>
    </div>
  );
}