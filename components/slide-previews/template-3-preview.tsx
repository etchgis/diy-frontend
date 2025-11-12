import { deleteImage } from "@/services/deleteImage";
import { uploadImage } from "@/services/uploadImage";
import { useGeneralStore } from "@/stores/general";
import { useTemplate3Store } from "@/stores/template3";
import { usePathname } from 'next/navigation';

export default function Template3Preview({ slideId, previewMode }: { slideId: string, previewMode?: boolean }) {
  const pathname = usePathname();
  const isEditor = pathname.includes('/editor') && !previewMode;

  const title = useTemplate3Store((state) => state.slides[slideId]?.title || '');
  const setTitle = useTemplate3Store((state) => state.setTitle);

  const image = useTemplate3Store((state) => state.slides[slideId]?.image || null);
  const setImage = useTemplate3Store((state) => state.setImage);

  const bgImage = useTemplate3Store((state) => state.slides[slideId]?.bgImage || '');
  const backgroundColor = useTemplate3Store((state) => state.slides[slideId]?.backgroundColor || '#305fff');
  const textColor = useTemplate3Store((state) => state.slides[slideId]?.textColor || '#ffffff');

  const shortcode = useGeneralStore((state) => state.shortcode || '');

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditor) return;

    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file) return;
    uploadImage(shortcode, file).then((data) => {
      if (image) {
        deleteImage(image).then(() => {

        }).catch((err) => {
          console.error('Failed to delete previous image:', err);
        });
      }
      setImage(slideId, data.url);
    }
    ).catch((err) => {
      console.error('Image upload failed:', err);
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
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: textColor,
      }}
    >
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Title Area */}
        <div className="p-6 border-b border-white/20 flex-shrink-0">
          <div
            className={`w-full rounded px-4 py-2 ${isEditor ? 'border-2 border-[#11d1f7]' : ''
              }`}
          >
            {isEditor ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(slideId, e.target.value)}
                placeholder="Type title here"
                className="w-full bg-transparent outline-none text-4xl font-light placeholder-white/50"
                style={{ color: textColor }}
              />
            ) : (
              <div className="w-full bg-transparent text-[60px] font-light" style={{ color: textColor }}>
                {title || ''}
              </div>
            )}
          </div>
        </div>

        {/* Image Drop Area */}
        <div className="flex-1 p-8 min-h-0">
          <div
            className={`w-full h-full rounded-lg flex items-center justify-center p-6 overflow-hidden ${isEditor ? 'border-2 border-[#11d1f7] bg-[#11d1f7]/10' : ''
              }`}
            onDrop={isEditor ? handleDrop : undefined}
            onDragOver={isEditor ? handleDragOver : undefined}
          >
            {image ? (
              <img
                src={image}
                alt="Uploaded"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center" style={{ color: textColor }}>
                {isEditor && (
                  <>
                    <div className="text-lg mb-4" style={{ color: textColor }}>Drag and Drop Image Here</div>
                    <div className="text-sm mb-6" style={{ color: textColor, opacity: 0.8 }}>
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
      <div className="bg-[#F4F4F4] p-3 flex items-center justify-between rounded-b-lg flex-shrink-0">
        <img
          src="/images/statewide-mobility-services.png"
          alt="Statewide Mobility Services"
          className="h-[25px] w-[246px]"
        />
        <img src="/images/nysdot-footer-logo.png" alt="NYSDOT" className="h-8" />
      </div>
    </div>
  );
}