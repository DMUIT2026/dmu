/* eslint-disable @next/next/no-img-element */
'use client';
import { useState, useTransition } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { ImageField } from './MediaPicker';
import { Field, inputCls, PageTitle, Toast } from './ui';
import { deleteProgram, saveProgram } from '@/app/admin/actions';
import type { Program } from '@/lib/types';

const COLLEGES = ['College of Medicine', 'College of Pharmacy', 'College of Nursing', 'College of Health Sciences'];

export default function ProgramsEditor({ initial }: { initial: Program[] }) {
  const [list, setList] = useState(initial);
  const [open, setOpen] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'error' } | null>(null);
  const [pending, start] = useTransition();
  const upd = (i: number, k: keyof Program, v: unknown) => setList(l => l.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const flash = (msg: string, kind: 'ok' | 'error' = 'ok') => { setToast({ msg, kind }); setTimeout(() => setToast(null), 3000); };
  const save = (i: number) => start(async () => {
    const r = await saveProgram({ ...list[i], sort_order: i });
    if (!r.ok) return flash(r.error ?? 'Error', 'error');
    if (r.id) upd(i, 'id', r.id);
    flash('Programme saved.');
  });
  const move = (i: number, d: -1 | 1) => start(async () => {
    const j = i + d; if (j < 0 || j >= list.length) return;
    const next = [...list]; [next[i], next[j]] = [next[j], next[i]]; setList(next);
    await Promise.all(next.map((p, k) => p.id ? saveProgram({ id: p.id, title: p.title, sort_order: k }) : null));
  });
  return (
    <>
      <PageTitle title="Programmes" subtitle="The programme cards on the home page. Click a programme to edit it."
        actions={<button onClick={() => { setList(l => [...l, { title: 'New programme', college: COLLEGES[0], level: 'Undergraduate', status: 'draft' }]); setOpen(list.length); }} className="btn btn-dark !py-2.5"><Plus className="size-4" />Add programme</button>} />
      <ul className="space-y-3">
        {list.map((p, i) => (
          <li key={p.id ?? i} className="rounded-2xl border border-line bg-white">
            <div className="flex items-center gap-3 p-3">
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-sand-100">{p.image && <img src={p.image} alt="" className="size-full object-cover" />}</div>
              <button onClick={() => setOpen(open === i ? null : i)} className="min-w-0 flex-1 text-left"><p className="truncate font-medium">{p.title}</p><p className="text-sm text-stone-500">{p.college} · {p.level}{p.status === 'draft' && ' · hidden'}</p></button>
              <button onClick={() => move(i, -1)} aria-label="Move up" className="p-2 text-stone-500 hover:text-ink"><ArrowUp className="size-4" /></button>
              <button onClick={() => move(i, 1)} aria-label="Move down" className="p-2 text-stone-500 hover:text-ink"><ArrowDown className="size-4" /></button>
            </div>
            {open === i && (
              <div className="grid gap-4 border-t border-line p-5 md:grid-cols-2">
                <Field label="Programme name"><input value={p.title} onChange={e => upd(i, 'title', e.target.value)} className={inputCls} /></Field>
                <Field label="Page it links to" hint="e.g. college-of-medicine/doctor-of-medicine"><input value={p.page_path ?? ''} onChange={e => upd(i, 'page_path', e.target.value)} className={inputCls} /></Field>
                <Field label="College"><select value={p.college} onChange={e => upd(i, 'college', e.target.value)} className={inputCls}>{COLLEGES.map(c => <option key={c}>{c}</option>)}</select></Field>
                <Field label="Level"><select value={p.level} onChange={e => upd(i, 'level', e.target.value)} className={inputCls}><option>Undergraduate</option><option>Postgraduate</option></select></Field>
                <Field label="Start date"><input value={p.start_date ?? ''} onChange={e => upd(i, 'start_date', e.target.value)} className={inputCls} placeholder="e.g. August 2027" /></Field>
                <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={p.status === 'published'} onChange={e => upd(i, 'status', e.target.checked ? 'published' : 'draft')} />Show on website</label>
                <div className="md:col-span-2"><ImageField value={p.image} onChange={v => upd(i, 'image', v)} /></div>
                <div className="flex justify-between md:col-span-2">
                  <button onClick={() => { if (!confirm('Delete this programme card?')) return; start(async () => { if (p.id) await deleteProgram(p.id); setList(l => l.filter((_, j) => j !== i)); setOpen(null); }); }} className="flex items-center gap-2 text-sm text-red-700"><Trash2 className="size-4" />Delete</button>
                  <button disabled={pending} onClick={() => save(i)} className="btn btn-dark !py-2">{pending ? 'Saving…' : 'Save programme'}</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Toast msg={toast?.msg ?? null} kind={toast?.kind ?? 'ok'} />
    </>
  );
}
