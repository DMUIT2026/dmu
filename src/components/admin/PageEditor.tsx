'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ExternalLink, Plus, Trash2, X } from 'lucide-react';
import RichEditor from './RichEditor';
import { ImageField } from './MediaPicker';
import { Card, Field, inputCls, PageTitle, StatusBadge, Toast } from './ui';
import { deletePage, savePage } from '@/app/admin/actions';
import type { Page } from '@/lib/types';

type MenuOpt = { key: string; title: string | null; kind: string };

export default function PageEditor({ initial, menus, categories }: { initial: Page; menus: MenuOpt[]; categories: { slug: string; name: string }[] }) {
  const [p, setP] = useState<Page>(initial);
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'error' } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = <K extends keyof Page>(k: K, v: Page[K]) => setP(x => ({ ...x, [k]: v }));
  const setMeta = (k: string, v: unknown) => setP(x => ({ ...x, meta: { ...x.meta, [k]: v } }));
  const facts = p.meta.facts ?? [];

  function save(status?: 'draft' | 'published') {
    start(async () => {
      const section = ['college-of-medicine', 'college-of-pharmacy', 'college-of-nursing', 'college-of-health-sciences'].find(s => p.path === s || p.path.startsWith(s + '/')) ?? null;
      const res = await savePage({ ...p, section, status: status ?? p.status });
      if (!res.ok) { setToast({ msg: res.error ?? 'Could not save', kind: 'error' }); return; }
      if (status) set('status', status);
      setToast({ msg: status === 'published' ? 'Published — the page is live.' : status === 'draft' ? 'Saved as draft (hidden from visitors).' : 'Changes saved.', kind: 'ok' });
      setTimeout(() => setToast(null), 3500);
      if (!p.id && res.id) router.replace(`/admin/pages/${res.id}`);
    });
  }

  return (
    <>
      <PageTitle back="/admin/pages" title={p.id ? 'Edit page' : 'New page'}
        actions={<>
          {p.id && p.status === 'published' && <a href={`/${p.path}`} target="_blank" className="btn btn-outline !py-2.5"><ExternalLink className="size-4" />View live</a>}
          {p.id && <a href={`/admin/preview/page/${p.id}`} target="_blank" className="btn btn-outline !py-2.5">Preview</a>}
          {p.status === 'published'
            ? <><button disabled={pending} onClick={() => save('draft')} className="btn btn-outline !py-2.5">Unpublish</button><button disabled={pending} onClick={() => save()} className="btn btn-dark !py-2.5">{pending ? 'Saving…' : 'Save & update live'}</button></>
            : <><button disabled={pending} onClick={() => save('draft')} className="btn btn-outline !py-2.5">{pending ? 'Saving…' : 'Save draft'}</button><button disabled={pending} onClick={() => save('published')} className="btn btn-gold !py-2.5">Publish</button></>}
        </>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6 min-w-0">
          <Card>
            <div className="grid gap-4">
              <Field label="Title"><input value={p.title} onChange={e => set('title', e.target.value)} className={`${inputCls} font-display !text-xl`} /></Field>
              <Field label="Short introduction under the title (optional)"><input value={p.subtitle ?? ''} onChange={e => set('subtitle', e.target.value || null)} className={inputCls} /></Field>
            </div>
          </Card>
          {p.template === 'program' && (
            <Card title="Programme key facts">
              <div className="space-y-2">
                {facts.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={f.label} placeholder="e.g. Duration" onChange={e => setMeta('facts', facts.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className={`${inputCls} max-w-48`} />
                    <input value={f.value} placeholder="e.g. 4 years" onChange={e => setMeta('facts', facts.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} className={inputCls} />
                    <button onClick={() => setMeta('facts', facts.filter((_, j) => j !== i))} className="px-2 text-stone-500 hover:text-red-700" aria-label="Remove"><X className="size-4" /></button>
                  </div>
                ))}
                <button onClick={() => setMeta('facts', [...facts, { label: '', value: '' }])} className="inline-flex items-center gap-1 text-sm text-bronze-700"><Plus className="size-4" />Add fact</button>
              </div>
            </Card>
          )}
          <div>
            <p className="mb-2 text-sm font-medium">Page content</p>
            <RichEditor value={p.content} onChange={v => set('content', v)} />
          </div>
        </div>
        <div className="space-y-6">
          <Card title="Status"><StatusBadge status={p.status} /><p className="mt-3 text-xs text-stone-500">Drafts are only visible to admins. Publish to show the page on the website.</p></Card>
          <Card title="Settings">
            <div className="grid gap-4">
              <Field label="Web address" hint={`dmu.ae/${p.path || '…'}`}><input value={p.path} onChange={e => set('path', e.target.value)} className={inputCls} /></Field>
              <Field label="Page type">
                <select value={p.template} onChange={e => set('template', e.target.value as Page['template'])} className={inputCls}>
                  <option value="default">Standard page</option><option value="program">Programme (with key facts)</option><option value="college">College home</option>
                  <option value="news">News list</option><option value="directory">Staff directory</option><option value="contact">Contact page</option>
                </select>
              </Field>
              {p.template === 'news' && (
                <Field label="Show news from" hint="Leave all unticked to show every article.">
                  <div className="grid gap-1.5 rounded-xl border border-line p-3">
                    {categories.map(c => (
                      <label key={c.slug} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={(p.meta.categories ?? []).includes(c.slug)} onChange={e => setMeta('categories', e.target.checked ? [...(p.meta.categories ?? []), c.slug] : (p.meta.categories ?? []).filter(x => x !== c.slug))} />{c.name}
                      </label>
                    ))}
                  </div>
                </Field>
              )}
              <ImageField label="Banner image" value={p.hero_image} onChange={v => set('hero_image', v)} />
              <Field label="College menu bar">
                <select value={p.meta.collegenav ?? ''} onChange={e => setMeta('collegenav', e.target.value || undefined)} className={inputCls}>
                  <option value="">None</option>{menus.filter(m => m.kind === 'college').map(m => <option key={m.key} value={m.key}>{m.title}</option>)}
                </select>
              </Field>
              <Field label="Side menu">
                <select value={p.meta.sidenav ?? ''} onChange={e => setMeta('sidenav', e.target.value || undefined)} className={inputCls}>
                  <option value="">None</option>{menus.filter(m => m.kind === 'side').map(m => <option key={m.key} value={m.key}>{m.title}</option>)}
                </select>
              </Field>
            </div>
          </Card>
          <Card title="Search engines (SEO)">
            <div className="grid gap-4">
              <Field label="Title in Google"><input value={p.seo_title ?? ''} onChange={e => set('seo_title', e.target.value || null)} className={inputCls} /></Field>
              <Field label="Description in Google"><textarea value={p.seo_description ?? ''} rows={3} onChange={e => set('seo_description', e.target.value || null)} className={inputCls} /></Field>
            </div>
          </Card>
          {p.id && (
            <button onClick={() => { if (confirm('Delete this page permanently?')) start(() => deletePage(p.id!)); }} className="flex items-center gap-2 text-sm text-red-700 hover:underline"><Trash2 className="size-4" />Delete page</button>
          )}
        </div>
      </div>
      <Toast msg={toast?.msg ?? null} kind={toast?.kind ?? 'ok'} />
    </>
  );
}
