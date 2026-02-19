import { useQRStore } from "@/stores/qr";
import { useGeneralStore } from "@/stores/general";
import QRCode from "react-qr-code";
import Footer from "../shared-components/footer";
import { usePathname } from "next/navigation";

export default function QRSlidePreview({ slideId }: { slideId: string }) {
  const text = useQRStore((state) => state.slides[slideId]?.text || "");
  const url = useQRStore((state) => state.slides[slideId]?.url || "");
  const backgroundColor = useQRStore(
    (state) => state.slides[slideId]?.backgroundColor || "#192F51"
  );
  const textColor = useQRStore(
    (state) => state.slides[slideId]?.textColor || "#ffffff"
  );
  const qrSize = useQRStore((state) => state.slides[slideId]?.qrSize || 5);
  const bgImage = useQRStore((state) => state.slides[slideId]?.bgImage || "");
  const logoImage = useQRStore(
    (state) => state.slides[slideId]?.logoImage || ""
  );
  const textSize = useQRStore(
    (state) => state.slides[slideId]?.textSize || 5
  );

  const pathname = usePathname();
  const isEditor = pathname.includes("/editor");
  const defaultFontFamily = useGeneralStore((state) => state.defaultFontFamily);

  // Convert 1-10 scale to multiplier (5 = 1.0x, 1 = 0.6x, 10 = 1.5x)
  const textSizeMultiplier = 0.5 + textSize * 0.1;

  const containerSize = isEditor ? `${2 * qrSize}rem` : `${qrSize * 8}vh`;
  const qrPixelSize = 32 * qrSize;

  return (
    <div
      className="w-full h-full flex flex-col justify-between overflow-hidden mb-6 relative"
      style={{
        backgroundColor: !bgImage ? backgroundColor : undefined,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor,
        fontFamily: defaultFontFamily && defaultFontFamily !== 'System Default' ? defaultFontFamily : undefined,
      }}
    >
      {/* Logo (only if present) */}
      {logoImage && (
        <img
          src={logoImage}
          alt="Logo"
          className="absolute top-6 right-6 max-h-16 object-contain z-20"
        />
      )}

      {/* QR Code and Text */}
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-6">
        <div className="bg-white mb-4" style={{ padding: isEditor ? "1rem" : "2vh" }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: containerSize,
              height: containerSize,
            }}
          >
            {url ? (
              <QRCode value={url} size={qrPixelSize} style={{ width: "100%", height: "100%" }} />
            ) : (
              <div className="text-gray-400" style={{ fontSize: isEditor ? "0.875rem" : "3vh" }}>No QR Code Data</div>
            )}
          </div>
        </div>
        <div
          className="font-medium text-center"
          style={{
            color: textColor,
            fontSize: isEditor ? `${18 * textSizeMultiplier}px` : `${4 * textSizeMultiplier}vh`,
          }}
        >
          {text}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
