'use client';
import { useWebEmbedStore } from './store';
import { useEffect, useRef, useState } from 'react';

export default function WebEmbedPreview({ slideId }: { slideId: string }) {
  const url = useWebEmbedStore((state) => state.slides[slideId]?.url || '');
  const zoom = useWebEmbedStore((state) => state.slides[slideId]?.zoom ?? 1.0);
  const scrollX = useWebEmbedStore((state) => state.slides[slideId]?.scrollX ?? 0);
  const scrollY = useWebEmbedStore((state) => state.slides[slideId]?.scrollY ?? 0);
  const refreshInterval = useWebEmbedStore((state) => state.slides[slideId]?.refreshInterval ?? 0);

  const [activeIdx, setActiveIdx] = useState(0);
  const [srcs, setSrcs] = useState<[string, string]>([url, '']);
  const pendingIdx = activeIdx === 0 ? 1 : 0;

  const prevUrlRef = useRef(url);
  useEffect(() => {
    if (url === prevUrlRef.current) return;
    prevUrlRef.current = url;
    setSrcs((prev) => {
      const next: [string, string] = [...prev] as [string, string];
      next[pendingIdx] = url;
      return next;
    });
  }, [url]); 

  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0 || !url) return;
    const ms = refreshInterval * 60 * 1000;
    const id = setInterval(() => {
      const busted = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
      setSrcs((prev) => {
        const next: [string, string] = [...prev] as [string, string];
        next[pendingIdx] = busted;
        return next;
      });
    }, ms);
    return () => clearInterval(id);
  }, [refreshInterval, url]); 

  const handleLoad = (idx: number) => {
    if (idx === pendingIdx && srcs[pendingIdx]) {
      setActiveIdx(idx);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const block = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('wheel', block, { passive: false });
    el.addEventListener('touchmove', block, { passive: false });
    return () => {
      el.removeEventListener('wheel', block);
      el.removeEventListener('touchmove', block);
    };
  }, []);

  const iframeStyle = (idx: number): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: `calc(${100 / zoom}% + ${scrollX}px)`,
    height: `calc(${100 / zoom}% + ${scrollY}px)`,
    transform: `scale(${zoom}) translate(-${scrollX}px, -${scrollY}px)`,
    transformOrigin: 'top left',
    border: 'none',
    pointerEvents: 'none',
    opacity: idx === activeIdx ? 1 : 0,
    transition: 'opacity 0.5s ease',
    zIndex: idx === activeIdx ? 1 : 0,
  });

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative bg-black"
      style={{ minHeight: 0 }}
    >
      {!url && (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
          No URL configured
        </div>
      )}
      {([0, 1] as const).map((idx) => (
        srcs[idx] ? (
          <iframe
            key={idx}
            src={srcs[idx]}
            style={iframeStyle(idx)}
            onLoad={() => handleLoad(idx)}
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="Web embed"
          />
        ) : null
      ))}
    </div>
  );
}
