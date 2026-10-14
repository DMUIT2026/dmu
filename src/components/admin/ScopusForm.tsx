'use client';
import { useActionState } from 'react';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { saveScopusSettings } from '@/app/admin/actions';
import { Card, Field, inputCls } from './ui';

export default function ScopusForm({ hasKey, keyHint, hasToken, affiliations }: { hasKey: boolean; keyHint: string; hasToken: boolean; affiliations: string }) {
  const [state, action, pending] = useActionState(saveScopusSettings, null);
  return (
    <form action={action} className="grid gap-6">
      <Card title="Elsevier Scopus API key">
        {hasKey
          ? <p className="mb-4 flex items-center gap-2 text-sm text-emerald-800"><CheckCircle2 className="size-4" />A key is saved (ending in {keyHint}). Paste a new one below only to replace it.</p>
          : <p className="mb-4 flex items-center gap-2 text-sm text-amber-800"><KeyRound className="size-4" />No key saved yet — researcher metrics are hidden until you add one.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="API key" hint="Create one at dev.elsevier.com → My API Key, signed in with a DMU email. Stored privately, never shown on the website.">
            <input name="api_key" type="password" autoComplete="off" placeholder={hasKey ? '•••••••••••• (saved)' : 'Paste your Scopus API key'} className={inputCls} />
          </Field>
          <Field label="Institutional token (optional)" hint="Only if Elsevier or the DMU library gave you one. It unlocks full access from outside the campus network.">
            <input name="insttoken" type="password" autoComplete="off" placeholder={hasToken ? '•••••••••••• (saved)' : 'Optional'} className={inputCls} />
          </Field>
          <Field label="DMU Scopus affiliation IDs" hint="Leave as is. These are DMU's institution profiles in Scopus, separated by commas.">
            <input name="affiliations" defaultValue={affiliations} className={inputCls} />
          </Field>
        </div>
      </Card>
      {state && <p className={`text-sm ${state.ok ? 'text-emerald-700' : 'text-red-700'}`}>{state.ok ? (state.found ? `Saved. The key works — Scopus lists ${state.found.toLocaleString('en')} DMU publications.` : 'Saved.') : state.error}</p>}
      <div className="flex gap-3">
        <button disabled={pending} className="btn btn-dark !py-2.5">{pending ? 'Testing & saving…' : 'Save'}</button>
        {hasKey && <button name="remove" value="1" disabled={pending} className="btn btn-outline !py-2.5">Remove key</button>}
      </div>
    </form>
  );
}
