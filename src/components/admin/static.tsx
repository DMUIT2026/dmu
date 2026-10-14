// Server-safe versions of small admin UI pieces
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export function PageTitleStatic({ title, subtitle, back, actions }: { title: string; subtitle?: string; back?: string; actions?: React.ReactNode }) {
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

export function Badge({ status }: { status: string }) {
  return status === 'published'
    ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"><span className="size-1.5 rounded-full bg-emerald-600" />Published</span>
    : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"><span className="size-1.5 rounded-full bg-amber-500" />Draft</span>;
}

export function SearchBar({ q, placeholder, children }: { q?: string; placeholder: string; children?: React.ReactNode }) {
  return (
    <form className="mb-5 flex flex-wrap gap-2">
      <input name="q" defaultValue={q} placeholder={placeholder} className="min-w-60 flex-1 rounded-xl border border-line bg-white px-4 py-2.5 outline-none focus:border-gold-500" />
      {children}
      <button className="btn btn-dark !py-2.5">Search</button>
    </form>
  );
}

export function Pager({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null;
  const link = (p: number) => `${base}${base.includes('?') ? '&' : '?'}page=${p}`;
  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      <span className="text-stone-500">Page {page} of {pages}</span>
      <div className="flex gap-2">
        {page > 1 && <Link href={link(page - 1)} className="btn btn-outline !py-2">Previous</Link>}
        {page < pages && <Link href={link(page + 1)} className="btn btn-outline !py-2">Next</Link>}
      </div>
    </div>
  );
}
