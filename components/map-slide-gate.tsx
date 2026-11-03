'use client';
import { ComponentType, useEffect, useState } from 'react';

let mapsSupported: boolean | undefined;

// mapbox-gl needs modern JavaScript (optional chaining, BigInt) and WebGL2. Older signage
// players (e.g. Chrome 63 BrightSign) have neither, so map slides cannot load there.
function canShowMaps(): boolean {
  if (mapsSupported !== undefined) return mapsSupported;
  try {
    new Function('var a = {}; return a?.b ?? 1n;')();
    const canvas = document.createElement('canvas');
    mapsSupported = !!canvas.getContext('webgl2');
  } catch {
    mapsSupported = false;
  }
  return mapsSupported;
}

// Shown in place of a map slide on displays that cannot draw maps, so whoever manages the
// screen knows why the slide is empty and how to fix it.
export function UnsupportedMapNotice({ pageName }: { pageName: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'calc(6*var(--cqw))',
        boxSizing: 'border-box',
        background: '#192F51',
        color: '#ffffff',
      }}
    >
      <div style={{ fontSize: 'calc(5*var(--cqmin))', fontWeight: 700, marginBottom: 'calc(3*var(--cqmin))' }}>
        This map can&apos;t be shown on this display
      </div>
      <div style={{ fontSize: 'calc(3*var(--cqmin))', lineHeight: 1.4, maxWidth: 'calc(80*var(--cqw))', marginBottom: 'calc(2*var(--cqmin))' }}>
        The web browser on this display is too old to draw maps.
      </div>
      <div style={{ fontSize: 'calc(3*var(--cqmin))', lineHeight: 1.4, maxWidth: 'calc(80*var(--cqw))', opacity: 0.85 }}>
        To fix this, remove the {pageName} from this screen set in the editor, or upgrade the display&apos;s
        browser or media player.
      </div>
    </div>
  );
}

// Wraps a map slide so it only loads where maps are supported and shows the notice elsewhere.
// Renders nothing until mounted so the server and first client render match.
export function withMapSupport<P extends object>(MapSlide: ComponentType<P>, pageName: string) {
  function MapSlideGate(props: P) {
    const [supported, setSupported] = useState<boolean | null>(null);
    useEffect(() => setSupported(canShowMaps()), []);
    if (supported === null) return null;
    return supported ? <MapSlide {...props} /> : <UnsupportedMapNotice pageName={pageName} />;
  }
  return MapSlideGate;
}
