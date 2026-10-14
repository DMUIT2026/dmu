'use client';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const inputCls = 'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[.95rem] outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-200/60';

export function PageTitle({ title, subtitle, back, actions }: { title: string; subtitle?: string; back?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {back && <Link href={back} className="mb-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-ink"><ChevronLeft className="size-4" />Back</Link>}
        <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-stone-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 md:p-6 ${className}`}>
      {title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-bronze-600">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return status === 'published'
    ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"><span className="size-1.5 rounded-full bg-emerald-600" />Published</span>
    : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"><span className="size-1.5 rounded-full bg-amber-500" />Draft</span>;
}

export function Toast({ msg, kind }: { msg: string | null; kind: 'ok' | 'error' }) {
  if (!msg) return null;
  return <div role="status" className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm shadow-lg ${kind === 'ok' ? 'bg-espresso text-white' : 'bg-red-700 text-white'}`}>{msg}</div>;
}

/** English / Arabic switch used in the editors. */
export function LangTabs({ lang, setLang, arStatus }: { lang: 'en' | 'ar'; setLang: (l: 'en' | 'ar') => void; arStatus?: string }) {
  const b = (l: 'en' | 'ar', text: string) => (
    <button type="button" onClick={() => setLang(l)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${lang === l ? 'bg-espresso text-white' : 'text-ink/70 hover:bg-sand-100'}`}>{text}</button>
  );
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-full border border-line bg-white p-1">{b('en', 'English')}{b('ar', 'العربية')}</div>
      {arStatus === 'needs_review' && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">Arabic: needs review</span>}
      {arStatus === 'reviewed' && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">Arabic: checked</span>}
    </div>
  );
}

export function savedMessage(base: string, r: { translated?: number; warning?: string }) {
  if (r.warning) return `${base} Arabic not updated: ${r.warning}`;
  if (r.translated) return `${base} Arabic translated automatically.`;
  return base;
}
