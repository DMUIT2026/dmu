'use client';
import { useEffect, useRef, useState } from 'react';
import { Copy, FileText, Search, Upload } from 'lucide-react';
import { browserClient } from '@/lib/supabase/browser';
import { uploadFile } from '@/lib/upload';
import { PageTitle, Toast } from './ui';

type Item = { id: string; url: string; name: string; mime: string | null; size: number | null; created_at: string };

export default function MediaLibrary() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [limit, setLimit] = useState(60);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const load = async () => {
    let query = browserClient().from('media').select('*').order('created_at', { ascending: false }).limit(limit);
    if (q) query = query.ilike('name', `%${q}%`);
    const { data } = await query; setItems((data as Item[]) ?? []);
  };
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, limit]); // eslint-disable-line react-hooks/exhaustive-deps
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try { for (const f of Array.from(files)) await uploadFile(f); setToast(`${files.length} file(s) uploaded.`); await load(); }
    catch (e) { setToast('Upload failed: ' + (e as Error).message); }
    finally { setBusy(false); setTimeout(() => setToast(null), 3000); }
  }
  return (
    <>
      <PageTitle title="Images & files" subtitle="Upload photos and documents (PDF, Word…) and copy their link to use anywhere."
        actions={<><button onClick={() => ref.current?.click()} disabled={busy} className="btn btn-dark !py-2.5"><Upload className="size-4" />{busy ? 'Uploading…' : 'Upload files'}</button><input ref={ref} type="file" multiple hidden onChange={e => upload(e.target.files)} /></>} />
      <label className="mb-5 flex items-center gap-2 rounded-xl border border-line bg-white px-4"><Search className="size-4 text-stone-500" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by file name" className="w-full py-2.5 outline-none" /></label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map(i => (
          <div key={i.id} className="overflow-hidden rounded-xl border border-line bg-white">
            <a href={i.url} target="_blank" className="grid aspect-square place-items-center bg-sand-100">
              {i.mime?.startsWith('image/') ? <img src={i.url} alt="" loading="lazy" className="size-full object-cover" /> : <FileText className="size-8 text-stone-500" />}
            </a>
            <div className="flex items-center gap-1 p-2">
              <p className="min-w-0 flex-1 truncate text-xs text-stone-500" title={i.name}>{i.name}</p>
              <button onClick={() => { navigator.clipboard.writeText(i.url); setToast('Link copied.'); setTimeout(() => setToast(null), 2000); }} className="p-1 text-stone-500 hover:text-ink" aria-label="Copy link"><Copy className="size-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      {items.length === limit && <div className="mt-6 text-center"><button onClick={() => setLimit(l => l + 60)} className="btn btn-outline !py-2">Load more</button></div>}
      <Toast msg={toast} kind="ok" />
    </>
  );
}
