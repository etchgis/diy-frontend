import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const SortableSlide = ({
  slide,
  activeSlideId,
  setActiveSlideId,
  renderSlidePreview,
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
      className={`cursor-pointer rounded border bg-white p-1 ${
        slide.id === activeSlideId ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <div className="w-full h-20 overflow-hidden relative bg-gray-100 rounded">
        <div className="absolute top-0 left-0 origin-top-left scale-[0.15] w-[650%]">
          {renderSlidePreview(slide.type, slide.id)}
        </div>
      </div>
    </div>
  );
};