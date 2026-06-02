import { useRef, useState } from 'react';
import { uploadImage } from '@/services/uploadImage';
import { deleteImage } from '@/services/deleteImage';

/**
 *  upload/delete logic for a single image field with inline error feedback.
 */
export function useImageUploadField(
  shortcode: string,
  currentUrl: string,
  setUrl: (url: string) => void
) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showError = (msg: string) => {
    setUploadError(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setUploadError(null), 4000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = '';
    setIsUploading(true);
    try {
      const data = await uploadImage(shortcode, file);
      if (currentUrl) deleteImage(currentUrl).catch(() => {});
      setUrl(data.url);
    } catch {
      showError('Upload failed — please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentUrl) return;
    try {
      await deleteImage(currentUrl);
      setUrl('');
      if (inputRef.current) inputRef.current.value = '';
    } catch {
      showError('Failed to remove image — please try again.');
    }
  };

  return { isUploading, uploadError, inputRef, handleUpload, handleRemove };
}
