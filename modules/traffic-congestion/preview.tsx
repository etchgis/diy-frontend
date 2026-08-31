import { proxyImageUrl } from "@/utils/proxyImageUrl";
import { useTrafficCongestionStore } from "./store";
import { useGeneralStore } from "@/stores/general";
import { useResScale } from "@/hooks/useResScale";
import { usePathname } from "next/navigation";
import Footer from "@/components/shared-components/footer";
import HtmlTextEditor from "@/components/shared-components/html-text-editor";
import { useState, useEffect, useRef } from "react";

const CONGESTION_ORG_ID = '2b651377-306a-4b79-a57b-91caf8aee555';
const CONGESTION_SLUG = 'congestion-nyc';

const MOCK_LEGEND = [
  { label: 'Free Flow', color: '#22c55e' },
  { label: 'Moderate', color: '#f59e0b' },
  { label: 'Heavy',    color: '#ef4444' },
  { label: 'Stopped',  color: '#7f1d1d' },
];

export default function TrafficCongestionPreview({
  slideId,
  previewMode = false,
  isEditor: isEditorProp,
}: {
  slideId: string;
  previewMode?: boolean;
  isEditor?: boolean;
}) {
  const pathname = usePathname();
  const isEditor = isEditorProp ?? (pathname.includes("/editor") && !previewMode);

  const title = useTrafficCongestionStore((state) => state.slides[slideId]?.title || "");
  const setTitle = useTrafficCongestionStore((state) => state.setTitle);
  const showTitle = useTrafficCongestionStore((state) => state.slides[slideId]?.showTitle !== false);
  const backgroundColor = useTrafficCongestionStore((state) => state.slides[slideId]?.backgroundColor || "#192F51");
  const bgImage = useTrafficCongestionStore((state) => state.slides[slideId]?.bgImage || "");
  const logoImage = useTrafficCongestionStore((state) => state.slides[slideId]?.logoImage || "");
  const titleColor = useTrafficCongestionStore((state) => state.slides[slideId]?.titleColor || "#ffffff");
  const textColor = useTrafficCongestionStore((state) => state.slides[slideId]?.textColor || "#ffffff");
  const mapCenter = useTrafficCongestionStore((state) => state.slides[slideId]?.mapCenter);
  const mapZoom = useTrafficCongestionStore((state) => state.slides[slideId]?.mapZoom ?? 12);
  const titleTextSize = useTrafficCongestionStore((state) => state.slides[slideId]?.titleTextSize || 5);
  const contentTextSize = useTrafficCongestionStore((state) => state.slides[slideId]?.contentTextSize || 5);

  const coordinates = useGeneralStore((state) => state.coordinates);
  const defaultFontFamily = useGeneralStore((state) => state.defaultFontFamily);
  const showFooter = useGeneralStore((state) => state.slides.find((s) => s.id === slideId)?.showFooter ?? true);
  const logoBaseHeight = useGeneralStore((state) => state.logoBaseHeight);
  const resolution = useGeneralStore((state) => state.resolution);
  const resScale = useResScale(resolution);
  const logoHeight = isEditor ? logoBaseHeight : logoBaseHeight * resScale;

  const [timeBucket, setTimeBucket] = useState(() => Math.floor(Date.now() / 120000));
  const [imageLoading, setImageLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const loadedUrlRef = useRef('');
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setTimeBucket(Math.floor(Date.now() / 120000)), 120000);
    return () => clearInterval(interval);
  }, []);

  const center = mapCenter ?? (coordinates ? [coordinates.lat, coordinates.lng] as [number, number] : null);
  const baseParams = center
    ? `w=2048&h=1152&lat=${center[0]}&lon=${center[1]}&zoom=${mapZoom}`
    : `w=2048&h=1152`;
  const etchMapUrl = `https://api.etch.app/astrostation/maps/${CONGESTION_ORG_ID}/${CONGESTION_SLUG}/static.png?${baseParams}`;

  useEffect(() => {
    if (etchMapUrl !== loadedUrlRef.current) {
      setImageLoading(true);
      setRetryCount(0);
      setRetryKey((k) => k + 1);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    }
  }, [etchMapUrl]);

  const titleSizeMultiplier = 0.5 + titleTextSize * 0.1;
  const contentSizeMultiplier = 0.5 + contentTextSize * 0.1;

  const legendFontSize = isEditor
    ? `${13 * contentSizeMultiplier}px`
    : `${2.8 * contentSizeMultiplier}cqh`;

  const dotSize = isEditor
    ? `${14 * contentSizeMultiplier}px`
    : `${2.5 * contentSizeMultiplier}cqh`;

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: !bgImage ? backgroundColor : undefined,
        backgroundImage: bgImage ? `url(${proxyImageUrl(bgImage)})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: textColor,
        fontFamily: defaultFontFamily && defaultFontFamily !== 'System Default' ? defaultFontFamily : undefined,
      }}
    >
      {/* Title + Logo */}
      {showTitle && (
        <div className="px-4 py-3 border-b border-white/20 flex-shrink-0 flex items-center">
          <div className={`flex-1 rounded px-3 ${isEditor ? 'border-2 border-[#11d1f7] py-1' : ''}`}>
            {isEditor ? (
              <HtmlTextEditor
                content={title}
                onChange={(html) => setTitle(slideId, html)}
                textColor={titleColor}
                fontSize={Math.round(36 * titleSizeMultiplier)}
                minHeight="1.4em"
              />
            ) : (
              <div
                className="font-light rich-text-content"
                style={{
                  color: titleColor,
                  fontSize: `${6 * titleSizeMultiplier}cqh`,
                  lineHeight: '1.2',
                }}
                dangerouslySetInnerHTML={{ __html: title || "" }}
              />
            )}
          </div>
          {logoImage && (
            <img
              src={proxyImageUrl(logoImage)}
              alt="Logo"
              className="object-contain ml-4 flex-shrink-0"
              style={{ height: logoHeight }}
            />
          )}
        </div>
      )}

      {/* Map Area */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {etchMapUrl ? (
          <>
            <img
              key={`${timeBucket}-${retryKey}`}
              src={etchMapUrl}
              alt="Traffic Congestion Map"
              className="w-full h-full object-cover"
              onLoad={() => { loadedUrlRef.current = etchMapUrl; setImageLoading(false); setRetryCount(0); }}
              onError={() => {
                setRetryCount((prev) => {
                  const next = prev + 1;
                  if (next <= 3) {
                    retryTimerRef.current = setTimeout(() => setRetryKey((k) => k + 1), next * 1500);
                  } else {
                    setImageLoading(false);
                  }
                  return next;
                });
              }}
            />
            {imageLoading && (
              <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5 pointer-events-none">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                <span className="text-white text-xs font-medium">{retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Loading map...'}</span>
              </div>
            )}
          </>
        ) : (
          /* Mock placeholder until the API is wired up */
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-[#1a1f2e]">
            {/* Simulated road grid */}
            <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
              {/* Horizontal corridors */}
              <line x1="0" y1="120" x2="800" y2="130" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
              <line x1="0" y1="200" x2="800" y2="215" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
              <line x1="0" y1="280" x2="800" y2="275" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />
              <line x1="0" y1="360" x2="800" y2="370" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
              {/* Vertical corridors */}
              <line x1="150" y1="0" x2="160" y2="500" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
              <line x1="320" y1="0" x2="330" y2="500" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
              <line x1="500" y1="0" x2="495" y2="500" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />
              <line x1="660" y1="0" x2="665" y2="500" stroke="#7f1d1d" strokeWidth="5" strokeLinecap="round" />
              {/* Minor roads */}
              <line x1="0" y1="450" x2="800" y2="445" stroke="#4b5563" strokeWidth="2" />
              <line x1="0" y1="60" x2="800" y2="65" stroke="#4b5563" strokeWidth="2" />
              <line x1="240" y1="0" x2="235" y2="500" stroke="#4b5563" strokeWidth="2" />
              <line x1="420" y1="0" x2="418" y2="500" stroke="#4b5563" strokeWidth="2" />
              <line x1="580" y1="0" x2="582" y2="500" stroke="#4b5563" strokeWidth="2" />
            </svg>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        className="flex-shrink-0 flex items-center justify-center border-t border-white/20"
        style={{
          padding: isEditor ? '8px 16px' : '1.2cqh 3cqw',
          gap: isEditor ? '20px' : '4cqw',
          backgroundColor: `${backgroundColor}cc`,
        }}
      >
        {MOCK_LEGEND.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="rounded-full flex-shrink-0"
              style={{ width: dotSize, height: dotSize, backgroundColor: color }}
            />
            <span style={{ fontSize: legendFontSize, color: textColor }}>{label}</span>
          </div>
        ))}
      </div>

      {showFooter && <Footer previewMode={previewMode} />}
    </div>
  );
}
