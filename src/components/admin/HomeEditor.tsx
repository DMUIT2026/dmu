'use client';
import { useState, useTransition } from 'react';
import { Plus, X } from 'lucide-react';
import { ImageField } from './MediaPicker';
import { Card, Field, inputCls, LangTabs, PageTitle, Toast } from './ui';
import { saveSetting } from '@/app/admin/actions';
import type { Settings } from '@/lib/types';

export default function HomeEditor({ initial, initialAr }: { initial: Settings; initialAr: Settings }) {
  const [en, setEn] = useState<Settings>(initial);
  const [arS, setAr] = useState<Settings>(initialAr);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const s = lang === 'en' ? en : arS;
  const setS = lang === 'en' ? setEn : setAr;
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const save = () => start(async () => {
    const keys: (keyof Settings)[] = ['home_hero', 'home_intro', 'home_stats', 'home_colleges', 'home_alumni', 'contact', 'social', 'portal_links'];
    for (const k of keys) {
      const r1 = await saveSetting(k, en[k]); if (!r1.ok) { setToast(r1.error ?? 'Error'); return; }
      // Arabic copy: text in Arabic; pictures, links and numbers follow the English version
      const merged = k === 'home_hero' ? { ...arS.home_hero, slides: en.home_hero.slides }
        : k === 'home_intro' ? { ...arS.home_intro, image: en.home_intro?.image, link: en.home_intro?.link }
        : k === 'home_alumni' ? { ...arS.home_alumni, logos: en.home_alumni.logos }
        : k === 'contact' ? { ...en.contact, address: arS.contact?.address ?? en.contact.address }
        : k === 'social' ? en.social : arS[k];
      const r2 = await saveSetting(k + '_ar', merged); if (!r2.ok) { setToast(r2.error ?? 'Error'); return; }
    }
    setToast('Saved — the website is updated.'); setTimeout(() => setToast(null), 3000);
  });
  const hero = s.home_hero, intro = s.home_intro ?? { title: '', text: '' }, stats = s.home_stats, alumni = s.home_alumni;
  return (
    <>
      <PageTitle title="Home page & contact" subtitle="The main banner, introduction, key numbers, partner logos and contact details." actions={<button disabled={pending} onClick={save} className="btn btn-dark !py-2.5">{pending ? 'Saving…' : 'Save changes'}</button>} />
      <LangTabs lang={lang} setLang={setLang} />
      {lang === 'ar' && <p className="mb-4 rounded-xl bg-sand-100 p-3 text-sm">You are editing the Arabic texts. Photos, logos and links are shared with the English version.</p>}
      <div className="grid gap-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Card title="Main banner">
          <div className="grid gap-4">
            <Field label="Small line above the headline"><input value={hero.eyebrow ?? ''} onChange={e => setS({ ...s, home_hero: { ...hero, eyebrow: e.target.value } })} className={inputCls} /></Field>
            <Field label="Headline"><input value={hero.title ?? ''} onChange={e => setS({ ...s, home_hero: { ...hero, title: e.target.value } })} className={`${inputCls} font-display !text-lg`} /></Field>
            <Field label="Text under the headline"><textarea rows={2} value={hero.text ?? ''} onChange={e => setS({ ...s, home_hero: { ...hero, text: e.target.value } })} className={inputCls} /></Field>
            <p className="text-sm font-medium">Background photos (they rotate)</p>
            <div className="grid gap-4 md:grid-cols-2">
              {hero.slides.map((sl, i) => (
                <div key={i} className="relative rounded-xl border border-line p-3">
                  <ImageField label={`Photo ${i + 1}`} value={sl.image} onChange={v => setS({ ...s, home_hero: { ...hero, slides: hero.slides.map((x, j) => j === i ? { ...x, image: v ?? '' } : x) } })} />
                  <button onClick={() => setS({ ...s, home_hero: { ...hero, slides: hero.slides.filter((_, j) => j !== i) } })} className="absolute right-2 top-2 p-1 text-stone-500 hover:text-red-700" aria-label="Remove"><X className="size-4" /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setS({ ...s, home_hero: { ...hero, slides: [...hero.slides, { image: '' }] } })} className="inline-flex items-center gap-1 text-sm text-bronze-700"><Plus className="size-4" />Add photo</button>
          </div>
        </Card>
        <Card title="About section">
          <div className="grid gap-4 md:grid-cols-[1fr_260px]">
            <div className="grid gap-4">
              <Field label="Label"><input value={intro.title} onChange={e => setS({ ...s, home_intro: { ...intro, title: e.target.value } })} className={inputCls} /></Field>
              <Field label="Text"><textarea rows={6} value={intro.text} onChange={e => setS({ ...s, home_intro: { ...intro, text: e.target.value } })} className={inputCls} /></Field>
            </div>
            <ImageField label="Photo" value={intro.image} onChange={v => setS({ ...s, home_intro: { ...intro, image: v ?? undefined } })} />
          </div>
        </Card>
        <Card title="Key numbers">
          <div className="grid gap-2">
            {stats.items.map((st, i) => (
              <div key={i} className="flex gap-2">
                <input value={st.value} onChange={e => setS({ ...s, home_stats: { ...stats, items: stats.items.map((x, j) => j === i ? { ...x, value: e.target.value } : x) } })} className={`${inputCls} max-w-28`} placeholder="52+" />
                <input value={st.label} onChange={e => setS({ ...s, home_stats: { ...stats, items: stats.items.map((x, j) => j === i ? { ...x, label: e.target.value } : x) } })} className={inputCls} placeholder="Nationalities" />
                <button onClick={() => setS({ ...s, home_stats: { ...stats, items: stats.items.filter((_, j) => j !== i) } })} className="p-2 text-stone-500 hover:text-red-700" aria-label="Remove"><X className="size-4" /></button>
              </div>
            ))}
            <button onClick={() => setS({ ...s, home_stats: { ...stats, items: [...stats.items, { value: '', label: '' }] } })} className="inline-flex items-center gap-1 text-sm text-bronze-700"><Plus className="size-4" />Add number</button>
          </div>
        </Card>
        <Card title="Where DMU alumni work (logos)">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {alumni.logos.map((l, i) => (
              <div key={i} className="relative rounded-xl border border-line p-2">
                <ImageField label="" value={l} onChange={v => setS({ ...s, home_alumni: { ...alumni, logos: alumni.logos.map((x, j) => j === i ? v ?? '' : x) } })} />
                <button onClick={() => setS({ ...s, home_alumni: { ...alumni, logos: alumni.logos.filter((_, j) => j !== i) } })} className="absolute right-1 top-1 p-1 text-stone-500 hover:text-red-700" aria-label="Remove"><X className="size-4" /></button>
              </div>
            ))}
          </div>
          <button onClick={() => setS({ ...s, home_alumni: { ...alumni, logos: [...alumni.logos, ''] } })} className="mt-3 inline-flex items-center gap-1 text-sm text-bronze-700"><Plus className="size-4" />Add logo</button>
        </Card>
        <Card title="Contact details (footer & contact page)">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Phone (as shown)"><input value={s.contact.phone} onChange={e => setS({ ...s, contact: { ...s.contact, phone: e.target.value } })} className={inputCls} /></Field>
            <Field label="Phone number to dial" hint="e.g. tel:8003681"><input value={s.contact.phone_link} onChange={e => setS({ ...s, contact: { ...s.contact, phone_link: e.target.value } })} className={inputCls} /></Field>
            <Field label="Email"><input value={s.contact.email} onChange={e => setS({ ...s, contact: { ...s.contact, email: e.target.value } })} className={inputCls} /></Field>
            <Field label="Address"><textarea rows={2} value={s.contact.address} onChange={e => setS({ ...s, contact: { ...s.contact, address: e.target.value } })} className={inputCls} /></Field>
          </div>
          <p className="mt-6 mb-2 text-sm font-medium">Social media links</p>
          <div className="grid gap-2">
            {s.social.map((so, i) => (
              <div key={i} className="flex gap-2">
                <input value={so.label} onChange={e => setS({ ...s, social: s.social.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} className={`${inputCls} max-w-40`} />
                <input value={so.url} onChange={e => setS({ ...s, social: s.social.map((x, j) => j === i ? { ...x, url: e.target.value } : x) })} className={inputCls} />
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Toast msg={toast} kind="ok" />
    </>
  );
}
