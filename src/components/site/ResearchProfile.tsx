import Image from 'next/image';
import { Suspense } from 'react';
import { Mail, Phone } from 'lucide-react';
import RichText from './RichText';
import ScopusAuthorPanel from './ScopusAuthorPanel';
import type { Locale } from '@/lib/i18n';

/**
 * A research profile page (research/<name>): the photo card becomes a wide header, and when the person
 * has a Scopus Author ID the hand-typed publications list is replaced by the live Scopus box.
 */
interface Head { photo?: string; name: string; lines: string[]; html?: string }
const PUBS = /<h[2-4][^>]*>\s*(?:Research Publications|Publications|المنشورات البحثية|المنشورات)\s*<\/h[2-4]>[\s\S]*?(?=<h[2-4][\s>]|$)/i;
const text = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();

function parseHead(html: string): { head: Head | null; rest: string } {
  // <div class="cards"><div class="card"><img><strong>…</strong><span>name<br>title<br>Ext<br>email</span></div></div>
  const card = html.match(/^\s*<div class="cards"><div class="card">([\s\S]*?)<\/div><\/div>/);
  if (card && !/<div class="card">/.test(html.slice(card[0].length, card[0].length + 40))) {
    const photo = card[1].match(/<img[^>]*src="([^"]+)"/)?.[1];
    const lines = (card[1].match(/<span>([\s\S]*?)<\/span>/)?.[1] ?? '').split(/<br\s*\/?>/).map(text).filter(Boolean);
    const name = lines.shift() ?? text(card[1].match(/<strong>([\s\S]*?)<\/strong>/)?.[1] ?? '');
    return { head: { photo, name, lines }, rest: html.slice(card[0].length) };
  }
  // <figure><img></figure><h4>Name</h4><p>…</p>… up to the first section heading
  const fig = html.match(/^\s*<figure>\s*<img[^>]*src="([^"]+)"[^>]*>\s*<\/figure>\s*<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>([\s\S]*?)(?=<h3[\s>])/);
  if (fig) return { head: { photo: fig[1], name: text(fig[2]), lines: [], html: fig[3] }, rest: html.slice(fig[0].length) };
  return { head: null, rest: html };
}

export default function ResearchProfile({ html, authorId, locale }: { html: string; authorId?: string; locale: Locale }) {
  const { head, rest } = parseHead(html);
  const hasScopus = !!authorId && /^\d{6,}$/.test(authorId);
  const m = hasScopus ? rest.match(PUBS) : null;
  const before = m ? rest.slice(0, m.index) : rest;
  const after = m ? rest.slice(m.index! + m[0].length) : '';
  const panel = hasScopus ? <Suspense fallback={null}><ScopusAuthorPanel authorId={authorId} locale={locale} /></Suspense> : null;
  return (
    <>
      {head && (
        <header className="not-prose mb-12 flex flex-col gap-6 overflow-hidden rounded-[var(--radius-card)] border border-line bg-white sm:flex-row sm:items-stretch">
          {head.photo && (
            <div className="relative aspect-square w-full shrink-0 bg-sand-100 sm:aspect-auto sm:min-h-64 sm:w-60">
              <Image src={head.photo} alt={head.name} fill sizes="(min-width: 640px) 240px, 100vw" className="object-cover object-top" />
            </div>
          )}
          <div className="flex flex-col justify-center gap-2 px-6 pb-6 sm:py-8 sm:pe-8 sm:ps-0">
            <h2 className="font-display text-3xl leading-tight md:text-4xl">{head.name}</h2>
            {head.lines.filter(l => !/@|^ext|^tel|^\+?\d[\d\s-]{5,}$|تحويلة/i.test(l)).map(l => <p key={l} className="text-lg text-ink/75">{l}</p>)}
            {head.html && <RichText html={head.html} locale={locale} className="!text-base [&_p]:!my-1" />}
            <div className="mt-3 flex flex-wrap gap-2">
              {head.lines.filter(l => /@/.test(l)).map(l => <a key={l} href={`mailto:${l}`} className="ltr btn btn-outline !py-2 !text-sm"><Mail className="size-4" />{l}</a>)}
              {head.lines.filter(l => /^ext|تحويلة|^\+?\d[\d\s-]{5,}$/i.test(l)).map(l => <span key={l} className="ltr inline-flex items-center gap-2 rounded-full bg-sand-100 px-4 py-2 text-sm"><Phone className="size-4" />{l}</span>)}
            </div>
          </div>
        </header>
      )}
      <RichText html={before} locale={locale} />
      {panel}
      {after && <RichText html={after} locale={locale} className="mt-12" />}
    </>
  );
}
