import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Mail, MapPin, Phone } from 'lucide-react';
import Header from '@/components/site/Header';
import PageHero, { type Crumb } from '@/components/site/PageHero';
import RichText from '@/components/site/RichText';
import CollegeNav from '@/components/site/CollegeNav';
import SideNav from '@/components/site/SideNav';
import NewsList from '@/components/site/NewsList';
import Directory from '@/components/site/Directory';
import ContactForm from '@/components/site/ContactForm';
import { getAllPagePaths, getDirectory, getMenu, getPage, getSettings } from '@/lib/content';
import type { MenuGroup } from '@/lib/types';
import { isLocale, label as lbl, locales, pick, t, type Locale } from '@/lib/i18n';
import { stripHtml, truncate } from '@/lib/format';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  if (process.env.SKIP_PRERENDER) return [];
  try {
    const paths = await getAllPagePaths();
    return locales.flatMap(locale => paths.filter(Boolean).map(p => ({ locale, path: p.split('/') })));
  } catch {
    return []; // pages are then built on first visit
  }
}

type Props = { params: Promise<{ locale: string; path: string[] }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path, locale: lc } = await params;
  const l: Locale = isLocale(lc) ? lc : 'en';
  const p = path.map(decodeURIComponent).join('/');
  const page = await getPage(p);
  if (!page) return {};
  return {
    title: pick(page, 'title', l),
    description: pick(page, 'seo_description', l) || truncate(stripHtml(pick(page, 'content', l)), 160),
    openGraph: { images: page.hero_image ? [page.hero_image] : undefined },
    alternates: { languages: { en: '/' + p, ar: '/ar/' + p } },
  };
}

async function crumbsFor(path: string, title: string, l: Locale): Promise<Crumb[]> {
  const parts = path.split('/');
  const crumbs: Crumb[] = [];
  for (let i = 1; i < parts.length; i++) {
    const p = parts.slice(0, i).join('/');
    const parent = await getPage(p);
    if (parent) crumbs.push({ label: pick(parent, 'title', l), href: '/' + p });
  }
  crumbs.push({ label: title });
  return crumbs;
}

export default async function CmsPage({ params, searchParams }: Props) {
  const { path: segs, locale: lc } = await params;
  const locale: Locale = isLocale(lc) ? lc : 'en';
  const path = segs.map(decodeURIComponent).join('/');
  const page = await getPage(path);
  if (!page) notFound();
  const sp = await searchParams;
  const title = pick(page, 'title', locale);
  const content = pick(page, 'content', locale);
  const [college, side, crumbs] = await Promise.all([
    page.meta?.collegenav ? getMenu(page.meta.collegenav) : null,
    page.meta?.sidenav ? getMenu(page.meta.sidenav) : null,
    crumbsFor(path, title, locale),
  ]);
  const facts = (locale === 'ar' && page.meta_ar?.facts?.length ? page.meta_ar.facts : page.meta?.facts) ?? [];
  const hasSide = !!side && (side.items as MenuGroup[]).length > 0;

  let body: React.ReactNode = <RichText html={content} locale={locale} />;
  if (page.template === 'news') {
    body = (
      <>
        {content && <RichText html={content} locale={locale} className="mb-10" />}
        <NewsList locale={locale} categories={page.meta.categories} page={Math.max(1, Number(sp.page) || 1)} basePath={'/' + path} showChips={false} />
      </>
    );
  } else if (page.template === 'directory') {
    const people = await getDirectory();
    body = <Directory people={people} locale={locale} />;
  } else if (page.template === 'contact') {
    const s = await getSettings(locale);
    body = (
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <RichText html={content} locale={locale} />
          <ul className="space-y-4">
            <li className="flex gap-4 rounded-2xl border border-line bg-white p-5"><Phone className="size-5 text-bronze-600" /><a href={s.contact.phone_link} className="ltr font-medium">{s.contact.phone}</a></li>
            <li className="flex gap-4 rounded-2xl border border-line bg-white p-5"><Mail className="size-5 text-bronze-600" /><a href={`mailto:${s.contact.email}`} className="font-medium">{s.contact.email}</a></li>
            <li className="flex gap-4 rounded-2xl border border-line bg-white p-5"><MapPin className="size-5 text-bronze-600" /><span className="whitespace-pre-line font-medium">{s.contact.address}</span></li>
          </ul>
          {s.contact.map_embed && <iframe src={s.contact.map_embed} title="Map" loading="lazy" className="aspect-[4/3] w-full rounded-[var(--radius-card)] border border-line" />}
        </div>
        <ContactForm locale={locale} />
      </div>
    );
  }

  const wide = page.template === 'news' || page.template === 'directory' || page.template === 'contact' || /class="cards"/.test(content);
  return (
    <>
      <Header overlay locale={locale} />
      <PageHero locale={locale} title={title} image={page.hero_image} crumbs={crumbs} subtitle={pick(page, 'subtitle', locale) || null}
        eyebrow={page.template === 'program' ? t(locale, 'programme') : page.section && college ? lbl({ title: college.title ?? '', title_ar: college.title_ar }, locale).replace(/\s*\(.*\)/, '') : undefined} />
      {college && <CollegeNav locale={locale} title={lbl({ title: college.title ?? '', title_ar: college.title_ar }, locale)} url={college.url} groups={college.items as MenuGroup[]} />}
      {facts.length > 0 && (
        <div className={`container-x relative z-10 mb-2 ${college ? "mt-10" : "-mt-10"}`}>
          <dl className="grid overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-lift)] sm:grid-cols-2 lg:grid-cols-4">
            {facts.map(f => (
              <div key={f.label} className="border-b border-line p-6 sm:border-r last:border-0">
                <dt className="text-xs font-semibold uppercase tracking-widest text-bronze-600">{f.label}</dt>
                <dd className="font-display mt-2 text-xl leading-snug">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <section className="container-x py-14 md:py-20">
        {hasSide ? (
          <div className="grid gap-10 lg:grid-cols-[290px_1fr] lg:gap-14">
            <aside className="order-2 lg:order-1"><SideNav locale={locale} groups={side!.items as MenuGroup[]} /></aside>
            <div className="order-1 min-w-0 lg:order-2">{body}</div>
          </div>
        ) : (
          <div className={wide ? '' : 'mx-auto max-w-[860px]'}>{body}</div>
        )}
      </section>
    </>
  );
}
