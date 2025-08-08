import { deleteImage } from '@/services/deleteImage';
import { uploadImage } from '@/services/uploadImage';
import { useGeneralStore } from '@/stores/general';
import { useTemplate1Store } from '@/stores/template1';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Template1Preview({ slideId, previewMode }: { slideId: string, previewMode?: boolean }) {
  const pathname = usePathname();
  const [isEditor, setIsEditor] = useState(pathname.includes('/editor'));

  useEffect(() => {
    if(previewMode){
      setIsEditor(false);
    } else {
      setIsEditor(pathname.includes('/editor'));
    }
  }, [previewMode])

  const content = useTemplate1Store((state) => state.slides[slideId]?.text || '');
  const setContent = useTemplate1Store((state) => state.setText);

  const title = useTemplate1Store((state) => state.slides[slideId]?.title || '');
  const setTitle = useTemplate1Store((state) => state.setTitle);

  const image = useTemplate1Store((state) => state.slides[slideId]?.image || null);
  const setImage = useTemplate1Store((state) => state.setImage);

  const bgImage = useTemplate1Store((state) => state.slides[slideId]?.bgImage || '');
  const backgroundColor = useTemplate1Store((state) => state.slides[slideId]?.backgroundColor || '#305fff');

  const leftContentSize = useTemplate1Store((state) => state.slides[slideId]?.leftContentSize || '60%');
  const rightContentSize = useTemplate1Store((state) => state.slides[slideId]?.rightContentSize || '40%');

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
      className="w-full h-full flex flex-col text-white overflow-hidden mb-6 relative"
      style={{
        backgroundColor: !bgImage ? backgroundColor : undefined,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Title */}
      <div className="p-6 border-b border-white/20">
        <div className={`w-full rounded px-4 py-2 ${isEditor ? 'border-2 border-[#11d1f7]' : ''}`}>
          {isEditor ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(slideId, e.target.value)}
              placeholder="Type title here"
              className="w-full bg-transparent outline-none text-4xl font-light placeholder-white/50"
            />
          ) : (
            <div className="w-full bg-transparent text-4xl font-light">
              {title || ''}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 p-6 flex gap-4">
        {/* Left Box */}
        <div className="flex-1 h-full">
          <div
            className={`h-full w-full rounded-lg p-6 flex items-start ${isEditor ? 'border-2 border-[#11d1f7] bg-[#11d1f7]/10' : ''
              }`}
          >
            {isEditor ? (
              <textarea
                value={content}
                onChange={(e) => setContent(slideId, e.target.value)}
                placeholder="Type text here"
                className="w-full h-full bg-transparent outline-none resize-none text-2xl font-light placeholder-white/50"
              />
            ) : (
              <div className="w-full h-full bg-transparent text-2xl font-light whitespace-pre-wrap">
                {content || ''}
              </div>
            )}
          </div>
        </div>

        {/* Right Box */}
        <div className="flex-1 h-full">
          <div
            className={`h-full w-full rounded-lg flex items-center justify-center p-6 ${isEditor ? 'border-2 border-[#11d1f7] bg-[#11d1f7]/10' : ''
              }`}
            onDrop={isEditor ? handleDrop : undefined}
            onDragOver={isEditor ? handleDragOver : undefined}
          >
            {image ? (
              <img
                src={image}
                alt="Uploaded"
                className="w-full h-auto max-h-full object-contain mx-auto"
              />
            ) : (
              <div className="text-center w-full">
                {isEditor && (
                  <>
                    <div className="text-lg mb-4">Drag and Drop Image Here</div>
                    <div className="text-sm text-white/80 mb-6">
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
      <div className="bg-[#F4F4F4] p-3 flex items-center justify-between rounded-b-lg">
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