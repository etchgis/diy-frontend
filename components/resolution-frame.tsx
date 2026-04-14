'use client';
import { useEffect, useLayoutEffect, useRef, useState, ReactNode, CSSProperties } from 'react';

interface ResolutionFrameProps {
  logicalW: number;
  logicalH: number;
  fontFamilyStyle?: CSSProperties;
  children: ReactNode;
}

export function ResolutionFrame({ logicalW, logicalH, fontFamilyStyle = {}, children }: ResolutionFrameProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  const computeScale = () => {
    const el = wrapperRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width > 0 && height > 0) {
      setScale(Math.min(width / logicalW, height / logicalH));
    }
  };

  useLayoutEffect(() => {
    computeScale();
  }, [logicalW, logicalH]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(computeScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [logicalW, logicalH]);

  const scaledW = scale != null ? Math.round(logicalW * scale) : 0;
  const scaledH = scale != null ? Math.round(logicalH * scale) : 0;

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', overflow: 'hidden' }}
    >
      {scale != null && (
        <div style={{ width: scaledW, height: scaledH, overflow: 'hidden', position: 'relative', flexShrink: 0, ...fontFamilyStyle }}>
          <div style={{ width: logicalW, height: logicalH, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
