import { useRef, useLayoutEffect, RefObject } from 'react';

function plainTextWidth(el: HTMLElement): number {
  const text = (el.textContent || '').trim();
  if (!text) return 0;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  const cs = getComputedStyle(el);
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return ctx.measureText(text).width;
}

export function useFitText(
  maxSize: string,
  deps: unknown[],
  minPx = 8,
  targetHeight?: number,
): RefObject<HTMLElement> {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      el.style.fontSize = maxSize;

      if (targetHeight !== undefined) {
        if (el.scrollHeight <= targetHeight) return;
        const naturalPx = parseFloat(getComputedStyle(el).fontSize);
        let lo = minPx;
        let hi = naturalPx;
        while (hi - lo > 0.5) {
          const mid = (lo + hi) / 2;
          el.style.fontSize = `${mid}px`;
          if (el.scrollHeight <= targetHeight) lo = mid;
          else hi = mid;
        }
        el.style.fontSize = `${lo}px`;
        return;
      }

      el.style.whiteSpace = 'nowrap';
      const containerWidth = el.clientWidth;
      const contentWidth = Math.max(el.scrollWidth, plainTextWidth(el));
      if (contentWidth <= containerWidth) return;
      const naturalPx = parseFloat(getComputedStyle(el).fontSize);
      const ratio = containerWidth / contentWidth;
      el.style.fontSize = `${Math.max(minPx, naturalPx * ratio)}px`;
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxSize, minPx, targetHeight, ...deps]);

  return ref as RefObject<HTMLElement>;
}
