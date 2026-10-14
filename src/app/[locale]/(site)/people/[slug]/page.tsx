import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import Header from '@/components/site/Header';
import RichText from '@/components/site/RichText';
import { getPerson } from '@/lib/content';

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPerson((await params).slug);
  return p ? { title: p.name, description: p.title ?? undefined } : {};
}

export default async function PersonPage({ params }: Props) {
  const p = await getPerson((await params).slug);
  if (!p) notFound();
  return (
    <>
      <Header />
      <section className="bg-sand-100/70 pt-36 pb-14 md:pt-44">
        <div className="container-x">
          <Link href="/dmu-faculty-and-staff-directory" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-ink"><ArrowLeft className="size-4" /> Faculty and Staff Directory</Link>
          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end">
            <div className="relative size-44 shrink-0 overflow-hidden rounded-[1.75rem] bg-white shadow-[var(--shadow-lift)] md:size-52">
              {p.photo && <Image src={p.photo} alt={p.name} fill priority sizes="208px" className="object-cover object-top" />}
            </div>
            <div>
              {p.college && <p className="eyebrow">{p.college.replace(/\b(Of|And)\b/g, m => m.toLowerCase())}</p>}
              <h1 className="font-display mt-3 text-4xl font-medium md:text-5xl">{p.name}</h1>
              {p.title && <p className="mt-3 text-lg text-ink/75">{p.title}</p>}
              <div className="mt-5 flex flex-wrap gap-3">
                {p.email && <a href={`mailto:${p.email}`} className="btn btn-outline !py-2"><Mail className="size-4" />{p.email}</a>}
                {p.phone && <a href={`tel:${p.phone}`} className="btn btn-outline !py-2"><Phone className="size-4" />{p.phone}</a>}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container-x max-w-4xl py-14 md:py-20"><RichText html={p.bio} /></section>
    </>
  );
}
