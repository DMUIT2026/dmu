import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const btn = 'grid size-11 place-items-center rounded-full border text-sm font-medium transition';
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2">
      {page > 1 && <Link href={href(page - 1)} className={`${btn} border-line bg-white hover:border-gold-500`} aria-label="Previous page"><ChevronLeft className="size-4 flip-rtl" /></Link>}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-stone-500">…</span>}
          <Link href={href(n)} aria-current={n === page ? 'page' : undefined} className={`${btn} ${n === page ? 'border-espresso bg-espresso text-white' : 'border-line bg-white hover:border-gold-500'}`}>{n}</Link>
        </span>
      ))}
      {page < pages && <Link href={href(page + 1)} className={`${btn} border-line bg-white hover:border-gold-500`} aria-label="Next page"><ChevronRight className="size-4 flip-rtl" /></Link>}
    </nav>
  );
}
