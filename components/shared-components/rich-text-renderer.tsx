'use client';

import { useEffect, useRef, useState } from 'react';

interface RichTextRendererProps {
  html: string;
  color: string;
  maxFontSize?: number;
  minFontSize?: number;
  lineHeight?: number;
  className?: string;
}

/**
 * Renders rich text HTML with auto-shrink behaviour matching AutoFitText.
 * Falls back gracefully for legacy plain-text content.
 */
export default function RichTextRenderer({
  html,
  color,
  maxFontSize = 48,
  minFontSize = 4,
  lineHeight = 1.4,
  className = '',
}: RichTextRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  // Determine if content is HTML or legacy plain text
  const isHtml = html?.includes('<');
  const rendered = isHtml ? html : (html || '').replace(/\n/g, '<br/>');

  const fit = () => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner || !html) return;

    let size = maxFontSize;
    inner.style.fontSize = `${size}px`;

    while (inner.scrollHeight > container.clientHeight && size > minFontSize) {
      size -= 1;
      inner.style.fontSize = `${size}px`;
    }

    setFontSize(size);
  };

  useEffect(() => { fit(); }, [html, maxFontSize, minFontSize, lineHeight]);

  useEffect(() => {
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [html, maxFontSize, minFontSize, lineHeight]);

  return (
    <div ref={containerRef} className={`w-full h-full overflow-hidden ${className}`}>
      <div
        ref={innerRef}
        className="w-full font-light rich-text-content"
        style={{
          color,
          fontSize: `${fontSize}px`,
          lineHeight: `${lineHeight}`,
        }}
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    </div>
  );
}
