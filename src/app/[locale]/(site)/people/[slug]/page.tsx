import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import Header from '@/components/site/Header';
import RichText from '@/components/site/RichText';
import ScopusAuthorPanel from '@/components/site/ScopusAuthorPanel';
import { splitForScopus } from '@/components/site/ResearchProfile';
import { Suspense } from 'react';
import { getPerson } from '@/lib/content';
import { collegeName, isLocale, lhref, pick, t, type Locale } from '@/lib/i18n';

export const revalidate = 300;
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params; const l: Locale = isLocale(locale) ? locale : 'en';
  const p = await getPerson(slug);
  return p ? { title: pick(p, 'name', l), description: pick(p, 'title', l) || undefined } : {};
}

export default async function PersonPage({ params }: Props) {
  const { slug, locale: lc } = await params;
  const locale: Locale = isLocale(lc) ? lc : 'en';
  const p = await getPerson(slug);
  if (!p) notFound();
  const bio = p.scopus_author_id ? splitForScopus(pick(p, 'bio', locale)) : [pick(p, 'bio', locale), ''];
  return (
    <>
      <Header locale={locale} />
      <section className="bg-sand-100/70 pt-36 pb-14 md:pt-44">
        <div className="container-x">
          <Link href={lhref(locale, '/dmu-faculty-and-staff-directory')} className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-ink"><ArrowLeft className="size-4 flip-rtl" /> {t(locale, 'directoryBack')}</Link>
          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end">
            <div className="relative size-44 shrink-0 overflow-hidden rounded-[1.75rem] bg-white shadow-[var(--shadow-lift)] md:size-52">
              {p.photo && <Image src={p.photo} alt={p.name} fill priority sizes="208px" className="object-cover object-top" />}
            </div>
            <div>
              {p.college && <p className="eyebrow">{collegeName(p.college, locale)}</p>}
              <h1 className="font-display mt-3 text-4xl font-medium md:text-5xl">{pick(p, 'name', locale)}</h1>
              {p.title && <p className="mt-3 text-lg text-ink/75">{pick(p, 'title', locale)}</p>}
              <div className="mt-5 flex flex-wrap gap-3">
                {p.email && <a href={`mailto:${p.email}`} className="ltr btn btn-outline !py-2"><Mail className="size-4" />{p.email}</a>}
                {p.phone && <a href={`tel:${p.phone}`} className="ltr btn btn-outline !py-2"><Phone className="size-4" />{p.phone}</a>}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container-x max-w-4xl py-14 md:py-20"><RichText html={bio[0]} locale={locale} /><Suspense fallback={null}><ScopusAuthorPanel authorId={p.scopus_author_id} locale={locale} /></Suspense>{bio[1] && <RichText html={bio[1]} locale={locale} className="mt-12" />}</section>
    </>
  );
}
