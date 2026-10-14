import { NextResponse } from 'next/server';
import { searchPublications } from '@/lib/scopus';

// DMU publications from Scopus for the publications pages (cached for a day).
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  try {
    const data = await searchPublications({ college: p.get('college') ?? undefined, year: p.get('year') ?? undefined, start: Number(p.get('start') ?? 0) });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' } });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
