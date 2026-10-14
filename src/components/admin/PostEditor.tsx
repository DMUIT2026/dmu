'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import RichEditor from './RichEditor';
import { ImageField } from './MediaPicker';
import { Card, Field, inputCls, PageTitle, StatusBadge, Toast } from './ui';
import { deletePost, savePost } from '@/app/admin/actions';
import type { Post } from '@/lib/types';

const toLocal = (d?: string | null) => (d ? new Date(new Date(d).getTime() + 4 * 3600e3).toISOString().slice(0, 16) : '');
const fromLocal = (v: string) => (v ? new Date(v + ':00+04:00').toISOString() : null);

export default function PostEditor({ initial, categories }: { initial: Post; categories: { slug: string; name: string }[] }) {
  const [p, setP] = useState<Post>(initial);
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'error' } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = <K extends keyof Post>(k: K, v: Post[K]) => setP(x => ({ ...x, [k]: v }));
  function save(status?: 'draft' | 'published') {
    start(async () => {
      const res = await savePost({ ...p, status: status ?? p.status });
      if (!res.ok) { setToast({ msg: res.error ?? 'Could not save', kind: 'error' }); return; }
      if (status) set('status', status);
      setToast({ msg: status === 'published' ? 'Published — the article is live.' : 'Saved.', kind: 'ok' });
      setTimeout(() => setToast(null), 3500);
      if (!p.id && res.id) router.replace(`/admin/news/${res.id}`);
    });
  }
  return (
    <>
      <PageTitle back="/admin/news" title={p.id ? 'Edit article' : 'New article'} actions={<>
        {p.id && p.status === 'published' && <a href={`/news/${p.slug}`} target="_blank" className="btn btn-outline !py-2.5"><ExternalLink className="size-4" />View live</a>}
        {p.id && <a href={`/admin/preview/post/${p.id}`} target="_blank" className="btn btn-outline !py-2.5">Preview</a>}
        {p.status === 'published'
          ? <><button disabled={pending} onClick={() => save('draft')} className="btn btn-outline !py-2.5">Unpublish</button><button disabled={pending} onClick={() => save()} className="btn btn-dark !py-2.5">{pending ? 'Saving…' : 'Save & update live'}</button></>
          : <><button disabled={pending} onClick={() => save('draft')} className="btn btn-outline !py-2.5">{pending ? 'Saving…' : 'Save draft'}</button><button disabled={pending} onClick={() => save('published')} className="btn btn-gold !py-2.5">Publish</button></>}
      </>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Card><div className="grid gap-4">
            <Field label="Headline"><input value={p.title} onChange={e => set('title', e.target.value)} className={`${inputCls} font-display !text-xl`} /></Field>
            <Field label="Summary" hint="Shown on news cards and in Google."><textarea value={p.excerpt ?? ''} rows={3} onChange={e => set('excerpt', e.target.value || null)} className={inputCls} /></Field>
          </div></Card>
          <div><p className="mb-2 text-sm font-medium">Article</p><RichEditor value={p.content} onChange={v => set('content', v)} /></div>
        </div>
        <div className="space-y-6">
          <Card title="Status"><StatusBadge status={p.status} /></Card>
          <Card title="Details"><div className="grid gap-4">
            <Field label="Publication date & time (Dubai)"><input type="datetime-local" value={toLocal(p.published_at)} onChange={e => set('published_at', fromLocal(e.target.value))} className={inputCls} /></Field>
            <Field label="Web address" hint={`dmu.ae/news/${p.slug || '…'} — filled in automatically if empty`}><input value={p.slug} onChange={e => set('slug', e.target.value)} className={inputCls} /></Field>
            <ImageField label="Cover image" value={p.cover_image} onChange={v => set('cover_image', v)} />
            <Field label="Categories"><div className="grid gap-1.5 rounded-xl border border-line p-3">
              {categories.map(c => <label key={c.slug} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.categories.includes(c.slug)} onChange={e => set('categories', e.target.checked ? [...p.categories, c.slug] : p.categories.filter(x => x !== c.slug))} />{c.name}</label>)}
            </div></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p.featured} onChange={e => set('featured', e.target.checked)} />Feature on home page</label>
          </div></Card>
          {p.id && <button onClick={() => { if (confirm('Delete this article permanently?')) start(() => deletePost(p.id!)); }} className="flex items-center gap-2 text-sm text-red-700 hover:underline"><Trash2 className="size-4" />Delete article</button>}
        </div>
      </div>
      <Toast msg={toast?.msg ?? null} kind={toast?.kind ?? 'ok'} />
    </>
  );
}
