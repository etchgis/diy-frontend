import { useRef, useState } from 'react';
import { uploadImage, UploadRejectedError } from '@/services/uploadImage';

/**
 * Upload logic for a single image field with inline error feedback. Replacing or removing an
 * image only changes the draft; the old file stays, because other screen sets and published
 * versions may still use it.
 */
export function useImageUploadField(
  shortcode: string,
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
      setUrl(data.url);
    } catch (err) {
      showError(err instanceof UploadRejectedError ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setUrl('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return { isUploading, uploadError, inputRef, handleUpload, handleRemove };
}
