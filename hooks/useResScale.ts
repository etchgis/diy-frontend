'use client';
import { useState, useEffect } from 'react';

/**
 * Returns the resolution scale factor (logical canvas height / 1080).
 * In responsive mode uses the actual viewport height so footer/logo
 * sizes match what a matching fixed resolution would produce.
 */
export function useResScale(resolution: string | undefined): number {
  const isResponsive = !resolution || resolution === 'responsive';

  const [viewportH, setViewportH] = useState<number>(() => {
    if (typeof window !== 'undefined') return window.innerHeight;
    return 1080;
  });

  useEffect(() => {
    if (!isResponsive) return;
    const update = () => setViewportH(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isResponsive]);

  if (isResponsive) return viewportH / 1080;
  return parseInt(resolution!.split('x')[1] || '1080', 10) / 1080;
}
