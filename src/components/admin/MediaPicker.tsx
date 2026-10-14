'use client';
import { useEffect, useRef, useState } from 'react';
import { FileText, Search, Upload, X } from 'lucide-react';
import { browserClient } from '@/lib/supabase/browser';
import { uploadFile } from '@/lib/upload';
import { inputCls } from './ui';

type Item = { id: string; url: string; name: string; mime: string | null };

export function MediaPicker({ onPick, onClose, accept = 'image' }: { onPick: (url: string, name?: string) => void; onClose: () => void; accept?: 'image' | 'any' }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(async () => {
      let query = browserClient().from('media').select('id,url,name,mime').order('created_at', { ascending: false }).limit(60);
      if (q) query = query.ilike('name', `%${q}%`);
      if (accept === 'image') query = query.like('mime', 'image/%');
      const { data } = await query;
      setItems((data as Item[]) ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [q, accept]);
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try { const f = files[0]; const { url } = await uploadFile(f); onPick(url, f.name); }
    catch (e) { alert('Upload failed: ' + (e as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line p-4">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-line px-3"><Search className="size-4 text-stone-500" /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search by file name" className="w-full py-2.5 outline-none" /></label>
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn btn-dark !py-2.5"><Upload className="size-4" />{busy ? 'Uploading…' : 'Upload new'}</button>
          <input ref={fileRef} type="file" hidden accept={accept === 'image' ? 'image/*' : undefined} onChange={e => upload(e.target.files)} />
          <button onClick={onClose} aria-label="Close"><X className="size-5" /></button>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-5">
          {items.map(i => (
            <button key={i.id} onClick={() => onPick(i.url, i.name)} className="group overflow-hidden rounded-xl border border-line text-left hover:border-gold-500">
              <div className="grid aspect-square place-items-center bg-sand-100">
                {i.mime?.startsWith('image/') ? <img src={i.url} alt="" className="size-full object-cover" loading="lazy" /> : <FileText className="size-8 text-stone-500" />}
              </div>
              <p className="truncate px-2 py-1.5 text-xs text-stone-500">{i.name}</p>
            </button>
          ))}
          {items.length === 0 && <p className="col-span-full py-10 text-center text-stone-500">No files found.</p>}
        </div>
      </div>
    </div>
  );
}

export function ImageField({ value, onChange, label = 'Image' }: { value?: string | null; onChange: (v: string | null) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-start gap-3">
        <div className="grid aspect-[4/3] w-40 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-sand-100">
          {value ? <img src={value} alt="" className="size-full object-cover" /> : <span className="text-xs text-stone-500">No image</span>}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => setOpen(true)} className="btn btn-outline !py-2 !text-sm">{value ? 'Change' : 'Choose image'}</button>
          {value && <button type="button" onClick={() => onChange(null)} className="text-left text-sm text-stone-500 hover:text-red-700">Remove</button>}
        </div>
      </div>
      <input value={value ?? ''} onChange={e => onChange(e.target.value || null)} placeholder="…or paste an image link" className={`${inputCls} !py-2 text-xs`} />
      {open && <MediaPicker onClose={() => setOpen(false)} onPick={url => { onChange(url); setOpen(false); }} />}
    </div>
  );
}
