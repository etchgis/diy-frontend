'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Code2 } from 'lucide-react';

interface HtmlTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  textColor: string;
  fontSize: number;
  minHeight?: string; 
}

export default function HtmlTextEditor({ content, onChange, textColor, fontSize, minHeight }: HtmlTextEditorProps) {
  const [mode, setMode] = useState<'edit' | 'html'>('edit');
  const editableRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef(content);

  useEffect(() => {
    if (editableRef.current) {
      editableRef.current.innerHTML = content || '';
    }
  }, []);

  // Sync content when it changes from outside
  useEffect(() => {
    if (!editableRef.current) return;
    if (content !== lastContentRef.current) {
      editableRef.current.innerHTML = content || '';
      lastContentRef.current = content;
    }
  }, [content]);

  const handleInput = () => {
    if (!editableRef.current) return;
    const html = editableRef.current.innerHTML;
    lastContentRef.current = html;
    onChange(html);
  };

  return (
    <div className="relative w-full h-full" style={minHeight ? { minHeight } : undefined}>
      {/* Editable preview */}
      <div
        ref={editableRef}
        contentEditable={mode === 'edit'}
        suppressContentEditableWarning
        onInput={handleInput}
        className={`w-full h-full p-2 overflow-y-auto outline-none rich-text-content font-light ${mode === 'html' ? 'hidden' : ''}`}
        style={{ color: textColor, fontSize: `${fontSize}px`, lineHeight: 1.4 }}
      />

      {/* Raw HTML textarea */}
      {mode === 'html' && (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="w-full h-full bg-gray-950 text-green-300 font-mono text-xs p-3 resize-none outline-none leading-relaxed"
          style={minHeight ? { minHeight } : undefined}
          placeholder={'<p><strong>Bold text</strong></p>\n<p style="text-align:center; color:yellow;">Styled</p>'}
        />
      )}

      {/* Small corner toggle */}
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setMode(mode === 'edit' ? 'html' : 'edit'); }}
        title={mode === 'edit' ? 'Edit HTML source' : 'Back to editor'}
        className="absolute bottom-1.5 right-1.5 z-10 p-1 rounded bg-black/40 text-white/60 hover:bg-black/70 hover:text-white transition-colors select-none"
      >
        {mode === 'edit' ? <Code2 className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
      </button>
    </div>
  );
}
