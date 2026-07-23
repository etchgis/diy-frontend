const S3_HOSTNAME = 'diy-public-transit-screens.s3.amazonaws.com';

export function proxyImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname === S3_HOSTNAME) {
      return `/api/image?url=${encodeURIComponent(url)}`;
    }
  } catch {

  }
  return url;
}
