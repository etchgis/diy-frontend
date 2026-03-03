import { useRef, useEffect, useState } from "react";

interface AutoFitTextProps {
  text: string;
  color: string;
  maxFontSize?: number;
  minFontSize?: number;
  lineHeight?: number;
  className?: string;
}

export default function AutoFitText({
  text,
  color,
  maxFontSize = 48,
  minFontSize = 4,
  lineHeight = 1.3,
  className = "",
}: AutoFitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl || !text) return;

    // Start from max and shrink until it fits
    let size = maxFontSize;
    textEl.style.fontSize = `${size}px`;
    textEl.style.lineHeight = `${lineHeight}`;

    while (textEl.scrollHeight > container.clientHeight && size > minFontSize) {
      size -= 1;
      textEl.style.fontSize = `${size}px`;
    }

    setFontSize(size);
  }, [text, maxFontSize, minFontSize, lineHeight]);

  // Also re-fit on window resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const textEl = textRef.current;
      if (!container || !textEl || !text) return;

      let size = maxFontSize;
      textEl.style.fontSize = `${size}px`;
      textEl.style.lineHeight = `${lineHeight}`;

      while (textEl.scrollHeight > container.clientHeight && size > minFontSize) {
        size -= 1;
        textEl.style.fontSize = `${size}px`;
      }

      setFontSize(size);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [text, maxFontSize, minFontSize, lineHeight]);

  return (
    <div ref={containerRef} className={`w-full h-full overflow-hidden ${className}`}>
      <div
        ref={textRef}
        className="w-full font-light whitespace-pre-wrap"
        style={{
          color,
          fontSize: `${fontSize}px`,
          lineHeight: `${lineHeight}`,
        }}
      >
        {text}
      </div>
    </div>
  );
}
