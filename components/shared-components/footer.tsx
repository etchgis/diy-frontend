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
    } else if (image) {
      return <img src={image} alt={altText} className={imageClass} />;
    } else {
      return <div className={placeholderClass} />;
    }
  };

  return (
    <div
      className={`p-3 flex items-center justify-between ${
        isEditor ? "rounded-b-lg" : "flex-shrink-0"
      }`}
      style={{ backgroundColor }}
    >
      {renderSection(
        leftType,
        leftImage,
        "Left Footer",
        "h-[25px] w-[246px]",
        "h-[25px] w-[246px]"
      )}
      {renderSection(
        middleType,
        middleImage,
        "Middle Footer",
        "h-[25px] w-[246px]",
        "h-[25px] w-[246px]"
      )}
      {renderSection(
        rightType,
        rightImage,
        "Right Footer",
        "h-8",
        "h-8 w-[100px]"
      )}
    </div>
  );
}
