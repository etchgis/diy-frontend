import { usePathname } from "next/navigation";
import { useFooterStore } from "@/stores/footer";
import { useState, useEffect } from "react";

export default function Footer() {
  const pathname = usePathname();
  const isEditor = pathname.includes("/editor");

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

  const renderSection = (
    type: string,
    image: string,
    text: string,
    altText: string,
    imageClass: string,
    placeholderClass: string
  ) => {
    if (type === "none") {
      return <div className={placeholderClass} />;
    } else if (type === "time") {
      return (
        <div
          className={`font-medium ${placeholderClass}`}
          style={{ color: timeTextColor }}
        >
          {currentTime}
        </div>
      );
    } else if (type === "text") {
      return (
        <div
          className={`${placeholderClass} flex items-center`}
          style={{ color: timeTextColor }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    } else if (image) {
      return <img src={image} alt={altText} className={`${imageClass} object-contain`} />;
    } else {
      return <div className={placeholderClass} />;
    }
  };

  return (
    <div
      className={`p-3 flex items-center gap-4 ${
        isEditor ? "rounded-b-lg" : "flex-shrink-0"
      }`}
      style={{ backgroundColor }}
    >
      <div className="flex-1 min-w-0 flex items-center">
        {renderSection(leftType, leftImage, leftText, "Left Footer", "h-[25px] max-h-full", "h-[25px]")}
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-center">
        {renderSection(middleType, middleImage, middleText, "Middle Footer", "h-[25px] max-h-full", "h-[25px]")}
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-end">
        {renderSection(rightType, rightImage, rightText, "Right Footer", "h-8 max-h-full", "h-8")}
      </div>
    </div>
  );
}
