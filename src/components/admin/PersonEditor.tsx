'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import RichEditor from './RichEditor';
import { ImageField } from './MediaPicker';
import { Card, Field, inputCls, LangTabs, PageTitle, savedMessage, Toast } from './ui';
import { deletePerson, savePerson } from '@/app/admin/actions';
import type { Person } from '@/lib/types';

const COLLEGES = ['Dubai Medical University', 'College Of Medicine', 'College Of Pharmacy', 'College Of Nursing', 'College Of Health Sciences'];

export default function PersonEditor({ initial }: { initial: Person }) {
  const [p, setP] = useState<Person>(initial);
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'error' } | null>(null);
  const [pending, start] = useTransition();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [edKey, setEdKey] = useState(0);
  const router = useRouter();
  const set = <K extends keyof Person>(k: K, v: Person[K]) => setP(x => ({ ...x, [k]: v }));
  const save = () => start(async () => {
    const res = await savePerson({ ...p });
    if (!res.ok) { setToast({ msg: res.error ?? 'Could not save', kind: 'error' }); return; }
    if (res.row) { setP(res.row as unknown as Person); if (res.translated) setEdKey(k => k + 1); }
    setToast({ msg: savedMessage('Saved — the website is updated.', res), kind: res.warning ? 'error' : 'ok' }); setTimeout(() => setToast(null), 5000);
    if (!p.id && res.id) router.replace(`/admin/people/${res.id}`);
  });
  return (
    <>
      <PageTitle back="/admin/people" title={p.id ? p.name : 'Add person'} actions={<>
        {p.slug && p.id && <a href={`/people/${p.slug}`} target="_blank" className="btn btn-outline !py-2.5"><ExternalLink className="size-4" />View profile</a>}
        <button disabled={pending} onClick={save} className="btn btn-dark !py-2.5">{pending ? 'Saving…' : 'Save'}</button>
      </>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <LangTabs lang={lang} setLang={setLang} />
          {lang === 'en' ? (
            <>
              <Card><div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><input value={p.name} onChange={e => set('name', e.target.value)} className={inputCls} /></Field>
                <Field label="Job title"><input value={p.title ?? ''} onChange={e => set('title', e.target.value || null)} className={inputCls} /></Field>
                <Field label="Department"><input value={p.department ?? ''} onChange={e => set('department', e.target.value || null)} className={inputCls} /></Field>
                <Field label="College"><select value={p.college ?? ''} onChange={e => set('college', e.target.value || null)} className={inputCls}><option value="">—</option>{COLLEGES.map(c => <option key={c}>{c}</option>)}</select></Field>
                <Field label="Email"><input value={p.email ?? ''} onChange={e => set('email', e.target.value || null)} className={inputCls} /></Field>
                <Field label="Phone"><input value={p.phone ?? ''} onChange={e => set('phone', e.target.value || null)} className={inputCls} /></Field>
                <Field label="Scopus Author ID" hint="The number at the end of the person's Scopus profile link (…authorId=). Shows their live publications, citations and h-index."><input value={p.scopus_author_id ?? ''} onChange={e => set('scopus_author_id', e.target.value.replace(/\D/g, '') || null)} inputMode="numeric" className={inputCls} /></Field>
              </div></Card>
              <div><p className="mb-2 text-sm font-medium">Profile (biography, education, research, publications…)</p><RichEditor key={'en' + edKey} value={p.bio} onChange={v => set('bio', v)} /></div>
            </>
          ) : (
            <>
              <Card><div className="grid gap-4 sm:grid-cols-2" dir="rtl">
                <Field label="الاسم"><input value={p.name_ar ?? ''} onChange={e => set('name_ar', e.target.value || null)} className={inputCls} /></Field>
                <Field label="المسمى الوظيفي"><input value={p.title_ar ?? ''} onChange={e => set('title_ar', e.target.value || null)} className={inputCls} /></Field>
                <Field label="القسم"><input value={p.department_ar ?? ''} onChange={e => set('department_ar', e.target.value || null)} className={inputCls} /></Field>
              </div></Card>
              <div><p className="mb-2 text-sm font-medium">الملف التعريفي</p><RichEditor key={'ar' + edKey} dir="rtl" value={p.bio_ar ?? ''} onChange={v => set('bio_ar', v)} /></div>
            </>
          )}
        </div>
        <div className="space-y-6">
          <Card title="Photo"><ImageField label="" value={p.photo} onChange={v => set('photo', v)} /></Card>
          <Card title="Visibility"><div className="grid gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.status === 'published'} onChange={e => set('status', e.target.checked ? 'published' : 'draft')} />Visible on the website</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.in_directory} onChange={e => set('in_directory', e.target.checked)} />Show in staff directory</label>
            <Field label="Profile page address" hint={p.slug ? `dmu.ae/people/${p.slug}` : 'Leave empty if this person has no profile page.'}><input value={p.slug ?? ''} onChange={e => set('slug', e.target.value || null)} className={inputCls} /></Field>
          </div></Card>
          {p.id && <button onClick={() => { if (confirm('Remove this person permanently?')) start(() => deletePerson(p.id!)); }} className="flex items-center gap-2 text-sm text-red-700 hover:underline"><Trash2 className="size-4" />Remove person</button>}
        </div>
      </div>
      <Toast msg={toast?.msg ?? null} kind={toast?.kind ?? 'ok'} />
    </>
  );
}
