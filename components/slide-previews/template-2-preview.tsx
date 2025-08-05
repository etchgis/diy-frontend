import { deleteImage } from "@/services/deleteImage";
import { uploadImage } from "@/services/uploadImage";
import { useGeneralStore } from "@/stores/general";
import { useTemplate2Store } from "@/stores/template2";

export default function Template2Preview({ slideId }: { slideId: string }) {
  const content = useTemplate2Store((state) => state.slides[slideId]?.text || '');
  const setContent = useTemplate2Store((state) => state.setText);

  const title = useTemplate2Store((state) => state.slides[slideId]?.title || '');
  const setTitle = useTemplate2Store((state) => state.setTitle);

  const image = useTemplate2Store((state) => state.slides[slideId]?.image || null);
  const setImage = useTemplate2Store((state) => state.setImage);

  const bgImage = useTemplate2Store((state) => state.slides[slideId]?.bgImage || '');
  const backgroundColor = useTemplate2Store((state) => state.slides[slideId]?.backgroundColor || '#305fff');

  const leftContentSize = useTemplate2Store((state) => state.slides[slideId]?.leftContentSize || '60%');
  const rightContentSize = useTemplate2Store((state) => state.slides[slideId]?.rightContentSize || '40%');

  const shortcode = useGeneralStore((state) => state.shortcode || '');

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file) return;
    uploadImage(shortcode, file).then((data) => {
      if (image) {
        deleteImage(image).then(() => {
          console.log('Previous image deleted');
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
    e.preventDefault();
  };



  return (
    <div
      className="w-full h-full flex flex-col justify-between text-white rounded-lg overflow-hidden mb-6 relative"
      style={{
        backgroundColor: !bgImage ? backgroundColor : undefined,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="bg-gradient-to-br text-white rounded-lg overflow-hidden relative"
        style={{ height: "500px" }}
      >
        {/* Title Area */}
        <div className="p-6 border-b border-white/20">
          <div className="w-full border-2 border-[#11d1f7] rounded px-4 py-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(slideId, e.target.value)}
              placeholder="Type title here"
              className="w-full bg-transparent outline-none text-4xl font-light placeholder-white/50"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 flex gap-4">
          {/* Left Image Box (60%) */}
          <div style={{ width: leftContentSize }}>
            <div
              className="h-[300px] border-2 border-[#11d1f7] rounded-lg bg-[#11d1f7]/10 flex items-center justify-center p-6 overflow-hidden"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {image ? (
                <img
                  src={image}
                  alt="Uploaded"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <div className="text-lg mb-4">Drag and Drop Image Here</div>
                  <div className="text-sm text-white/80 mb-6">
                    accepted files: .png, .jpg, .gif
                  </div>
                  <img
                    src="/images/placeholder-image.png"
                    alt="Placeholder"
                    className="max-w-32 max-h-24 object-contain mx-auto"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Content Box (40%) */}
          <div style={{ width: rightContentSize }}>
            <div className="h-full border-2 border-[#11d1f7] rounded-lg bg-[#11d1f7]/10 p-6 flex items-start">
              <textarea
                value={content}
                onChange={(e) => setContent(slideId, e.target.value)}
                placeholder="Type text here"
                className="w-full h-full bg-transparent outline-none resize-none text-2xl font-light placeholder-white/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#F4F4F4] p-3 flex items-center justify-between rounded-b-lg">
        <img
          src="/images/statewide-mobility-services.png"
          alt="Statewide Mobility Services"
          className="h-[25px] w-[246px]"
        />
        <img src="/images/nysdot-footer-logo.png" alt="NYSDOT" className="h-8" />
      </div>
    </div>
  )
}