'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Copy, Trash2 } from 'lucide-react';
import type { SlideSchedule } from '@/stores/general';

interface Props {
  slide: any;
  onSaveVisibility: (hidden: boolean) => void;
  onSaveSchedule: (schedule: SlideSchedule | null) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function SlideSettingsModal({ slide, onSaveVisibility, onSaveSchedule, onDuplicate, onDelete, onClose }: Props) {
  const [hidden, setHidden] = useState(slide.hidden ?? false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(slide.schedule?.enabled ?? false);
  const [startTime, setStartTime] = useState(slide.schedule?.startTime ?? '08:00');
  const [endTime, setEndTime] = useState(slide.schedule?.endTime ?? '18:00');

  const isOvernight = scheduleEnabled && startTime > endTime;

  const handleSave = () => {
    onSaveVisibility(hidden);
    onSaveSchedule(scheduleEnabled ? { enabled: true, startTime, endTime } : null);
    onClose();
  };

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
          <h3 className="font-semibold text-[#1a202c] text-sm">Screen Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visibility */}
        <div className="mb-4">
          <p className="text-xs font-medium text-[#4a5568] uppercase tracking-wide mb-2">Visibility</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!hidden}
              onChange={(e) => setHidden(!e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-[#4a5568]">Show on published screen</span>
          </label>
        </div>

        {/* Schedule */}
        <div className="mb-4 border-t pt-4">
          <p className="text-xs font-medium text-[#4a5568] uppercase tracking-wide mb-2">Schedule</p>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(e) => setScheduleEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-[#4a5568]">Only show during certain hours</span>
          </label>

          {scheduleEnabled && (
            <div className="space-y-3 pl-6">
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
        </div>

        {/* Actions */}
        <div className="border-t pt-4 mb-4">
          <p className="text-xs font-medium text-[#4a5568] uppercase tracking-wide mb-2">Actions</p>
          <button
            className="flex items-center gap-2 text-sm text-[#4a5568] hover:text-[#1a202c] px-2 py-1.5 rounded hover:bg-gray-50 w-full text-left"
            onClick={() => { onDuplicate(); onClose(); }}
          >
            <Copy className="w-4 h-4 shrink-0" />
            Duplicate screen
          </button>

          {!confirmingDelete ? (
            <button
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 px-2 py-1.5 rounded hover:bg-red-50 w-full text-left mt-1"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              Delete screen
            </button>
          ) : (
            <div className="mt-2 bg-red-50 border border-red-100 rounded p-3">
              <p className="text-xs text-red-700 mb-2">Delete this screen? This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  onClick={() => { onDelete(); onClose(); }}
                >
                  Yes, delete
                </button>
                <button
                  className="text-xs text-gray-600 hover:text-gray-800 px-3 py-1 rounded hover:bg-gray-100"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t pt-4">
          <Button
            size="sm"
            className="flex-1 bg-[#192F51] hover:bg-[#192F51]/90 text-white text-xs"
            onClick={handleSave}
          >
            Save
          </Button>
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
