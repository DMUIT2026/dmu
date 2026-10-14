'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ExternalLink, Languages, Trash2 } from 'lucide-react';
import RichEditor from './RichEditor';
import { ImageField } from './MediaPicker';
import { Card, Field, inputCls, LangTabs, PageTitle, savedMessage, StatusBadge, Toast } from './ui';
import { deleteEvent, saveEvent } from '@/app/admin/actions';
import type { DmuEvent } from '@/lib/types';

const CATS: [string, string][] = [['academic', 'Academic date'], ['event', 'Event'], ['conference', 'Conference'], ['workshop', 'Workshop'], ['open-day', 'Open day'], ['holiday', 'Holiday'], ['deadline', 'Deadline']];

export default function EventEditor({ initial }: { initial: DmuEvent }) {
  const [e, setE] = useState<DmuEvent>(initial);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [edKey, setEdKey] = useState(0);
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'error' } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = <K extends keyof DmuEvent>(k: K, v: DmuEvent[K]) => setE(x => ({ ...x, [k]: v }));
  const save = (status?: 'draft' | 'published', retranslate = false) => start(async () => {
    const res = await saveEvent({ ...e, status: status ?? e.status, ...(retranslate ? { __translate: true } : {}) });
    if (!res.ok) { setToast({ msg: res.error ?? 'Could not save', kind: 'error' }); return; }
    if (res.row) { setE(res.row as unknown as DmuEvent); if (res.translated) setEdKey(k => k + 1); }
    setToast({ msg: savedMessage(status === 'published' ? 'Published — it is on the calendar.' : 'Saved.', res), kind: res.warning ? 'error' : 'ok' });
    setTimeout(() => setToast(null), 5000);
    if (!e.id && res.id) router.replace(`/admin/events/${res.id}`);
  });
  return (
    <>
      <PageTitle back="/admin/events" title={e.id ? 'Edit event' : 'New event'} actions={<>
        {e.id && e.status === 'published' && <a href={`/events/${e.id}`} target="_blank" className="btn btn-outline !py-2.5"><ExternalLink className="size-4" />View</a>}
        {e.status === 'published'
          ? <><button disabled={pending} onClick={() => save('draft')} className="btn btn-outline !py-2.5">Unpublish</button><button disabled={pending} onClick={() => save()} className="btn btn-dark !py-2.5">{pending ? 'Saving…' : 'Save & update live'}</button></>
          : <><button disabled={pending} onClick={() => save('draft')} className="btn btn-outline !py-2.5">{pending ? 'Saving…' : 'Save draft'}</button><button disabled={pending} onClick={() => save('published')} className="btn btn-gold !py-2.5">Publish</button></>}
      </>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <LangTabs lang={lang} setLang={setLang} />
          {lang === 'en' ? (
            <>
              <Card><div className="grid gap-4">
                <Field label="Event name"><input value={e.title} onChange={x => set('title', x.target.value)} className={`${inputCls} font-display !text-xl`} /></Field>
                <Field label="Location (optional)"><input value={e.location ?? ''} onChange={x => set('location', x.target.value)} className={inputCls} placeholder="e.g. DMU Building, Lecture Hall 209" /></Field>
              </div></Card>
              <div><p className="mb-2 text-sm font-medium">Description (optional)</p><RichEditor key={'en' + edKey} value={e.description} onChange={v => set('description', v)} /></div>
            </>
          ) : (
            <>
              <Card>
                <div className="grid gap-4" dir="rtl">
                  <Field label="اسم الفعالية"><input value={e.title_ar ?? ''} onChange={x => set('title_ar', x.target.value)} className={`${inputCls} font-display !text-xl`} /></Field>
                  <Field label="المكان"><input value={e.location_ar ?? ''} onChange={x => set('location_ar', x.target.value)} className={inputCls} /></Field>
                </div>
                <div className="mt-4 flex justify-end border-t border-line pt-4">
                  <button type="button" disabled={pending} onClick={() => { if (confirm('Replace the Arabic with a fresh translation of the English?')) save(undefined, true); }} className="btn btn-outline !py-2 !text-sm"><Languages className="size-4" />Translate again</button>
                </div>
              </Card>
              <div><p className="mb-2 text-sm font-medium">الوصف</p><RichEditor key={'ar' + edKey} dir="rtl" value={e.description_ar ?? ''} onChange={v => set('description_ar', v)} /></div>
            </>
          )}
        </div>
        <div className="space-y-6">
          <Card title="Status"><StatusBadge status={e.status} /></Card>
          <Card title="When"><div className="grid gap-4">
            <Field label="Start date"><input type="date" value={e.starts_on} onChange={x => set('starts_on', x.target.value)} className={inputCls} /></Field>
            <Field label="End date (if more than one day)"><input type="date" value={e.ends_on ?? ''} onChange={x => set('ends_on', x.target.value || null)} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start time"><input type="time" value={e.start_time?.slice(0, 5) ?? ''} onChange={x => set('start_time', x.target.value || null)} className={inputCls} /></Field>
              <Field label="End time"><input type="time" value={e.end_time?.slice(0, 5) ?? ''} onChange={x => set('end_time', x.target.value || null)} className={inputCls} /></Field>
            </div>
            <p className="text-xs text-stone-500">Leave the times empty for all-day dates.</p>
          </div></Card>
          <Card title="Details"><div className="grid gap-4">
            <Field label="Type"><select value={e.category} onChange={x => set('category', x.target.value as DmuEvent['category'])} className={inputCls}>{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <Field label="Registration or more-info link (optional)"><input value={e.link ?? ''} onChange={x => set('link', x.target.value || null)} className={inputCls} placeholder="https://…" /></Field>
            <ImageField label="Image (optional)" value={e.image} onChange={v => set('image', v)} />
          </div></Card>
          {e.id && <button onClick={() => { if (confirm('Delete this event permanently?')) start(() => deleteEvent(e.id!)); }} className="flex items-center gap-2 text-sm text-red-700 hover:underline"><Trash2 className="size-4" />Delete event</button>}
        </div>
      </div>
      <Toast msg={toast?.msg ?? null} kind={toast?.kind ?? 'ok'} />
    </>
  );
}
