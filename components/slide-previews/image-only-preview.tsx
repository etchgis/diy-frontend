import { useImageOnlyStore } from "@/stores/imageOnly";
import { useGeneralStore } from "@/stores/general";
import { uploadImage } from "@/services/uploadImage";
import { deleteImage } from "@/services/deleteImage";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import ResizableImage from "../shared-components/resizable-image";

export default function ImageOnlyPreview({
  slideId,
  previewMode = false,
}: {
  slideId: string;
  previewMode?: boolean;
}) {
  const pathname = usePathname();
  const isEditor = pathname.includes("/editor") && !previewMode;
  const [isUploading, setIsUploading] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const image = useImageOnlyStore(
    (state) => state.slides[slideId]?.image || null
  );
  const setImage = useImageOnlyStore((state) => state.setImage);

  const imageObjectFit = useImageOnlyStore(
    (state) => state.slides[slideId]?.imageObjectFit || "cover"
  );

  const backgroundColor = useImageOnlyStore(
    (state) => state.slides[slideId]?.backgroundColor || "#000000"
  );

  const fullScreen = useImageOnlyStore(
    (state) => state.slides[slideId]?.fullScreen ?? true
  );

  const imageWidth = useImageOnlyStore(
    (state) => state.slides[slideId]?.imageWidth || 600
  );
  const imageHeight = useImageOnlyStore(
    (state) => state.slides[slideId]?.imageHeight || 400
  );
  const setImageWidth = useImageOnlyStore((state) => state.setImageWidth);
  const setImageHeight = useImageOnlyStore((state) => state.setImageHeight);

  const shortcode = useGeneralStore((state) => state.shortcode || "");
  const defaultFontFamily = useGeneralStore((state) => state.defaultFontFamily);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditor) return;
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    setIsUploading(true);
    uploadImage(shortcode, file)
      .then((data) => {
        if (image) {
          deleteImage(image).catch((err) => {
            console.error("Failed to delete previous image:", err);
          });
        }
        setImage(slideId, data.url);
      })
      .catch((err) => {
        console.error("Image upload failed:", err);
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditor) return;
    e.preventDefault();
  };

  return (
    <div
      ref={imageContainerRef}
      className="w-full h-full overflow-hidden"
      onDrop={isEditor ? handleDrop : undefined}
      onDragOver={isEditor ? handleDragOver : undefined}
      style={{ backgroundColor, fontFamily: defaultFontFamily && defaultFontFamily !== 'System Default' ? defaultFontFamily : undefined }}
    >
      {isUploading ? (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-sm text-white">Uploading...</p>
        </div>
      ) : image ? (
        fullScreen ? (
          <img
            src={image}
            alt="Full screen image"
            className="w-full h-full"
            style={{ objectFit: imageObjectFit }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6">
            <ResizableImage
              src={image}
              alt="Uploaded"
              width={imageWidth}
              height={imageHeight}
              objectFit={imageObjectFit}
              onResize={(w, h) => {
                setImageWidth(slideId, w);
                setImageHeight(slideId, h);
              }}
              isEditor={isEditor}
              containerRef={imageContainerRef}
            />
          </div>
        )
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-white">
          {isEditor && (
            <>
              <div className="text-lg mb-4">Drag and Drop Image Here</div>
              <div className="text-sm mb-6" style={{ opacity: 0.8 }}>
                accepted files: .png, .jpg, .gif
              </div>
            </>
          )}
          <img
            src="/images/placeholder-image.png"
            alt="Placeholder"
            className="w-full max-w-xs max-h-40 object-contain mx-auto"
          />
        </div>
      )}
    </div>
  );
}
