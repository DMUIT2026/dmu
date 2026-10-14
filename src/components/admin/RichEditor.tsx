'use client';
import { useEffect, useState } from 'react';
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor, useEditorState, type NodeViewProps } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Code2, FileText, Heading2, Heading3, Heading4, ImagePlus, Italic, Link2, List,
  ListOrdered, ListPlus, Quote, Redo2, Rows3, Table2, Trash2, Underline, Undo2, Video,
} from 'lucide-react';
import { MediaPicker } from './MediaPicker';

// ----- A block of special HTML (FAQ item, card grid, statistics, embedded video...) that is kept exactly as is -----
const RAW_SELECTORS = ['details', 'div.cards', 'div.stats', 'iframe', 'video', 'dl', 'div.table-wrap:not(:has(table))'];
const enc = (s: string) => encodeURIComponent(s);
const dec = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

function RawView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.attrs.html as string);
  const label = /^<details/.test(node.attrs.html) ? 'Expandable item (FAQ)' : /class="cards"/.test(node.attrs.html) ? 'Cards' : /class="stats"/.test(node.attrs.html) ? 'Statistics' : /<iframe|<video/.test(node.attrs.html) ? 'Embedded media' : 'Special block';
  return (
    <NodeViewWrapper className={`raw-block group relative my-4 rounded-xl border-2 border-dashed ${selected ? 'border-gold-500' : 'border-line'} p-3`} data-drag-handle>
      <div className="mb-2 flex items-center justify-between gap-2 text-xs" contentEditable={false}>
        <span className="rounded-full bg-sand-100 px-2.5 py-1 font-medium text-bronze-700">{label}</span>
        <span className="flex gap-1">
          <button type="button" onClick={() => { setDraft(node.attrs.html); setEditing(true); }} className="rounded-lg border border-line bg-white px-2.5 py-1 hover:border-gold-500">Edit</button>
          <button type="button" onClick={() => deleteNode()} className="rounded-lg border border-line bg-white px-2.5 py-1 hover:border-red-400 hover:text-red-700">Remove</button>
        </span>
      </div>
      <div className="prose-dmu pointer-events-none max-h-[420px] overflow-hidden" contentEditable={false} dangerouslySetInnerHTML={{ __html: node.attrs.html }} />
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" contentEditable={false}>
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
            <p className="font-display text-xl">Edit {label.toLowerCase()}</p>
            <p className="mt-1 text-sm text-stone-500">Change the text between the tags. For an FAQ item, the question is inside &lt;summary&gt; and the answer follows it.</p>
            <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={16} className="mt-4 w-full rounded-xl border border-line p-3 font-mono text-xs" />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(false)} className="btn btn-outline !py-2">Cancel</button>
              <button type="button" onClick={() => { updateAttributes({ html: draft }); setEditing(false); }} className="btn btn-dark !py-2">Apply</button>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

const RawBlock = Node.create({
  name: 'rawBlock',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() { return { html: { default: '' } }; },
  parseHTML() {
    return [
      { tag: 'div[data-raw-html]', priority: 100, getAttrs: el => ({ html: dec((el as HTMLElement).getAttribute('data-raw-html') ?? '') }) },
      ...RAW_SELECTORS.map(tag => ({ tag, priority: 90, getAttrs: (el: HTMLElement | string) => ({ html: (el as HTMLElement).outerHTML }) })),
    ];
  },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes({ 'data-raw-html': enc(HTMLAttributes.html ?? '') })]; },
  addNodeView() { return ReactNodeViewRenderer(RawView); },
});

/** Turn the editor's output back into clean HTML (special blocks expanded). */
export function editorToHtml(html: string) {
  return html.replace(/<div data-raw-html="([^"]*)"[^>]*><\/div>/g, (_, v) => dec(v.replace(/&amp;/g, '&')));
}

function Btn({ on, active, title, children, disabled }: { on: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" title={title} aria-label={title} disabled={disabled} onMouseDown={e => e.preventDefault()} onClick={on}
      className={`grid size-9 place-items-center rounded-lg transition disabled:opacity-30 ${active ? 'bg-espresso text-white' : 'text-ink/75 hover:bg-sand-100'}`}>
      {children}
    </button>
  );
}

export default function RichEditor({ value, onChange, dir = 'ltr' }: { value: string; onChange: (html: string) => void; dir?: 'ltr' | 'rtl' }) {
  const [source, setSource] = useState(false);
  const [src, setSrc] = useState(value);
  const [picker, setPicker] = useState<null | 'image' | 'file'>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4, 5] }, link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: null, target: null } } }),
      Image.configure({ inline: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TableKit.configure({ table: { resizable: false } }),
      RawBlock,
    ],
    content: value,
    editorProps: { attributes: { class: 'prose-dmu min-h-[420px] px-6 py-5 outline-none', dir } },
    onUpdate: ({ editor }) => onChange(editorToHtml(editor.getHTML())),
  });
  const st = useEditorState({
    editor,
    selector: ({ editor: e }) => e ? ({
      h2: e.isActive('heading', { level: 2 }), h3: e.isActive('heading', { level: 3 }), h4: e.isActive('heading', { level: 4 }),
      bold: e.isActive('bold'), italic: e.isActive('italic'), underline: e.isActive('underline'), link: e.isActive('link'),
      ul: e.isActive('bulletList'), ol: e.isActive('orderedList'), quote: e.isActive('blockquote'), table: e.isActive('table'),
      left: e.isActive({ textAlign: 'left' }), center: e.isActive({ textAlign: 'center' }), right: e.isActive({ textAlign: 'right' }), justify: e.isActive({ textAlign: 'justify' }),
      undo: e.can().undo(), redo: e.can().redo(),
    }) : null,
  });

  useEffect(() => { if (!source) setSrc(value); }, [source, value]);
  if (!editor || !st) return <div className="min-h-[480px] rounded-2xl border border-line bg-white" />;
  const c = () => editor.chain().focus();

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link address (leave empty to remove the link)', prev ?? 'https://');
    if (url === null) return;
    if (!url) c().extendMarkRange('link').unsetLink().run();
    else c().extendMarkRange('link').setLink({ href: url }).run();
  };
  const embed = () => {
    const url = window.prompt('Paste a YouTube or Vimeo link');
    if (!url) return;
    const yt = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    const vm = url.match(/vimeo\.com\/(\d+)/);
    const src = yt ? `https://www.youtube.com/embed/${yt[1]}` : vm ? `https://player.vimeo.com/video/${vm[1]}` : url;
    c().insertContent({ type: 'rawBlock', attrs: { html: `<iframe src="${src}" loading="lazy" allowfullscreen></iframe>` } }).run();
  };
  const faq = () => c().insertContent({ type: 'rawBlock', attrs: { html: '<details><summary>Question</summary><p>Answer</p></details>' } }).run();

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white" dir={dir}>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-white/95 p-2 backdrop-blur">
        {!source && <>
          <Btn title="Large heading" active={st.h2} on={() => c().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></Btn>
          <Btn title="Medium heading" active={st.h3} on={() => c().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></Btn>
          <Btn title="Small heading" active={st.h4} on={() => c().toggleHeading({ level: 4 }).run()}><Heading4 className="size-4" /></Btn>
          <span className="mx-1 h-6 w-px bg-line" />
          <Btn title="Bold" active={st.bold} on={() => c().toggleBold().run()}><Bold className="size-4" /></Btn>
          <Btn title="Italic" active={st.italic} on={() => c().toggleItalic().run()}><Italic className="size-4" /></Btn>
          <Btn title="Underline" active={st.underline} on={() => c().toggleUnderline().run()}><Underline className="size-4" /></Btn>
          <Btn title="Link" active={st.link} on={setLink}><Link2 className="size-4" /></Btn>
          <span className="mx-1 h-6 w-px bg-line" />
          <Btn title="Bullet list" active={st.ul} on={() => c().toggleBulletList().run()}><List className="size-4" /></Btn>
          <Btn title="Numbered list" active={st.ol} on={() => c().toggleOrderedList().run()}><ListOrdered className="size-4" /></Btn>
          <Btn title="Quote" active={st.quote} on={() => c().toggleBlockquote().run()}><Quote className="size-4" /></Btn>
          <span className="mx-1 h-6 w-px bg-line" />
          <Btn title="Align left" active={st.left} on={() => c().setTextAlign('left').run()}><AlignLeft className="size-4" /></Btn>
          <Btn title="Centre" active={st.center} on={() => c().setTextAlign('center').run()}><AlignCenter className="size-4" /></Btn>
          <Btn title="Align right" active={st.right} on={() => c().setTextAlign('right').run()}><AlignRight className="size-4" /></Btn>
          <Btn title="Justify" active={st.justify} on={() => c().setTextAlign('justify').run()}><AlignJustify className="size-4" /></Btn>
          <span className="mx-1 h-6 w-px bg-line" />
          <Btn title="Insert image" on={() => setPicker('image')}><ImagePlus className="size-4" /></Btn>
          <Btn title="Link to a document (PDF etc.)" on={() => setPicker('file')}><FileText className="size-4" /></Btn>
          <Btn title="Embed video" on={embed}><Video className="size-4" /></Btn>
          <Btn title="Add FAQ / expandable item" on={faq}><ListPlus className="size-4" /></Btn>
          <Btn title="Insert table" on={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 className="size-4" /></Btn>
          {st.table && <>
            <Btn title="Add row" on={() => c().addRowAfter().run()}><Rows3 className="size-4" /></Btn>
            <Btn title="Add column" on={() => c().addColumnAfter().run()}><Rows3 className="size-4 rotate-90" /></Btn>
            <Btn title="Delete row" on={() => c().deleteRow().run()}><span className="text-xs font-bold">−R</span></Btn>
            <Btn title="Delete column" on={() => c().deleteColumn().run()}><span className="text-xs font-bold">−C</span></Btn>
            <Btn title="Delete table" on={() => c().deleteTable().run()}><Trash2 className="size-4" /></Btn>
          </>}
          <span className="mx-1 h-6 w-px bg-line" />
          <Btn title="Undo" disabled={!st.undo} on={() => c().undo().run()}><Undo2 className="size-4" /></Btn>
          <Btn title="Redo" disabled={!st.redo} on={() => c().redo().run()}><Redo2 className="size-4" /></Btn>
        </>}
        <button type="button" onClick={() => {
          if (source) { editor.commands.setContent(src); onChange(editorToHtml(editor.getHTML())); }
          else setSrc(editorToHtml(editor.getHTML()));
          setSource(!source);
        }} className={`ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${source ? 'bg-espresso text-white' : 'text-ink/70 hover:bg-sand-100'}`}>
          <Code2 className="size-4" />{source ? 'Back to editor' : 'HTML'}
        </button>
      </div>
      {source
        ? <textarea dir={dir} value={src} onChange={e => { setSrc(e.target.value); onChange(e.target.value); }} className="min-h-[520px] w-full p-5 font-mono text-xs leading-relaxed outline-none" spellCheck={false} />
        : <EditorContent editor={editor} />}
      {picker && (
        <MediaPicker accept={picker === 'image' ? 'image' : 'any'} onClose={() => setPicker(null)} onPick={(url, name) => {
          if (picker === 'image') c().setImage({ src: url, alt: '' }).run();
          else c().insertContent(`<a href="${url}">${name ?? 'Download document'}</a> `).run();
          setPicker(null);
        }} />
      )}
    </div>
  );
}
