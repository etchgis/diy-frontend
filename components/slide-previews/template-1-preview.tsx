import { deleteImage } from "@/services/deleteImage";
import { uploadImage } from "@/services/uploadImage";
import { useGeneralStore } from "@/stores/general";
import { useTemplate1Store } from "@/stores/template1";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Footer from "../shared-components/footer";
import ResizableImage from "../shared-components/resizable-image";

export default function Template1Preview({
  slideId,
  previewMode,
}: {
  slideId: string;
  previewMode?: boolean;
}) {
  const pathname = usePathname();
  const [isEditor, setIsEditor] = useState(pathname.includes("/editor"));
  const [isUploading, setIsUploading] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewMode) {
      setIsEditor(false);
    } else {
      setIsEditor(pathname.includes("/editor"));
    }
  }, [previewMode]);

  const content = useTemplate1Store(
    (state) => state.slides[slideId]?.text || ""
  );
  const setContent = useTemplate1Store((state) => state.setText);

  const title = useTemplate1Store(
    (state) => state.slides[slideId]?.title || ""
  );
  const setTitle = useTemplate1Store((state) => state.setTitle);

  const image = useTemplate1Store(
    (state) => state.slides[slideId]?.image || null
  );
  const setImage = useTemplate1Store((state) => state.setImage);

  const bgImage = useTemplate1Store(
    (state) => state.slides[slideId]?.bgImage || ""
  );
  const backgroundColor = useTemplate1Store(
    (state) => state.slides[slideId]?.backgroundColor || "#305fff"
  );
  const textColor = useTemplate1Store(
    (state) => state.slides[slideId]?.textColor || "#ffffff"
  );
  const titleColor = useTemplate1Store(
    (state) => state.slides[slideId]?.titleColor || "#ffffff"
  );
  const logoImage = useTemplate1Store(
    (state) => state.slides[slideId]?.logoImage || ""
  );

  const leftContentSize = useTemplate1Store(
    (state) => state.slides[slideId]?.leftContentSize || "60%"
  );
  const rightContentSize = useTemplate1Store(
    (state) => state.slides[slideId]?.rightContentSize || "40%"
  );

  const imageWidth = useTemplate1Store(
    (state) => state.slides[slideId]?.imageWidth || 400
  );
  const imageHeight = useTemplate1Store(
    (state) => state.slides[slideId]?.imageHeight || 280
  );
  const imageObjectFit = useTemplate1Store(
    (state) => state.slides[slideId]?.imageObjectFit || "contain"
  );
  const setImageWidth = useTemplate1Store((state) => state.setImageWidth);
  const setImageHeight = useTemplate1Store((state) => state.setImageHeight);

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
      className="w-full h-full flex flex-col overflow-hidden mb-6 relative"
      style={{
        backgroundColor: !bgImage ? backgroundColor : undefined,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor,
      }}
    >
      {/* Logo (only if present) */}
      {logoImage && (
        <img
          src={logoImage}
          alt="Logo"
          className="absolute top-6 right-6 max-h-16 object-contain z-20"
        />
      )}

      {/* Title */}
      <div className="p-3 border-b border-white/20">
        <div
          className={`w-full rounded px-4 ${
            isEditor ? "border-2 border-[#11d1f7] py-2" : ""
          }`}
        >
          {isEditor ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(slideId, e.target.value)}
              placeholder="Type title here"
              className="w-full bg-transparent outline-none text-4xl font-light placeholder-white/50"
              style={{ color: titleColor }}
            />
          ) : (
            <div
              className="w-full bg-transparent font-light"
              style={{
                color: titleColor,
                fontSize: "clamp(3.2rem, 11vh, 11rem)",
              }}
            >
              {title || ""}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 p-6 flex gap-4">
        {/* Left Box - Text Content */}
        <div className="h-full" style={{ width: leftContentSize }}>
          <div
            className={`h-full w-full rounded-lg p-6 flex items-start ${
              isEditor ? "border-2 border-[#11d1f7] bg-[#11d1f7]/10" : ""
            }`}
          >
            {isEditor ? (
              <textarea
                value={content}
                onChange={(e) => setContent(slideId, e.target.value)}
                placeholder="Type text here"
                className="w-full h-full bg-transparent outline-none resize-none text-2xl font-light placeholder-white/50"
                style={{ color: textColor }}
              />
            ) : (
              <div
                className="w-full h-full bg-transparent font-light whitespace-pre-wrap"
                style={{ color: textColor, fontSize: "clamp(2rem, 6vh, 6rem)" }}
              >
                {content || ""}
              </div>
            )}
          </div>
        </div>

        {/* Right Box - Image Content */}
        <div className="h-full" style={{ width: rightContentSize }}>
          <div
            ref={imageContainerRef}
            className={`h-full w-full rounded-lg flex items-center justify-center p-6 ${
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
              <div className="text-center w-full" style={{ color: textColor }}>
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

                    <img
                      src="/images/placeholder-image.png"
                      alt="Placeholder"
                      className="max-w-32 max-h-24 object-contain mx-auto"
                    />
                  </>
                )}
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
