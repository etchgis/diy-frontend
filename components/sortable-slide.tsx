import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, Clock } from "lucide-react";
import { useState } from "react";
import ScheduleModal from "./schedule-modal";
import type { SlideSchedule } from "@/stores/general";

export const SortableSlide = ({
  slide,
  activeSlideId,
  setActiveSlideId,
  renderSlidePreview,
  toggleSlideHidden,
  setSchedule,
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = () => {
    setActiveSlideId(slide.id);
  };

  const hasActiveSchedule = slide.schedule?.enabled;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
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

        {/* Visibility toggle */}
        <button
          className="absolute top-1.5 right-1.5 z-10 p-0.5 rounded bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            toggleSlideHidden?.(slide.id);
          }}
          title={slide.hidden ? "Show on published screen" : "Hide from published screen"}
        >
          {slide.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        {/* Schedule button */}
        <button
          className={`absolute top-1.5 right-7 z-10 p-0.5 rounded bg-white/80 hover:bg-white shadow-sm ${
            hasActiveSchedule ? "text-blue-500 hover:text-blue-700" : "text-gray-500 hover:text-gray-800"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setShowScheduleModal(true);
          }}
          title={hasActiveSchedule ? `Scheduled: ${slide.schedule.startTime}–${slide.schedule.endTime}` : "Set visibility schedule"}
        >
          <Clock className="w-3.5 h-3.5" />
        </button>
      </div>

      {showScheduleModal && (
        <ScheduleModal
          schedule={slide.schedule}
          onSave={(s: SlideSchedule) => setSchedule?.(slide.id, s)}
          onClear={() => setSchedule?.(slide.id, null)}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </>
  );
};
