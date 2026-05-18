'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  textColor: string;
  fontSize: number;
}

// Toolbar button helper
function ToolbarBtn({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent editor losing focus
        onClick();
      }}
      className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
        active
          ? 'bg-blue-500 text-white'
          : 'text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ content, onChange, textColor, fontSize }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: content || '',
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'w-full h-full outline-none font-light rich-text-content',
        style: `color: ${textColor}; font-size: ${fontSize}px; line-height: 1.4;`,
      },
    },
  });

  // Sync external content changes (e.g. slide switching)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== content && content !== undefined) {
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
  }, [content, editor]);

  // Update font size & color when they change
  useEffect(() => {
    if (!editor) return;
    editor.view.dom.setAttribute(
      'style',
      `color: ${textColor}; font-size: ${fontSize}px; line-height: 1.4;`
    );
  }, [textColor, fontSize, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-1 py-1 bg-white/90 border-b border-[#11d1f7] rounded-t flex-shrink-0">
        {/* Text style */}
        <ToolbarBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="underline">U</span>
        </ToolbarBtn>
        <ToolbarBtn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </ToolbarBtn>

        <div className="w-px h-4 bg-gray-300 mx-0.5" />

        {/* Headings */}
        <ToolbarBtn title="Large heading" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          H1
        </ToolbarBtn>
        <ToolbarBtn title="Medium heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarBtn>
        <ToolbarBtn title="Small heading" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolbarBtn>
        <ToolbarBtn title="Normal text" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>
          ¶
        </ToolbarBtn>

        <div className="w-px h-4 bg-gray-300 mx-0.5" />

        {/* Lists */}
        <ToolbarBtn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • ≡
        </ToolbarBtn>
        <ToolbarBtn title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1 ≡
        </ToolbarBtn>

        <div className="w-px h-4 bg-gray-300 mx-0.5" />

        {/* Alignment */}
        <ToolbarBtn title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          ⬅
        </ToolbarBtn>
        <ToolbarBtn title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          ☰
        </ToolbarBtn>
        <ToolbarBtn title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          ➡
        </ToolbarBtn>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto p-2">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
