'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { SlideSchedule } from '@/stores/general';

interface Props {
  schedule: SlideSchedule | null | undefined;
  onSave: (schedule: SlideSchedule) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function ScheduleModal({ schedule, onSave, onClear, onClose }: Props) {
  const [enabled, setEnabled] = useState(schedule?.enabled ?? false);
  const [startTime, setStartTime] = useState(schedule?.startTime ?? '08:00');
  const [endTime, setEndTime] = useState(schedule?.endTime ?? '18:00');

  const isOvernight = enabled && startTime > endTime;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-80 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1a202c] text-sm">Schedule Visibility</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-[#4a5568]">Only show during certain hours</span>
        </label>

        {enabled && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs text-[#4a5568] font-medium mb-1">Show from</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-[#cbd5e0] rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#4a5568] font-medium mb-1">Hide after</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-[#cbd5e0] rounded px-3 py-1.5 text-sm"
              />
            </div>
            {isOvernight && (
              <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded p-2">
                Spans midnight — shows from {startTime} until {endTime} the next day.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            className="flex-1 bg-[#192F51] hover:bg-[#192F51]/90 text-white text-xs"
            onClick={() => { onSave({ enabled, startTime, endTime }); onClose(); }}
          >
            Save
          </Button>
          {schedule?.enabled && enabled && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => { onClear(); onClose(); }}
            >
              Disable
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
