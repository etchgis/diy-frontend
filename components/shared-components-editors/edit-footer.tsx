import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";
import { useFooterStore } from "@/stores/footer";
import { useRef, useState, useEffect } from "react";
import { useGeneralStore } from "@/stores/general";
import { uploadImage } from "@/services/uploadImage";
import { deleteImage } from "@/services/deleteImage";

export default function EditFooter({
  handleCancel,
  handleSave,
}: {
  handleCancel: () => void;
  handleSave: () => void;
}) {
  const leftInputRef = useRef<HTMLInputElement>(null);
  const middleInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  // Get initial values from store
  const storeLeftImage = useFooterStore((state) => state.leftImage);
  const storeMiddleImage = useFooterStore((state) => state.middleImage);
  const storeRightImage = useFooterStore((state) => state.rightImage);
  const storeLeftType = useFooterStore((state) => state.leftType);
  const storeMiddleType = useFooterStore((state) => state.middleType);
  const storeRightType = useFooterStore((state) => state.rightType);
  const storeBackgroundColor = useFooterStore((state) => state.backgroundColor);
  const storeTimeTextColor = useFooterStore((state) => state.timeTextColor);

  // Local state for editing
  const [leftImage, setLeftImage] = useState(storeLeftImage);
  const [middleImage, setMiddleImage] = useState(storeMiddleImage);
  const [rightImage, setRightImage] = useState(storeRightImage);
  const [leftType, setLeftType] = useState(storeLeftType);
  const [middleType, setMiddleType] = useState(storeMiddleType);
  const [rightType, setRightType] = useState(storeRightType);
  const [backgroundColor, setBackgroundColor] = useState(storeBackgroundColor);
  const [timeTextColor, setTimeTextColor] = useState(storeTimeTextColor);

  const shortcode = useGeneralStore((state) => state.shortcode || "");

  // Time display for preview
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const renderSection = (
    type: string,
    image: string,
    altText: string,
    imageClass: string,
    placeholderClass: string
  ) => {
    if (type === "none") {
      return <div className={placeholderClass} />;
    } else if (type === "time") {
      return (
        <div
          className={`font-medium ${placeholderClass}`}
          style={{ color: timeTextColor }}
        >
          {currentTime}
        </div>
      );
    } else if (image) {
      return <img src={image} alt={altText} className={imageClass} />;
    } else {
      return <div className={placeholderClass} />;
    }
  };

  // Save to store when Save button is clicked
  const handleSaveClick = () => {
    const {
      setLeftImage: storeSetLeftImage,
      setMiddleImage: storeSetMiddleImage,
      setRightImage: storeSetRightImage,
      setLeftType: storeSetLeftType,
      setMiddleType: storeSetMiddleType,
      setRightType: storeSetRightType,
      setBackgroundColor: storeSetBackgroundColor,
      setTimeTextColor: storeSetTimeTextColor,
    } = useFooterStore.getState();

    storeSetLeftImage(leftImage);
    storeSetMiddleImage(middleImage);
    storeSetRightImage(rightImage);
    storeSetLeftType(leftType);
    storeSetMiddleType(middleType);
    storeSetRightType(rightType);
    storeSetBackgroundColor(backgroundColor);
    storeSetTimeTextColor(timeTextColor);

    handleSave();
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "left" | "middle" | "right"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === "left" && leftInputRef.current) {
      leftInputRef.current.value = "";
    } else if (target === "middle" && middleInputRef.current) {
      middleInputRef.current.value = "";
    } else if (target === "right" && rightInputRef.current) {
      rightInputRef.current.value = "";
    }

    const currentImage = target === "left" ? leftImage : target === "middle" ? middleImage : rightImage;
    const localSetImageFn = target === "left" ? setLeftImage : target === "middle" ? setMiddleImage : setRightImage;

    uploadImage(shortcode, file)
      .then((data) => {
        // Only delete if it's not a default image path
        if (currentImage && !currentImage.startsWith("/images/")) {
          deleteImage(currentImage)
            .then(() => {})
            .catch((err) => {
              console.error("Failed to delete previous image:", err);
            });
        }
        localSetImageFn(data.url);
      })
      .catch((err) => {
        console.error("Image upload failed:", err);
      });
  };

  const handleResetImage = (target: "left" | "middle" | "right") => {
    const currentImage = target === "left" ? leftImage : target === "middle" ? middleImage : rightImage;
    const localSetImageFn = target === "left" ? setLeftImage : target === "middle" ? setMiddleImage : setRightImage;
    const inputRef = target === "left" ? leftInputRef : target === "middle" ? middleInputRef : rightInputRef;
    const defaultImage =
      target === "left"
        ? "/images/statewide-mobility-services.png"
        : target === "middle"
        ? ""
        : "/images/nysdot-footer-logo.png";

    // Only delete if it's not a default image path
    if (currentImage && !currentImage.startsWith("/images/")) {
      deleteImage(currentImage)
        .then(() => {
          localSetImageFn(defaultImage);
          if (inputRef.current) {
            inputRef.current.value = "";
          }
        })
        .catch((err) => {
          console.error("Failed to delete image:", err);
        });
    } else {
      // Just reset to default
      localSetImageFn(defaultImage);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (target: "left" | "middle" | "right") => {
    const currentImage = target === "left" ? leftImage : target === "middle" ? middleImage : rightImage;
    const localSetImageFn = target === "left" ? setLeftImage : target === "middle" ? setMiddleImage : setRightImage;
    const inputRef = target === "left" ? leftInputRef : target === "middle" ? middleInputRef : rightInputRef;

    // Only delete if it's not a default image path
    if (currentImage && !currentImage.startsWith("/images/")) {
      deleteImage(currentImage)
        .then(() => {
          localSetImageFn("");
          if (inputRef.current) {
            inputRef.current.value = "";
          }
        })
        .catch((err) => {
          console.error("Failed to delete image:", err);
        });
    } else {
      // Just clear the image
      localSetImageFn("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
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
              <span className="font-medium">Edit Footer</span>
            </div>

            <p className="text-[#606061] mb-6">
              Customize the footer that appears at the bottom of all screens.
            </p>

            {/* Footer Preview */}
            <div className="h-[550px] rounded-lg border border-[#e2e8f0] overflow-hidden flex flex-col justify-end">
              <div
                className="p-3 flex items-center justify-between rounded-b-lg"
                style={{ backgroundColor }}
              >
                {renderSection(
                  leftType,
                  leftImage,
                  "Left Footer",
                  "h-[25px] w-[246px]",
                  "h-[25px] w-[246px]"
                )}
                {renderSection(
                  middleType,
                  middleImage,
                  "Middle Footer",
                  "h-[25px] w-[246px]",
                  "h-[25px] w-[246px]"
                )}
                {renderSection(
                  rightType,
                  rightImage,
                  "Right Footer",
                  "h-8",
                  "h-8 w-[100px]"
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 mt-4">
              <Button
                className="bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium"
                onClick={handleSaveClick}
              >
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4 overflow-y-auto">
          {/* Customization Options */}
          <div className="space-y-3 mb-4">
            {/* Background Color */}
            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={backgroundColor} className="flex-1 text-xs" onChange={(e) => setBackgroundColor(e.target.value)} />
              </div>
            </div>

            {/* Time Text Color */}
            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Time Text Color
              </label>
              <div className="flex items-center gap-2">
                <div className="colorContainer">
                  <input
                    type="color"
                    value={timeTextColor}
                    onChange={(e) => setTimeTextColor(e.target.value)}
                    className="w-5 h-6 p-0 border-none rounded cursor-pointer appearance-none"
                  />
                </div>
                <Input value={timeTextColor} className="flex-1 text-xs" onChange={(e) => setTimeTextColor(e.target.value)} />
              </div>
            </div>

            {/* Left Footer Section */}
            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Left Section Type
              </label>
              <select
                value={leftType}
                onChange={(e) => setLeftType(e.target.value as "image" | "time" | "none")}
                className="w-full px-2 py-1 text-xs border rounded"
              >
                <option value="image">Image</option>
                <option value="time">Time</option>
                <option value="none">None</option>
              </select>
            </div>

            {leftType === "image" && (
              <div>
                <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                  Left Footer Image
                </label>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-full h-16 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden p-2">
                  {leftImage ? (
                    <img
                      src={leftImage}
                      alt="Left"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-gray-400">No image</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <input
                  type="file"
                  accept="image/*"
                  ref={leftInputRef}
                  onChange={(e) => handleImageUpload(e, "left")}
                  className="hidden"
                />
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent px-2 py-1 flex-1"
                    onClick={() => leftInputRef.current?.click()}
                  >
                    Change
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent px-2 py-1 flex-1"
                    onClick={() => handleResetImage("left")}
                  >
                    Reset
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent px-2 py-1 w-full"
                  onClick={() => handleRemoveImage("left")}
                >
                  Remove
                </Button>
              </div>
              </div>
            )}

            {/* Middle Footer Section */}
            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Middle Section Type
              </label>
              <select
                value={middleType}
                onChange={(e) => setMiddleType(e.target.value as "image" | "time" | "none")}
                className="w-full px-2 py-1 text-xs border rounded"
              >
                <option value="image">Image</option>
                <option value="time">Time</option>
                <option value="none">None</option>
              </select>
            </div>

            {middleType === "image" && (
              <div>
                <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                  Middle Footer Image
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-full h-16 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden p-2">
                    {middleImage ? (
                      <img
                        src={middleImage}
                        alt="Middle"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-xs text-gray-400">No image</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <input
                    type="file"
                    accept="image/*"
                    ref={middleInputRef}
                    onChange={(e) => handleImageUpload(e, "middle")}
                    className="hidden"
                  />
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-transparent px-2 py-1 flex-1"
                      onClick={() => middleInputRef.current?.click()}
                    >
                      Change
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-transparent px-2 py-1 flex-1"
                      onClick={() => handleResetImage("middle")}
                    >
                      Reset
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent px-2 py-1 w-full"
                    onClick={() => handleRemoveImage("middle")}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {/* Right Footer Section */}
            <div>
              <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                Right Section Type
              </label>
              <select
                value={rightType}
                onChange={(e) => setRightType(e.target.value as "image" | "time" | "none")}
                className="w-full px-2 py-1 text-xs border rounded"
              >
                <option value="image">Image</option>
                <option value="time">Time</option>
                <option value="none">None</option>
              </select>
            </div>

            {rightType === "image" && (
              <div>
                <label className="block text-[#4a5568] font-medium mb-1 text-xs">
                  Right Footer Image
                </label>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-full h-16 bg-[#f4f4f4] rounded border flex items-center justify-center overflow-hidden p-2">
                  {rightImage ? (
                    <img
                      src={rightImage}
                      alt="Right"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-gray-400">No image</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <input
                  type="file"
                  accept="image/*"
                  ref={rightInputRef}
                  onChange={(e) => handleImageUpload(e, "right")}
                  className="hidden"
                />
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent px-2 py-1 flex-1"
                    onClick={() => rightInputRef.current?.click()}
                  >
                    Change
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent px-2 py-1 flex-1"
                    onClick={() => handleResetImage("right")}
                  >
                    Reset
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent px-2 py-1 w-full"
                  onClick={() => handleRemoveImage("right")}
                >
                  Remove
                </Button>
              </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
