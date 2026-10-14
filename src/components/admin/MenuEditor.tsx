'use client';
import { useState, useTransition } from 'react';
import { ArrowDown, ArrowUp, CornerDownRight, Plus, X } from 'lucide-react';
import { Card, Field, inputCls, PageTitle, Toast } from './ui';
import { saveMenu } from '@/app/admin/actions';
import type { Menu, MenuGroup, MenuLink } from '@/lib/types';

function LinkList({ items, onChange, depth = 0 }: { items: MenuLink[]; onChange: (v: MenuLink[]) => void; depth?: number }) {
  const upd = (i: number, v: Partial<MenuLink>) => onChange(items.map((x, j) => (j === i ? { ...x, ...v } : x)));
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= items.length) return; const n = [...items]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <div className={depth ? 'ml-6 mt-2 space-y-2 border-l-2 border-line pl-3' : 'space-y-2'}>
      {items.map((it, i) => (
        <div key={i}>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white p-2">
            {depth > 0 && <CornerDownRight className="size-4 text-stone-500" />}
            <input value={it.label} onChange={e => upd(i, { label: e.target.value })} placeholder="Label" className={`${inputCls} !py-1.5 max-w-64`} />
            <input value={it.url ?? ''} onChange={e => upd(i, { url: e.target.value || null })} placeholder="Link (e.g. /admissions) — empty for a heading" className={`${inputCls} !py-1.5 flex-1 min-w-48`} />
            <button onClick={() => move(i, -1)} className="p-1.5 text-stone-500 hover:text-ink" aria-label="Up"><ArrowUp className="size-4" /></button>
            <button onClick={() => move(i, 1)} className="p-1.5 text-stone-500 hover:text-ink" aria-label="Down"><ArrowDown className="size-4" /></button>
            {depth < 2 && <button onClick={() => upd(i, { children: [...(it.children ?? []), { label: '', url: '' }] })} className="rounded-lg px-2 py-1 text-xs text-bronze-700 hover:bg-sand-100">+ sub-link</button>}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-1.5 text-stone-500 hover:text-red-700" aria-label="Remove"><X className="size-4" /></button>
          </div>
          {it.children && it.children.length > 0 && <LinkList items={it.children} depth={depth + 1} onChange={v => upd(i, { children: v.length ? v : undefined })} />}
        </div>
      ))}
      <button onClick={() => onChange([...items, { label: '', url: '' }])} className="inline-flex items-center gap-1 text-sm text-bronze-700"><Plus className="size-4" />Add link</button>
    </div>
  );
}

export default function MenuEditor({ initial }: { initial: Menu }) {
  const [m, setM] = useState(initial);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const save = () => start(async () => { const r = await saveMenu(m); setToast(r.ok ? 'Menu saved — the website is updated.' : r.error ?? 'Error'); setTimeout(() => setToast(null), 3000); });
  const groups = m.items as MenuGroup[];
  return (
    <>
      <PageTitle back="/admin/menus" title={m.title || m.key} actions={<button disabled={pending} onClick={save} className="btn btn-dark !py-2.5">{pending ? 'Saving…' : 'Save menu'}</button>} />
      {m.kind !== 'menu' && (
        <Card className="mb-6"><div className="grid gap-4 sm:grid-cols-2">
          <Field label="Menu name"><input value={m.title ?? ''} onChange={e => setM({ ...m, title: e.target.value })} className={inputCls} /></Field>
          {m.kind === 'college' && <Field label="Name links to"><input value={m.url ?? ''} onChange={e => setM({ ...m, url: e.target.value })} className={inputCls} /></Field>}
        </div></Card>
      )}
      {m.kind === 'menu'
        ? <LinkList items={m.items as MenuLink[]} onChange={v => setM({ ...m, items: v })} />
        : (
          <div className="space-y-6">
            {groups.map((g, gi) => (
              <Card key={gi}>
                <div className="mb-3 flex items-center gap-2">
                  <input value={g.title} onChange={e => setM({ ...m, items: groups.map((x, j) => j === gi ? { ...x, title: e.target.value } : x) })} placeholder="Group heading" className={`${inputCls} font-medium`} />
                  <button onClick={() => setM({ ...m, items: groups.filter((_, j) => j !== gi) })} className="p-2 text-stone-500 hover:text-red-700" aria-label="Remove group"><X className="size-4" /></button>
                </div>
                <LinkList items={g.links} onChange={v => setM({ ...m, items: groups.map((x, j) => j === gi ? { ...x, links: v } : x) })} />
              </Card>
            ))}
            <button onClick={() => setM({ ...m, items: [...groups, { title: 'New group', links: [] }] })} className="btn btn-outline !py-2"><Plus className="size-4" />Add group</button>
          </div>
        )}
      <Toast msg={toast} kind="ok" />
    </>
  );
}
