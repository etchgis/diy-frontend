import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeOff, Settings } from "lucide-react";
import { useState } from "react";
import SlideSettingsModal from "./slide-settings-modal";

export const SortableSlide = ({
  slide,
  activeSlideId,
  setActiveSlideId,
  renderSlidePreview,
  toggleSlideHidden,
  setSchedule,
  setSlideLabel,
  setSlideDuration,
  duplicateSlide,
  deleteSlide,
  globalDuration,
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasActiveSchedule = slide.schedule?.enabled;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setActiveSlideId(slide.id)}
        className={`cursor-pointer rounded border bg-white p-1 relative ${
          slide.id === activeSlideId ? "ring-2 ring-blue-500" : ""
        } ${slide.hidden ? "opacity-40" : ""}`}
      >
        <div className="w-full aspect-video overflow-hidden relative bg-gray-100 rounded">
          <div className="absolute inset-0">
            {renderSlidePreview(slide.type, slide.id, true, true)}
          </div>
          {slide.hidden && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
              <EyeOff className="w-5 h-5 text-white drop-shadow" />
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          className="absolute top-1.5 right-1.5 z-10 p-0.5 rounded bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowSettingsModal(true);
          }}
          title="Screen settings"
        >
          <Settings className="w-3.5 h-3.5" />
          {hasActiveSchedule && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </button>

        {/* Label */}
        {slide.label && (
          <p className="mt-1 text-xs text-[#4a5568] truncate px-0.5 leading-tight">{slide.label}</p>
        )}
      </div>

      {showSettingsModal && (
        <SlideSettingsModal
          slide={slide}
          globalDuration={globalDuration ?? 20}
          onSaveLabel={(label) => setSlideLabel?.(slide.id, label)}
          onSaveDuration={(duration) => setSlideDuration?.(slide.id, duration)}
          onSaveVisibility={(hidden) => {
            if (hidden !== (slide.hidden ?? false)) {
              toggleSlideHidden?.(slide.id);
            }
          }}
          onSaveSchedule={(schedule) => setSchedule?.(slide.id, schedule)}
          onDuplicate={() => duplicateSlide?.(slide.id)}
          onDelete={() => deleteSlide?.(slide.id)}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </>
  );
};
