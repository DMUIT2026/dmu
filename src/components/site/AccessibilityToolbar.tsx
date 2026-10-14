'use client';
import { useEffect, useState } from 'react';
import { Accessibility, Contrast, Link2, Minus, Pause, Plus, RotateCcw, Type, X, AlignJustify } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type Prefs = { size: number; contrast: boolean; links: boolean; font: boolean; spacing: boolean; still: boolean };
const DEFAULT: Prefs = { size: 0, contrast: false, links: false, font: false, spacing: false, still: false };
const KEY = 'dmu-a11y';

const TXT = {
  en: { open: 'Accessibility options', title: 'Accessibility', size: 'Text size', contrast: 'High contrast', links: 'Underline links', font: 'Easy-to-read font', spacing: 'More line spacing', still: 'Stop animations', reset: 'Reset', close: 'Close' },
  ar: { open: 'خيارات إمكانية الوصول', title: 'إمكانية الوصول', size: 'حجم النص', contrast: 'تباين عالٍ', links: 'تسطير الروابط', font: 'خط سهل القراءة', spacing: 'تباعد أكبر بين الأسطر', still: 'إيقاف الحركة', reset: 'إعادة الضبط', close: 'إغلاق' },
};

export function applyPrefs(p: Prefs) {
  const h = document.documentElement;
  h.style.fontSize = p.size ? `${100 + p.size * 12.5}%` : '';
  h.classList.toggle('a11y-contrast', p.contrast);
  h.classList.toggle('a11y-links', p.links);
  h.classList.toggle('a11y-font', p.font);
  h.classList.toggle('a11y-spacing', p.spacing);
  h.classList.toggle('a11y-still', p.still);
}

/** Applied before the page shows, so there is no flash when someone has saved preferences. */
export const a11yBootScript = `try{var p=JSON.parse(localStorage.getItem('${KEY}')||'null');if(p){var h=document.documentElement;if(p.size)h.style.fontSize=(100+p.size*12.5)+'%';['contrast','links','font','spacing','still'].forEach(function(k){if(p[k])h.classList.add('a11y-'+k)})}}catch(e){}`;

export default function AccessibilityToolbar({ locale }: { locale: Locale }) {
  const t = TXT[locale];
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<Prefs>(DEFAULT);
  useEffect(() => { try { const s = localStorage.getItem(KEY); if (s) setP({ ...DEFAULT, ...JSON.parse(s) }); } catch { /* private mode */ } }, []);
  const update = (next: Prefs) => { setP(next); applyPrefs(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ } };
  useEffect(() => { const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc); }, []);

  const toggle = (k: keyof Omit<Prefs, 'size'>, label: string, Icon: typeof Contrast) => (
    <button type="button" role="switch" aria-checked={p[k]} onClick={() => update({ ...p, [k]: !p[k] })}
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-start text-sm transition ${p[k] ? 'border-espresso bg-espresso text-white' : 'border-line bg-white text-ink hover:border-gold-500'}`}>
      <Icon className="size-4 shrink-0" />{label}
    </button>
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="a11y-panel" aria-label={t.open} title={t.open}
        className="fixed bottom-5 end-5 z-[55] grid size-12 place-items-center rounded-full bg-espresso text-white shadow-[var(--shadow-lift)] ring-2 ring-white transition hover:bg-bronze-800 focus-visible:ring-gold-500">
        <Accessibility className="size-6" />
      </button>
      {open && (
        <div id="a11y-panel" role="dialog" aria-label={t.title} className="fixed bottom-20 end-5 z-[56] w-[min(340px,calc(100vw-2.5rem))] rounded-2xl border border-line bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-ink">{t.title}</p>
            <button type="button" onClick={() => setOpen(false)} aria-label={t.close} className="grid size-8 place-items-center rounded-full hover:bg-sand-100"><X className="size-4" /></button>
          </div>
          <div className="mb-3 flex items-center justify-between rounded-xl border border-line px-3 py-2">
            <span className="flex items-center gap-2 text-sm text-ink"><Type className="size-4" />{t.size}</span>
            <span className="flex items-center gap-1">
              <button type="button" aria-label="−" disabled={p.size <= -1} onClick={() => update({ ...p, size: p.size - 1 })} className="grid size-8 place-items-center rounded-full border border-line disabled:opacity-30"><Minus className="size-4" /></button>
              <span className="w-10 text-center text-sm tabular-nums">{100 + p.size * 12.5}%</span>
              <button type="button" aria-label="+" disabled={p.size >= 3} onClick={() => update({ ...p, size: p.size + 1 })} className="grid size-8 place-items-center rounded-full border border-line disabled:opacity-30"><Plus className="size-4" /></button>
            </span>
          </div>
          <div className="grid gap-2">
            {toggle('contrast', t.contrast, Contrast)}
            {toggle('links', t.links, Link2)}
            {toggle('font', t.font, Type)}
            {toggle('spacing', t.spacing, AlignJustify)}
            {toggle('still', t.still, Pause)}
          </div>
          <button type="button" onClick={() => update(DEFAULT)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-stone-500 hover:bg-sand-100"><RotateCcw className="size-4" />{t.reset}</button>
        </div>
      )}
    </>
  );
}
