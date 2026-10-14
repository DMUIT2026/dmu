import Link from 'next/link';
import Header from '@/components/site/Header';

export default function NotFound() {
  return (
    <>
      <Header />
      <section className="container-x flex min-h-[70vh] flex-col items-start justify-center pt-32 pb-20">
        <p className="eyebrow">Error 404</p>
        <h1 className="font-display mt-4 text-5xl md:text-6xl">This page could not be found.</h1>
        <p className="mt-4 max-w-xl text-lg text-stone-500">It may have moved when we refreshed our website. Try searching, or head back to the home page.</p>
        <div className="mt-8 flex gap-3"><Link href="/" className="btn btn-dark">Go home</Link><Link href="/search" className="btn btn-outline">Search</Link></div>
      </section>
    </>
  );
}
