'use client';
import { useActionState } from 'react';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { saveTranslationSettings } from '@/app/admin/actions';
import { Card, Field, inputCls } from './ui';

export default function TranslationForm({ hasKey, keyHint, model, auto }: { hasKey: boolean; keyHint: string; model: string; auto: boolean }) {
  const [state, action, pending] = useActionState(saveTranslationSettings, null);
  return (
    <form action={action} className="grid gap-6">
      <Card title="Gemini API key">
        {hasKey
          ? <p className="mb-4 flex items-center gap-2 text-sm text-emerald-800"><CheckCircle2 className="size-4" />A key is saved (ending in {keyHint}). Paste a new one below only to replace it.</p>
          : <p className="mb-4 flex items-center gap-2 text-sm text-amber-800"><KeyRound className="size-4" />No key saved yet — automatic translation is off until you add one.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="API key" hint="Create one at aistudio.google.com → Get API key. It is stored privately and never shown on the website.">
            <input name="api_key" type="password" autoComplete="off" placeholder={hasKey ? '•••••••••••• (saved)' : 'Paste your Gemini API key'} className={inputCls} />
          </Field>
          <Field label="Model" hint="Leave as is unless you want a different Gemini model.">
            <input name="model" defaultValue={model} className={inputCls} />
          </Field>
        </div>
        <label className="mt-5 flex items-center gap-2 text-sm"><input type="checkbox" name="auto" defaultChecked={auto} />Translate automatically to Arabic whenever English content is saved</label>
      </Card>
      {state && <p className={`text-sm ${state.ok ? 'text-emerald-700' : 'text-red-700'}`}>{state.ok ? 'Saved. The key was tested and works.' : state.error}</p>}
      <div className="flex gap-3">
        <button disabled={pending} className="btn btn-dark !py-2.5">{pending ? 'Testing & saving…' : 'Save'}</button>
        {hasKey && <button name="remove" value="1" disabled={pending} className="btn btn-outline !py-2.5">Remove key</button>}
      </div>
    </form>
  );
}
