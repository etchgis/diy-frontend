import { useEffect, useState } from 'react';
import { proxyImageUrl } from '@/utils/proxyImageUrl';

// Images people upload in the editor live here. They are never deleted when a slide changes,
// because other screen sets, published versions, and history can point at the same file.
const UPLOAD_PREFIX = 'https://diy-public-transit-screens.s3.amazonaws.com/images/';

export function isUploadedImage(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith(UPLOAD_PREFIX);
}

const checks = new Map<string, Promise<boolean>>();
const RECHECK_FAILED_MS = 5 * 60 * 1000;

// Resolves false when an uploaded image cannot be loaded. A URL that loads is checked once per
// page; a failure is forgotten after a few minutes, in case it was a brief network problem.
export function checkImage(url: string): Promise<boolean> {
  if (!isUploadedImage(url) || typeof window === 'undefined') return Promise.resolve(true);
  let check = checks.get(url);
  if (!check) {
    check = new Promise<boolean>(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => {
        setTimeout(() => checks.delete(url), RECHECK_FAILED_MS);
        resolve(false);
      };
      img.src = proxyImageUrl(url);
    });
    checks.set(url, check);
  }
  return check;
}

// Every uploaded image URL anywhere in a value, as one sorted string, so callers can tell
// cheaply whether the set of images changed.
export function uploadedImageSignature(value: unknown): string {
  const urls = new Set<string>();
  const walk = (v: unknown) => {
    if (isUploadedImage(v)) urls.add(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(value);
  return Array.from(urls).sort().join('\n');
}

// Returns the URL, or '' once it is known not to load, so a slide can fall back to its
// background color instead of an empty image.
export function useAvailableImage(url: string | undefined): string {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return;
    let active = true;
    checkImage(url).then(ok => {
      if (active && !ok) setFailedUrl(url);
    });
    return () => {
      active = false;
    };
  }, [url]);
  return url && url !== failedUrl ? url : '';
}

export type ImageRef = { url: string; where: string };

// Names as shown in the editor's slide picker.
const SLIDE_NAMES: Record<string, string> = {
  'transit-routes': 'Transit Route Destination Map Page',
  'transit-destinations': 'Transit Destination Table Page',
  'fixed-routes': 'Stop Arrivals Page',
  'stop-arrivals': 'Stop Arrivals Page',
  'route-times': 'Route Times Page',
  qr: 'QR Code Page',
  'image-only': 'Image Only Page',
  'template-3': 'Image and Title Page',
  'template-1': 'Left Content/Right Image Page',
  'template-2': 'Right Content/Left Image Page',
  weather: 'Weather Page',
  citibike: 'Micromobility Page',
  'traffic-corridor': 'Traffic Corridor Page',
  'traffic-congestion': 'Traffic Congestion Map',
  'web-embed': 'Web Embed Page',
};

const FIELD_NAMES: Record<string, string> = {
  bgImage: 'background image',
  logoImage: 'logo',
  image: 'image',
  leftImage: 'left image',
  middleImage: 'middle image',
  rightImage: 'right image',
};

function fieldName(key: string): string {
  return FIELD_NAMES[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

// Lists every uploaded image in a published config (or the editor's publish payload), with a
// plain description of where it is used.
export function findUploadedImages(config: any, { includeHidden = true } = {}): ImageRef[] {
  const refs: ImageRef[] = [];
  const seen = new Set<string>();

  const walk = (value: any, where: string, key: string) => {
    if (isUploadedImage(value)) {
      const label = `${where}, ${fieldName(key)}`;
      if (!seen.has(value + label)) {
        seen.add(value + label);
        refs.push({ url: value, where: label });
      }
    } else if (Array.isArray(value)) {
      value.forEach(item => walk(item, where, key));
    } else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([k, v]) => walk(v, where, k));
    }
  };

  if (config?.footer) walk(config.footer, 'Footer', 'image');
  (config?.screens ?? []).forEach((screen: any, i: number) => {
    if (!includeHidden && screen?.hidden) return;
    const name = screen?.label || SLIDE_NAMES[screen?.type] || screen?.type || 'slide';
    walk(screen?.data, `Slide ${i + 1} (${name}${screen?.hidden ? ', hidden' : ''})`, 'image');
  });
  return refs;
}

// Lists the uploaded images in a config that cannot be loaded.
export async function findMissingImages(config: any, options?: { includeHidden?: boolean }): Promise<ImageRef[]> {
  const refs = findUploadedImages(config, options);
  const results = await Promise.all(refs.map(ref => checkImage(ref.url)));
  return refs.filter((_, i) => !results[i]);
}

// Published screens: logs each missing uploaded image to the backend once per page load, so
// broken screens can be found without waiting for someone to notice.
export function reportMissingImages(shortcode: string, config: any) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl || !shortcode || !config) return;
  findMissingImages(config, { includeHidden: false }).then(missing => {
    if (missing.length === 0) return;
    console.warn('[IMAGES] Missing uploaded images:', missing);
    new Set(missing.map(ref => ref.url)).forEach(url => {
      fetch(`${backendUrl}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortcode, event: 'image_failed', url }),
      }).catch(() => {});
    });
  });
}

// Published screens: hides an uploaded image that fails to load instead of showing the
// browser's broken-image icon, and shows it again if it loads later. Returns a cleanup function.
export function hideBrokenImages(): () => void {
  const isUpload = (img: HTMLImageElement) => img.src.indexOf(UPLOAD_PREFIX) === 0 || img.src.indexOf('/api/image?') !== -1;
  const onError = (e: Event) => {
    const img = e.target;
    if (img instanceof HTMLImageElement && isUpload(img)) img.style.visibility = 'hidden';
  };
  const onLoad = (e: Event) => {
    const img = e.target;
    if (img instanceof HTMLImageElement && img.style.visibility === 'hidden' && isUpload(img)) img.style.visibility = '';
  };
  // Image load and error events do not bubble, so listen during the capture phase.
  window.addEventListener('error', onError, true);
  window.addEventListener('load', onLoad, true);
  return () => {
    window.removeEventListener('error', onError, true);
    window.removeEventListener('load', onLoad, true);
  };
}
