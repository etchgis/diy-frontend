import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff } from "lucide-react";

export const SortableSlide = ({
  slide,
  activeSlideId,
  setActiveSlideId,
  renderSlidePreview,
  toggleSlideHidden,
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = () => {
    setActiveSlideId(slide.id);
  };

  return (
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
      <div className="w-full h-20 overflow-hidden relative bg-gray-100 rounded">
        <div className="absolute top-0 left-0 origin-top-left scale-[0.15] w-[650%]">
          {renderSlidePreview(slide.type, slide.id)}
        </div>
        {slide.hidden && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
            <EyeOff className="w-5 h-5 text-white drop-shadow" />
          </div>
        )}
      </div>
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
    </div>
  );
};