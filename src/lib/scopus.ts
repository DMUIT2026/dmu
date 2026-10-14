import 'server-only';
import { adminClient } from './supabase/admin';

/**
 * Live research data from Elsevier Scopus, using the API key the DMU team saves in Admin → Research (Scopus).
 * Answers are cached for a day, so the website stays fast and within Scopus limits.
 */
export const DEFAULT_AFFILIATIONS = '60290997,60356322,60356425,60356608';
const DAY = 60 * 60 * 24;
// The DMU research office's existing service, used while no key is saved (publication lists only).
const PROXY = 'https://research.dmu.ae/home/dmuhon/resket/centeral-chimica-proxy.php';

/** College filter values (kept from the research office's service) → extra Scopus conditions. */
export const COLLEGE_QUERY: Record<string, string> = {
  'Dubai Medical University': '',
  'Dubai Medical College': 'AFFIL("Dubai Medical College") OR AFFIL("Dubai Medical University College of Medicine")',
  'Dubai Pharmacy College': 'AFFIL("Dubai Pharmacy College") OR AFFIL("Dubai Medical University College of Pharmacy")',
  'College of Nursing': 'AFFIL("Dubai Medical University College of Nursing")',
};

export interface ScopusConfig { apiKey: string; instToken: string; affiliations: string }
export async function scopusConfig(): Promise<ScopusConfig> {
  try {
    const { data } = await adminClient().from('private_settings').select('key,value').in('key', ['scopus_api_key', 'scopus_insttoken', 'scopus_affiliations']);
    const m = Object.fromEntries((data ?? []).map(r => [r.key, String(r.value ?? '')]));
    return { apiKey: m.scopus_api_key || '', instToken: m.scopus_insttoken || '', affiliations: m.scopus_affiliations || DEFAULT_AFFILIATIONS };
  } catch {
    return { apiKey: '', instToken: '', affiliations: DEFAULT_AFFILIATIONS };
  }
}

async function elsevier(path: string, params: Record<string, string>, cfg: Pick<ScopusConfig, 'apiKey' | 'instToken'>, cache = true) {
  const url = new URL('https://api.elsevier.com' + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'X-ELS-APIKey': cfg.apiKey, ...(cfg.instToken ? { 'X-ELS-Insttoken': cfg.instToken } : {}) },
    ...(cache ? { next: { revalidate: DAY, tags: ['scopus'] } } : { cache: 'no-store' as const }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.['service-error']) {
    const detail = body?.['service-error']?.status?.statusText ?? body?.['error-response']?.['error-message'] ?? `HTTP ${res.status}`;
    throw new Error(`Scopus did not accept the request (${detail}).`);
  }
  return body;
}

const affQuery = (ids: string) => ids.split(',').map(s => s.trim()).filter(Boolean).map(id => `AF-ID(${id})`).join(' OR ');

/** Checks a key before it is saved. Returns how many DMU publications Scopus finds. */
export async function testScopusKey(cfg: ScopusConfig) {
  const body = await elsevier('/content/search/scopus', { query: affQuery(cfg.affiliations), count: '1' }, cfg, false);
  return Number(body?.['search-results']?.['opensearch:totalResults'] ?? 0);
}

/** One page of DMU publications, newest first, in Scopus's own search-results format. */
export async function searchPublications({ college, year, start }: { college?: string; year?: string; start?: number }) {
  const cfg = await scopusConfig();
  const s = Math.max(0, Math.floor(start ?? 0));
  if (cfg.apiKey) {
    try {
      const parts = [`(${affQuery(cfg.affiliations)})`];
      const extra = COLLEGE_QUERY[college ?? ''];
      if (extra) parts.push(`(${extra})`);
      if (year && /^\d{4}$/.test(year)) parts.push(`PUBYEAR = ${year}`);
      return await elsevier('/content/search/scopus', { query: parts.join(' AND '), sort: '-coverDate', count: '25', start: String(s) }, cfg);
    } catch { /* fall back to the research office's service below */ }
  }
  const res = await fetch(`${PROXY}?college=${encodeURIComponent(college ?? 'Dubai Medical University')}&year=${encodeURIComponent(year ?? '')}&start=${s}`, { next: { revalidate: DAY, tags: ['scopus'] } });
  return res.json();
}

export interface AuthorProfile {
  id: string; documents: number | null; citations: number | null; hIndex: number | null;
  recent: { title: string; journal?: string; year?: string; doi?: string; cited?: number }[];
}

/** Metrics and latest publications for one researcher. Null when no key is saved or Scopus is unavailable. */
export async function authorProfile(id: string | null | undefined): Promise<AuthorProfile | null> {
  if (!id || !/^\d{6,}$/.test(id)) return null;
  const cfg = await scopusConfig();
  if (!cfg.apiKey) return null;
  try {
    const search = await elsevier('/content/search/scopus', { query: `AU-ID(${id})`, sort: '-coverDate', count: '5' }, cfg);
    const sr = search?.['search-results'] ?? {};
    const recent = (sr.entry ?? []).filter((e: Record<string, string>) => !e.error).map((e: Record<string, string>) => ({
      title: e['dc:title'], journal: e['prism:publicationName'], year: e['prism:coverDate']?.slice(0, 4), doi: e['prism:doi'], cited: Number(e['citedby-count'] ?? 0),
    }));
    let documents: number | null = Number(sr['opensearch:totalResults'] ?? 0);
    let citations: number | null = null, hIndex: number | null = null;
    // The author profile adds citations and h-index where the key is entitled to it.
    for (const view of ['METRICS', 'ENHANCED', 'STANDARD']) {
      try {
        const a = await elsevier(`/content/author/author_id/${id}`, { view }, cfg);
        const r = [a?.['author-retrieval-response']].flat()[0] ?? {};
        const core = r.coredata ?? {};
        documents = Number(core['document-count'] ?? documents);
        citations = core['citation-count'] != null ? Number(core['citation-count']) : null;
        hIndex = r['h-index'] != null ? Number(r['h-index']) : null;
        break;
      } catch { /* try a simpler view */ }
    }
    return { id, documents, citations, hIndex, recent };
  } catch {
    return null;
  }
}
