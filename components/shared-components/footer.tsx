import { usePathname } from "next/navigation";
import { useFooterStore } from "@/stores/footer";
import { useGeneralStore } from "@/stores/general";
import { useState, useEffect } from "react";
import { useResScale } from "@/hooks/useResScale";

export default function Footer({ previewMode = false }: { previewMode?: boolean }) {
  const pathname = usePathname();
  const isEditor = pathname.includes("/editor") && !previewMode;

  const leftImage = useFooterStore((state) => state.leftImage);
  const middleImage = useFooterStore((state) => state.middleImage);
  const rightImage = useFooterStore((state) => state.rightImage);
  const leftType = useFooterStore((state) => state.leftType);
  const middleType = useFooterStore((state) => state.middleType);
  const rightType = useFooterStore((state) => state.rightType);
  const leftText = useFooterStore((state) => state.leftText);
  const middleText = useFooterStore((state) => state.middleText);
  const rightText = useFooterStore((state) => state.rightText);
  const backgroundColor = useFooterStore((state) => state.backgroundColor);
  const timeTextColor = useFooterStore((state) => state.timeTextColor);
  const footerBaseHeight = useFooterStore((state) => state.footerBaseHeight);

  const resolution = useGeneralStore((state) => state.resolution);
  const resScale = useResScale(resolution);
  const footerHeight = isEditor ? 50 : footerBaseHeight * resScale;

  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const imgMaxHeight = footerHeight * 0.72;
  const fontSize = Math.max(10, footerHeight * 0.38);

  const renderSection = (type: string, image: string, text: string, altText: string) => {
    if (type === "none") {
      return null;
    } else if (type === "time") {
      return (
        <div style={{ color: timeTextColor, fontSize, fontWeight: 500, lineHeight: 1 }}>
          {currentTime}
        </div>
      );
    } else if (type === "text") {
      return (
        <div
          style={{ color: timeTextColor, fontSize }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    } else if (image) {
      return (
        <img
          src={image}
          alt={altText}
          style={{ height: imgMaxHeight, width: "auto", objectFit: "contain" }}
        />
      );
    }
    return null;
  };

  return (
    <div
      className={`flex items-center gap-4 overflow-hidden ${
        isEditor ? "rounded-b-lg" : "flex-shrink-0"
      }`}
      style={{
        backgroundColor,
        height: footerHeight,
        paddingLeft: footerHeight * 0.24,
        paddingRight: footerHeight * 0.24,
      }}
    >
      <div className="flex-1 min-w-0 flex items-center">
        {renderSection(leftType, leftImage, leftText, "Left Footer")}
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-center">
        {renderSection(middleType, middleImage, middleText, "Middle Footer")}
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-end">
        {renderSection(rightType, rightImage, rightText, "Right Footer")}
      </div>
    </div>
  );
}
