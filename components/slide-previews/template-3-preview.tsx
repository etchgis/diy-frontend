import { deleteImage } from "@/services/deleteImage";
import { uploadImage } from "@/services/uploadImage";
import { useGeneralStore } from "@/stores/general";
import { useTemplate3Store } from "@/stores/template3";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import Footer from "../shared-components/footer";
import ResizableImage from "../shared-components/resizable-image";

export default function Template3Preview({
  slideId,
  previewMode,
}: {
  slideId: string;
  previewMode?: boolean;
}) {
  const pathname = usePathname();
  const isEditor = pathname.includes("/editor") && !previewMode;
  const [isUploading, setIsUploading] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const title = useTemplate3Store(
    (state) => state.slides[slideId]?.title || ""
  );
  const setTitle = useTemplate3Store((state) => state.setTitle);

  const image = useTemplate3Store(
    (state) => state.slides[slideId]?.image || null
  );
  const setImage = useTemplate3Store((state) => state.setImage);

  const bgImage = useTemplate3Store(
    (state) => state.slides[slideId]?.bgImage || ""
  );
  const backgroundColor = useTemplate3Store(
    (state) => state.slides[slideId]?.backgroundColor || "#305fff"
  );
  const textColor = useTemplate3Store(
    (state) => state.slides[slideId]?.textColor || "#ffffff"
  );
  const titleColor = useTemplate3Store(
    (state) => state.slides[slideId]?.titleColor || "#ffffff"
  );
  const logoImage = useTemplate3Store(
    (state) => state.slides[slideId]?.logoImage || ""
  );

  const imageWidth = useTemplate3Store(
    (state) => state.slides[slideId]?.imageWidth || 600
  );
  const imageHeight = useTemplate3Store(
    (state) => state.slides[slideId]?.imageHeight || 400
  );
  const imageObjectFit = useTemplate3Store(
    (state) => state.slides[slideId]?.imageObjectFit || "contain"
  );
  const titleTextSize = useTemplate3Store(
    (state) => state.slides[slideId]?.titleTextSize || 5
  );
  const setImageWidth = useTemplate3Store((state) => state.setImageWidth);
  const setImageHeight = useTemplate3Store((state) => state.setImageHeight);

  // Convert 1-10 scale to multiplier (5 = 1.0x, 1 = 0.6x, 10 = 1.5x)
  const titleSizeMultiplier = 0.5 + titleTextSize * 0.1;

  const shortcode = useGeneralStore((state) => state.shortcode || "");

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditor) return;

    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    setIsUploading(true);
    uploadImage(shortcode, file)
      .then((data) => {
        if (image) {
          deleteImage(image)
            .then(() => {})
            .catch((err) => {
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
      className="w-full h-full flex flex-col justify-between overflow-hidden mb-6 relative"
      style={{
        backgroundColor: !bgImage ? backgroundColor : undefined,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor,
      }}
    >
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Title + Logo */}
        <div className="p-3 border-b border-white/20 flex-shrink-0 flex items-center">
          <div
            className={`flex-1 rounded px-4 ${
              isEditor ? "border-2 border-[#11d1f7] py-2" : ""
            }`}
          >
            {isEditor ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(slideId, e.target.value)}
                placeholder="Type title here"
                className="w-full bg-transparent outline-none font-light placeholder-white/50"
                style={{ color: titleColor, fontSize: `${36 * titleSizeMultiplier}px` }}
              />
            ) : (
              <div
                className="w-full bg-transparent font-light"
                style={{
                  color: titleColor,
                  fontSize: `clamp(1.5rem, ${8 * titleSizeMultiplier}vh, 11rem)`,
                  lineHeight: "1.2"
                }}
              >
                {title || ""}
              </div>
            )}
          </div>
          {logoImage && (
            <img
              src={logoImage}
              alt="Logo"
              className="max-h-16 object-contain ml-4 flex-shrink-0"
            />
          )}
        </div>

        {/* Image Drop Area */}
        <div className="flex-1 p-8 min-h-0">
          <div
            ref={imageContainerRef}
            className={`w-full h-full rounded-lg flex items-center justify-center p-6 overflow-hidden ${
              isEditor ? "border-2 border-[#11d1f7] bg-[#11d1f7]/10" : ""
            }`}
            onDrop={isEditor ? handleDrop : undefined}
            onDragOver={isEditor ? handleDragOver : undefined}
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-sm" style={{ color: textColor }}>Uploading...</p>
              </div>
            ) : image ? (
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
            ) : (
              <div className="text-center" style={{ color: textColor }}>
                {isEditor && (
                  <>
                    <div className="text-lg mb-4" style={{ color: textColor }}>
                      Drag and Drop Image Here
                    </div>
                    <div
                      className="text-sm mb-6"
                      style={{ color: textColor, opacity: 0.8 }}
                    >
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
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
