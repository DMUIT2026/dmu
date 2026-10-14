'use client';
import { useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from 'lucide-react';
import { MediaPicker } from './MediaPicker';
import { inputCls } from './ui';
import type { ArticleImage } from '@/lib/types';

const MAX = 3;
const opt = <T extends string>(v: T, set: (v: T) => void, options: [T, string][]) => (
  <div className="inline-flex rounded-lg border border-line bg-sand-50 p-0.5">
    {options.map(([k, l]) => (
      <button key={k} type="button" onClick={() => set(k)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${v === k ? 'bg-espresso text-white' : 'text-ink/70 hover:bg-white'}`}>{l}</button>
    ))}
  </div>
);

/** Up to three photos for a news article, each with position, alignment, size and caption. */
export default function ArticleImages({ value, onChange }: { value: ArticleImage[]; onChange: (v: ArticleImage[]) => void }) {
  const [picking, setPicking] = useState<number | null>(null);
  const list = value ?? [];
  const upd = (i: number, patch: Partial<ArticleImage>) => onChange(list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= list.length) return; const n = [...list]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <div className="space-y-4">
      {list.map((img, i) => (
        <div key={i} className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-[160px_1fr]">
          <button type="button" onClick={() => setPicking(i)} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-sand-100" title="Change photo">
            <img src={img.url} alt="" className="size-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-black/50 py-1 text-center text-xs text-white opacity-0 transition group-hover:opacity-100">Change</span>
          </button>
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="w-16 text-xs font-semibold text-stone-500">Where</span>{opt(img.place, v => upd(i, { place: v }), [['top', 'Top'], ['middle', 'Middle'], ['end', 'End']])}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="w-16 text-xs font-semibold text-stone-500">Align</span>{opt(img.align, v => upd(i, { align: v }), [['left', 'Left, text beside'], ['center', 'Centre'], ['right', 'Right, text beside']])}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="w-16 text-xs font-semibold text-stone-500">Size</span>{opt(img.size, v => upd(i, { size: v }), [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['full', 'Full width']])}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input value={img.caption ?? ''} onChange={e => upd(i, { caption: e.target.value })} placeholder="Caption (optional)" className={`${inputCls} !py-1.5 text-sm`} />
              <input dir="rtl" value={img.caption_ar ?? ''} onChange={e => upd(i, { caption_ar: e.target.value })} placeholder="التعليق بالعربية (اختياري)" className={`${inputCls} !py-1.5 text-sm`} />
            </div>
            <div className="flex gap-1 text-stone-500">
              <button type="button" onClick={() => move(i, -1)} className="rounded-lg p-1.5 hover:bg-sand-100" aria-label="Move up"><ArrowUp className="size-4" /></button>
              <button type="button" onClick={() => move(i, 1)} className="rounded-lg p-1.5 hover:bg-sand-100" aria-label="Move down"><ArrowDown className="size-4" /></button>
              <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="ms-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm hover:bg-red-50 hover:text-red-700"><Trash2 className="size-4" />Remove</button>
            </div>
          </div>
        </div>
      ))}
      {list.length < MAX
        ? <button type="button" onClick={() => setPicking(list.length)} className="btn btn-outline !py-2 !text-sm"><ImagePlus className="size-4" />Add photo ({list.length}/{MAX})</button>
        : <p className="text-xs text-stone-500">Maximum of {MAX} photos reached.</p>}
      {picking !== null && (
        <MediaPicker onClose={() => setPicking(null)} onPick={url => {
          if (picking < list.length) upd(picking, { url });
          else onChange([...list, { url, place: list.length === 0 ? 'top' : list.length === 1 ? 'middle' : 'end', align: 'center', size: 'large' }]);
          setPicking(null);
        }} />
      )}
    </div>
  );
}
