'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, AlertCircle } from 'lucide-react';
import WebEmbedPreview from './preview';
import { useEffect, useRef, useState } from 'react';
import { useWebEmbedStore } from './store';

export default function WebEmbedEditor({
  slideId,
  handleDelete,
  handlePreview,
  handlePublish,
}: {
  slideId: string;
  handleDelete: (id: string) => void;
  handlePreview: () => void;
  handlePublish: () => void;
}) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [urlInput, setUrlInput] = useState('');
  const renderCount = useRef(0);

  const url = useWebEmbedStore((state) => state.slides[slideId]?.url || '');
  const setUrl = useWebEmbedStore((state) => state.setUrl);

  const zoom = useWebEmbedStore((state) => state.slides[slideId]?.zoom ?? 1.0);
  const setZoom = useWebEmbedStore((state) => state.setZoom);

  const scrollX = useWebEmbedStore((state) => state.slides[slideId]?.scrollX ?? 0);
  const setScrollX = useWebEmbedStore((state) => state.setScrollX);

  const scrollY = useWebEmbedStore((state) => state.slides[slideId]?.scrollY ?? 0);
  const setScrollY = useWebEmbedStore((state) => state.setScrollY);

  const refreshInterval = useWebEmbedStore((state) => state.slides[slideId]?.refreshInterval ?? 0);
  const setRefreshInterval = useWebEmbedStore((state) => state.setRefreshInterval);

  // Keep local input in sync with store (e.g. on load)
  useEffect(() => {
    setUrlInput(url);
  }, [url]);

  useEffect(() => {
    renderCount.current += 1;
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev && renderCount.current <= 2) { setSaveStatus('saved'); return; }
    if (!isDev && renderCount.current === 1) { setSaveStatus('saved'); return; }
    setSaveStatus('saving');
    const t = setTimeout(() => setSaveStatus('saved'), 600);
    return () => clearTimeout(t);
  }, [url, zoom, scrollX, scrollY, refreshInterval]);

  const applyUrl = () => {
    let normalized = urlInput.trim();
    if (normalized && !/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }
    setUrl(slideId, normalized);
    setUrlInput(normalized);
  };

  return (
    <div className="flex flex-1">
      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="p-6">
          <div className="flex items-center gap-2 text-[#4a5568] mb-4">
            <span>Home</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium">Web Embed Page</span>
          </div>

          <p className="text-[#606061] mb-4 text-sm">
            Embed a webpage directly on screen — ideal for shuttle schedules, event calendars, or any page from the host's website.
          </p>

          {/* URL input */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="https://example.com/schedule"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyUrl()}
              className="flex-1 text-sm"
            />
            <Button
              onClick={applyUrl}
              className="bg-[#192F51] hover:bg-[#192F51]/90 text-white text-sm"
            >
              Load
            </Button>
          </div>

          {/* Display behaviour notice */}
          <div className="flex items-start gap-2 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded p-2 mb-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              <strong>What you see here is exactly what viewers see.</strong> The page is non-interactive on the TV screen. Use the Scroll and Zoom controls on the right to position the content, then the preview will update to match the published output.
            </span>
          </div>

          {/* Blocking notice */}
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-4">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Some sites (e.g. Google, social media) block embedding. If the preview is blank, the site's server is preventing it — use a direct link to a page you control or one that allows framing.
            </span>
          </div>

          {/* Preview area — aspect-video keeps the same 16:9 ratio as the published screen */}
          <div className="w-full aspect-video rounded-lg border border-[#e2e8f0] overflow-hidden relative">
            <WebEmbedPreview slideId={slideId} />
          </div>

          <div className="flex gap-3 mt-4">
            <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={handlePreview}>
              Preview Screens
            </Button>
            <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" onClick={handlePublish}>
              Publish Screens
            </Button>
            {saveStatus !== 'idle' && (
              <div className="flex items-center text-xs text-gray-500 ml-2">
                {saveStatus === 'saving' ? (
                  <><div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse mr-2" />Saving...</>
                ) : (
                  <><div className="w-2 h-2 rounded-full bg-green-500 mr-2" />Saved Locally</>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-[230px] bg-white border-l border-[#e2e8f0] p-4 space-y-4">
        <div>
          <label className="block text-[#4a5568] font-medium mb-1 text-xs">Zoom</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={25}
              max={200}
              step={5}
              value={Math.round(zoom * 100)}
              onChange={(e) => setZoom(slideId, Number(e.target.value) / 100)}
              className="flex-1"
            />
            <span className="text-xs text-gray-600 w-10 text-right">{Math.round(zoom * 100)}%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Scale the page content to fit the screen.</p>
        </div>

        <div>
          <label className="block text-[#4a5568] font-medium mb-1 text-xs">Scroll Down (px)</label>
          <Input
            type="number"
            min={0}
            step={10}
            value={scrollY}
            onChange={(e) => setScrollY(slideId, Math.max(0, Number(e.target.value)))}
            className="text-xs"
          />
          <p className="text-xs text-gray-400 mt-1">Hides top navigation / headers. Preview updates instantly.</p>
        </div>

        <div>
          <label className="block text-[#4a5568] font-medium mb-1 text-xs">Scroll Right (px)</label>
          <Input
            type="number"
            min={0}
            step={10}
            value={scrollX}
            onChange={(e) => setScrollX(slideId, Math.max(0, Number(e.target.value)))}
            className="text-xs"
          />
          <p className="text-xs text-gray-400 mt-1">Preview updates instantly.</p>
        </div>

        <div>
          <label className="block text-[#4a5568] font-medium mb-1 text-xs">Auto-Refresh</label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(slideId, Number(e.target.value))}
            className="w-full text-xs border rounded px-2 py-1.5 bg-white"
          >
            <option value={0}>Never</option>
            <option value={1}>Every minute</option>
            <option value={5}>Every 5 minutes</option>
            <option value={10}>Every 10 minutes</option>
            <option value={15}>Every 15 minutes</option>
            <option value={30}>Every 30 minutes</option>
            <option value={60}>Every hour</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">Silently reloads in the background.</p>
        </div>

        <div className="mt-auto pt-4">
          <Button
            className="w-full bg-[#ff4013] hover:bg-[#ff4013]/90 text-white font-medium text-xs"
            onClick={() => handleDelete(slideId)}
          >
            Delete Screen
          </Button>
        </div>
      </div>
    </div>
  );
}
