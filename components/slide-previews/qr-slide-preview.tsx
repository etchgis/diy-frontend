import { useQRStore } from "@/stores/qr";
import QRCode from "react-qr-code";

export default function QRSlidePreview({ slideId }: { slideId: string }) {
  const text = useQRStore((state) => state.slides[slideId]?.text || '');
  const url = useQRStore((state) => state.slides[slideId]?.url || '');
  const backgroundColor = useQRStore((state) => state.slides[slideId]?.backgroundColor || '#192F51');
  const qrSize = useQRStore((state) => state.slides[slideId]?.qrSize || 5);
  const bgImage = useQRStore((state) => state.slides[slideId]?.bgImage || '');


  const containerSizeRem = 2 * qrSize;
  const qrPixelSize = 32 * qrSize;


  return (
    <div
      className="w-full h-full flex flex-col justify-between text-white rounded-lg overflow-hidden mb-6 relative"
      style={{
        backgroundColor: !bgImage ? backgroundColor : undefined,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* QR Code and Text */}
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-6">
        <div className="bg-white p-4 rounded-lg mb-4">
          <div
            className="flex items-center justify-center"
            style={{ width: `${containerSizeRem}rem`, height: `${containerSizeRem}rem` }}
          >
            {url ? (
              <QRCode value={url} size={qrPixelSize} />
            ) : (
              <div className="text-gray-400 text-sm">No QR Code Data</div>
            )}
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