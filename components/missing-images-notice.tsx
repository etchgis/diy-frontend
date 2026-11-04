'use client';
import { useEffect, useState } from 'react';
import { buildPublishPayload, publishStores } from '@/services/publish';
import { findMissingImages, uploadedImageSignature, type ImageRef } from '@/lib/uploadedImages';

// Warns in the editor when an uploaded image in this screen set can no longer be loaded, and
// says where it is, so the person can upload it again before publishing.
export function MissingImagesNotice() {
  const [missing, setMissing] = useState<ImageRef[]>([]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastSignature: string | null = null;

    const check = () => {
      // Stores also change when live data refreshes; only look again when the images change.
      const signature = uploadedImageSignature(publishStores.map(store => store.getState()));
      if (signature === lastSignature) return;

      let payload;
      try {
        payload = buildPublishPayload();
      } catch {
        return;
      }
      lastSignature = signature;
      findMissingImages(payload).then(found => {
        if (active) setMissing(found);
      });
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(check, 1000);
    };

    check();
    const unsubscribes = publishStores.map(store => store.subscribe(schedule));
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  if (missing.length === 0) return null;

  return (
    <div role="alert" className="bg-[#fff4e5] border-b border-[#f0b35b] px-6 py-3 text-sm text-[#5c3b00]">
      <p className="font-semibold">
        {missing.length === 1 ? 'An image in this screen set is missing' : `${missing.length} images in this screen set are missing`}
      </p>
      <p className="mt-1">
        The file can no longer be found, so screens show nothing in its place. Upload the image again, then publish.
      </p>
      <ul className="mt-1 list-disc pl-5">
        {missing.map(ref => (
          <li key={ref.url + ref.where}>{ref.where}</li>
        ))}
      </ul>
    </div>
  );
}
