import { useState, useRef, useEffect } from 'react';

interface ResizableImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onResize: (width: number, height: number) => void;
  isEditor: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ResizableImage({
  src,
  alt,
  width,
  height,
  objectFit,
  onResize,
  isEditor,
  containerRef: parentContainerRef,
}: ResizableImageProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeHandle) return;

      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      let newWidth = startPos.current.width;
      let newHeight = startPos.current.height;

      if (resizeHandle.includes('e')) {
        newWidth = Math.max(10, startPos.current.width + deltaX);
      }
      if (resizeHandle.includes('w')) {
        newWidth = Math.max(10, startPos.current.width - deltaX);
      }
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(10, startPos.current.height + deltaY);
      }
      if (resizeHandle.includes('n')) {
        newHeight = Math.max(10, startPos.current.height - deltaY);
      }

      // Clamp to parent container size if available
      if (parentContainerRef?.current) {
        const containerRect = parentContainerRef.current.getBoundingClientRect();
        // Account for padding (p-6 = 24px on each side)
        const maxWidth = containerRect.width - 48;
        const maxHeight = containerRect.height - 48;
        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, maxHeight);
      }

      // Round to whole numbers
      newWidth = Math.round(newWidth);
      newHeight = Math.round(newHeight);

      onResize(newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizeHandle, onResize]);

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    if (!isEditor) return;
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setResizeHandle(handle);
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      width,
      height,
    };
  };

  // Scale up dimensions for published page (3x multiplier)
  const displayWidth = isEditor ? width : width * 3;
  const displayHeight = isEditor ? height : height * 3;

  return (
    <div
      ref={imageContainerRef}
      className="relative inline-block"
      style={
        isEditor
          ? {
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
            }
          : {
              maxWidth: '100%',
              maxHeight: '100%',
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
            }
      }
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: objectFit,
          userSelect: 'none',
        }}
        draggable={false}
      />

      {isEditor && (
        <>
          {/* Corner handles */}
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white cursor-nw-resize"
            style={{ top: -6, left: -6 }}
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white cursor-ne-resize"
            style={{ top: -6, right: -6 }}
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white cursor-sw-resize"
            style={{ bottom: -6, left: -6 }}
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
            style={{ bottom: -6, right: -6 }}
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />

          {/* Edge handles */}
          <div
            className="absolute w-full h-2 cursor-n-resize"
            style={{ top: -4, left: 0 }}
            onMouseDown={(e) => handleMouseDown(e, 'n')}
          />
          <div
            className="absolute w-full h-2 cursor-s-resize"
            style={{ bottom: -4, left: 0 }}
            onMouseDown={(e) => handleMouseDown(e, 's')}
          />
          <div
            className="absolute w-2 h-full cursor-w-resize"
            style={{ top: 0, left: -4 }}
            onMouseDown={(e) => handleMouseDown(e, 'w')}
          />
          <div
            className="absolute w-2 h-full cursor-e-resize"
            style={{ top: 0, right: -4 }}
            onMouseDown={(e) => handleMouseDown(e, 'e')}
          />
        </>
      )}
    </div>
  );
}
