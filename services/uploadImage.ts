// The server refused the file (wrong type, too large, too many uploads). The message is
// written for the person uploading.
export class UploadRejectedError extends Error {}

export async function uploadImage(shortcode: string, file: File): Promise<any> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    throw new Error("Backend URL is not defined in environment variables.");
  }

  const url = `${backendUrl}/upload-image/${shortcode}`;

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (response.status === 413) {
      throw new UploadRejectedError("Images must be 10 MB or smaller.");
    }
    if (response.status === 400 || response.status === 429) {
      const body = await response.json().catch(() => null);
      throw new UploadRejectedError(body?.error || "This image could not be uploaded.");
    }
    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}