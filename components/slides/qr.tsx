import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, ChevronRight, Upload } from "lucide-react"
import QRSlidePreview from "../slide-previews/qr-slide-preview"
import { useQRStore } from "@/stores/qr"
import { useEffect, useRef, useState } from "react"
import QRCode from 'react-qr-code';
import { useGeneralStore } from "@/stores/general"
import { uploadImage } from "@/services/uploadImage"
import { deleteImage } from "@/services/deleteImage"


export default function QRSlide({ slideId, handleDelete, handlePreview, handlePublish }: { slideId: string, handleDelete: (id: string) => void, handlePreview: () => void, handlePublish: () => void }) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderCount = useRef(0);

  const text = useQRStore((state) => state.slides[slideId]?.text || '');
  const setText = useQRStore((state) => state.setText);

  const url = useQRStore((state) => state.slides[slideId]?.url || '');
  const setUrl = useQRStore((state) => state.setUrl);

  const qrSize = useQRStore((state) => state.slides[slideId]?.qrSize || 5);
  const setQrSize = useQRStore((state) => state.setQRSize);

  const backgroundColor = useQRStore((state) => state.slides[slideId]?.backgroundColor || '#192F51');
  const setBackgroundColor = useQRStore((state) => state.setBackgroundColor);

  const bgImage = useQRStore((state) => state.slides[slideId]?.bgImage || '');
  const setBgImage = useQRStore((state) => state.setBgImage);

  const shortcode = useGeneralStore((state) => state.shortcode || '');

  const [tempQR, setTempQR] = useState(url);

  useEffect(() => {
    // Initialize default text if not set
    if (!text) {
      setText(slideId, 'See this on your phone!');
    }
  }, [])

  useEffect(() => {
    renderCount.current += 1;
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev && renderCount.current <= 2) {
      setSaveStatus('saved');
      return;
    }
    if (!isDev && renderCount.current === 1) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 600);
  }, [backgroundColor, text, url]);

  const handleGenerateQR = () => {
    if (!tempQR.trim()) return;
    setUrl(slideId, tempQR);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadImage(shortcode, file).then((data) => {
      if(bgImage){
        deleteImage(bgImage).then(() => {
          console.log('Previous image deleted');
        }).catch((err) => {
          console.error('Failed to delete previous image:', err);
        });
      }
      setBgImage(slideId, data.url);
    }
    ).catch((err) => {
      console.error('Image upload failed:', err);
    });
    
  };

  const handleRemoveImage = () => {
    if (bgImage) {
      deleteImage(bgImage).then(() => {
        console.log('Image deleted successfully');
        setBgImage(slideId, '');
      }).catch((err) => {
        console.error('Failed to delete image:', err);
      });
    }
  };

  return (
    <>
      <div className="flex flex-1">
        {/* Main Content */}
        <div className="flex-1 bg-white">
          <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[#4a5568] mb-4">
              <span>Home</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium">QR Code</span>
            </div>

            <p className="text-[#606061] mb-6">This template is configured to show a large QR code for riders.</p>

            {/* QR Code Configuration */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[#4a5568] font-medium mb-2">URL for QR Code</label>
                <div className="flex gap-3">
                  <Input
                    placeholder="http://www.nysdot.gov"
                    className="flex-1 bg-white border-[#cbd5e0]"
                    value={tempQR}
                    onChange={(e) => setTempQR(e.target.value)}
                  />
                  <Button className="bg-[#0b5583] hover:bg-[#0b5583]/90 text-white font-medium px-6" onClick={handleGenerateQR}>Generate</Button>
                </div>
              </div>

              <div>
                <label className="block text-[#4a5568] font-medium mb-2">Text to display under QR Code</label>
                <Input
                  placeholder="Enter text here..."
                  className="bg-white border-[#cbd5e0]"
                  onChange={(e) => setText(slideId, e.target.value)}
                  value={text}
                />
              </div>
            </div>

            {/* QR Code Preview */}
            <div className="h-[550px]">
              <QRSlidePreview slideId={slideId} />
            </div>


            {/* Footer Buttons */}
            <div className="flex gap-3 mt-4">
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePreview()}>Preview Screens</Button>
              <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={() => handlePublish()}>Publish Screens</Button>
              {saveStatus !== 'idle' && (
                <div className="flex items-center text-xs text-gray-500 ml-2 animate-fade-in">
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      Saved Locally
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4">

          {/* Customization Options */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Color</label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(slideId, e.target.value)}
                    className="w-5 h-6 p-0  border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={backgroundColor} className="flex-1 text-xs" onChange={(e) => setBackgroundColor(slideId, e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Background Image</label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden">
                  {bgImage ? (
                    <img src={bgImage} alt="BG" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-4 h-4 bg-[#cbd5e0] rounded" />
                  )}
                </div>
                <div className="flex gap-1">
                  {/* Hidden input */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent px-2 py-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change
                  </Button>
                  {bgImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-transparent px-2 py-1"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

            </div>

            {/* <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">Alignment of Text on Page</label>
              <Select>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Center" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-sm">QR Code Size</label>
              <input
                type="number"
                min={1}
                max={10}
                value={qrSize !== undefined && qrSize !== null ? qrSize : 5}
                onChange={(e) => setQrSize(slideId, Number(e.target.value))}
                className="text-xs border border-gray-300 rounded px-2.5 py-2.5 w-28"
              />
            </div>
          </div>

          <div className="mt-auto">
            <Button className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs mt-2" onClick={() => { handleDelete(slideId) }}>
              Delete Screen
            </Button>
          </div>
        </div>
      </div>

    </>

  )
}