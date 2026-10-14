// Converts the copied content in migration/data into database rows.
// Used by the import script and by the local preview mode.
import fs from 'fs';
import path from 'path';
import type { Category, Menu, MenuGroup, Page, Person, Post, Program, Settings } from './types';

const DIR = path.join(process.cwd(), 'migration', 'data');
const read = <T,>(n: string): T => JSON.parse(fs.readFileSync(path.join(DIR, n + '.json'), 'utf8'));

const COLLEGES: Record<string, string> = {
  'college-of-medicine': 'College of Medicine',
  'college-of-pharmacy': 'College of Pharmacy',
  'college-of-nursing': 'College of Nursing',
  'college-of-health-sciences': 'College of Health Sciences',
};

const CATEGORY_ORDER: Record<string, [string, number]> = {
  dmu: ['DMU', 1], medicine: ['College of Medicine', 2], pharmacy: ['College of Pharmacy', 3], nursing: ['College of Nursing', 4],
  dsa: ['Student Affairs', 5], 'community-engagements': ['Community Engagement', 6], qaie: ['QAIE', 7], sustainability: ['Sustainability', 8],
};

export interface Rows {
  pages: Page[]; posts: Post[]; people: Person[]; menus: Menu[]; settings: Record<string, unknown>;
  programs: Program[]; categories: Category[]; redirects: Record<string, string>;
}

function levelOf(title: string) {
  if (/master|diploma|post[- ]bachelor|\bMS\b|\bMSc\b/i.test(title)) return 'Postgraduate';
  return 'Undergraduate';
}

export function buildRows(): Rows {
  type RawPage = Page & { display_title?: string; original_url?: string };
  const rawPages = read<RawPage[]>('pages');
  const pages: Page[] = rawPages.map((p, i) => {
    const seg = p.path.split('/')[0];
    let template = p.template;
    if (p.meta?.facts?.length) template = 'program';
    if (COLLEGES[p.path]) template = 'college';
    const title = (p.display_title && p.display_title.length > 2 && p.display_title.toUpperCase() !== p.display_title ? p.display_title : p.title) || p.title;
    // the banner already shows the title, so drop repeated title headings at the very top
    let content = p.content;
    const norm = (t: string) => t.replace(/&amp;/g, '&').replace(/<[^>]+>/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
    for (let k = 0; k < 3; k++) {
      const m = content.match(/^<h[2-5]>(.*?)<\/h[2-5]>/);
      if (m && [norm(title), norm(p.title)].includes(norm(m[1]))) content = content.slice(m[0].length); else break;
    }
    return {
      path: p.path, title, subtitle: null, hero_image: p.hero_image ?? null, template, content, meta: p.meta ?? {},
      section: COLLEGES[seg] ? seg : null, seo_title: p.seo_title ?? null, seo_description: p.seo_description ?? null,
      status: p.status ?? 'published', sort_order: i,
      original_url: p.original_url,
    };
  });

  type RawPost = Post & { original_url?: string };
  const seenSlugs = new Set<string>();
  const posts: Post[] = read<RawPost[]>('posts').filter(p => !seenSlugs.has(p.slug) && !!seenSlugs.add(p.slug)).map(p => ({
    slug: p.slug, title: p.title, excerpt: p.excerpt ?? null, cover_image: p.cover_image ?? null, content: p.content,
    categories: (p.categories ?? []).map(c => (c === 'community-engagement' ? 'community-engagements' : c.replace(/-latest$/, ''))).filter((c, i, a) => a.indexOf(c) === i),
    status: 'published', featured: false, published_at: p.published_at ?? null,
    original_url: p.original_url,
  }));

  // people: directory entries + profile pages
  type RawProfile = { slug: string; name: string; title: string; email: string | null; phone: string | null; photo: string | null; bio: string; original_url: string };
  type RawDir = { name: string; department: string; title: string; phone: string | null; email: string | null; college: string | null; photo: string | null; profile_slug: string | null; sort_order: number };
  const profiles = read<RawProfile[]>('people');
  const dir = read<RawDir[]>('directory');
  const people: Person[] = [];
  const used = new Set<string>();
  for (const d of dir) {
    // a profile can only belong to one directory entry
    const prof = d.profile_slug && !used.has(d.profile_slug) ? profiles.find(p => p.slug === d.profile_slug) : undefined;
    if (prof) used.add(prof.slug);
    people.push({
      slug: prof?.slug ?? null, name: d.name, title: d.title || prof?.title || null, department: d.department || null,
      college: d.college, email: d.email || prof?.email || null, phone: d.phone || prof?.phone || null,
      photo: prof?.photo || d.photo, bio: prof?.bio ?? '', in_directory: true, status: 'published', sort_order: d.sort_order,
    });
  }
  for (const p of profiles) {
    if (used.has(p.slug)) continue;
    const college = p.slug.startsWith('dpcg-') ? 'College Of Pharmacy' : p.slug.startsWith('con-') ? 'College Of Nursing' : null;
    people.push({ slug: p.slug, name: p.name, title: p.title || null, department: null, college, email: p.email, phone: p.phone, photo: p.photo, bio: p.bio, in_directory: false, status: 'published', sort_order: 1000 });
  }

  const m = read<{ main: Menu['items']; footer_quick: Menu['items']; footer_colleges: Menu['items'] }>('menu');
  const s = read<Settings & { navs: Record<string, { title: string; url?: string; groups: MenuGroup[] }> }>('settings');
  const menus: Menu[] = [
    { key: 'main', title: 'Main menu', kind: 'menu', items: m.main },
    { key: 'footer_quick', title: 'Footer – Quick links', kind: 'menu', items: m.footer_quick },
    { key: 'footer_colleges', title: 'Footer – Colleges', kind: 'menu', items: m.footer_colleges },
    ...Object.entries(s.navs).map(([key, v]) => ({
      key, title: v.title || 'Side menu', url: v.url ?? null, kind: (key.startsWith('college-') ? 'college' : 'side') as Menu['kind'], items: v.groups,
    })),
  ];

  const vision = rawPages.find(p => p.path === 'vision-and-mission');
  const about = vision?.content.match(/<h4>About DMU<\/h4>(?:<figure>.*?<\/figure>)?<p>(.*?)<\/p>/)?.[1]?.split('<br><br>')[0]?.replace(/<[^>]+>/g, '');
  const settings: Record<string, unknown> = {
    contact: { ...s.contact, map_embed: 'https://www.google.com/maps?q=Dubai+Medical+University+Al+Mizhar+Dubai&output=embed' },
    social: s.social,
    home_hero: {
      eyebrow: 'Dubai Medical University',
      title: 'Empower the next generation of health care leaders.',
      text: 'Medicine, pharmacy, nursing and health sciences — taught on one campus in Dubai, with nearly four decades of heritage.',
      slides: ['2026/08/dmu_header99.jpg', '2026/08/header_studets.jpg', '2026/08/dmucom26_header5.jpg', '2026/08/dmucom26_header1.jpg']
        .map(f => ({ image: 'https://dmu.ae/home/wp-content/uploads/' + f })),
    },
    home_colleges: s.home_colleges,
    home_stats: s.home_stats,
    home_alumni: s.home_alumni,
    home_intro: {
      title: 'About DMU',
      text: about ?? '',
      image: vision?.content.match(/<img src="([^"]*about_dmu[^"]*)"/)?.[1] ?? null,
      link: '/vision-and-mission',
    },
    portal_links: (m.footer_quick as { label: string; url: string }[]).filter(l => /login/i.test(l.label)),
  };

  type RawProg = { title: string; url: string; image: string | null; start_date: string | null; sort_order: number };
  const programs: Program[] = read<RawProg[]>('home_programs').map(p => {
    const seg = p.url.split('/')[1];
    return {
      title: p.title, page_path: p.url.replace(/^\//, ''), college: COLLEGES[seg] ?? 'Dubai Medical University', level: levelOf(p.title),
      start_date: p.start_date, image: p.image, summary: null, status: 'published', sort_order: p.sort_order,
    };
  });

  const cats = read<{ slug: string; name: string; count: number }[]>('categories');
  const categories: Category[] = cats
    .filter(c => !/-latest$/.test(c.slug) && c.slug !== 'community-engagement' && c.slug !== 'alumnisl')
    .filter((c, i, a) => a.findIndex(x => x.slug === c.slug) === i)
    .map(c => ({ slug: c.slug, name: CATEGORY_ORDER[c.slug]?.[0] ?? c.name, sort_order: CATEGORY_ORDER[c.slug]?.[1] ?? 50 }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // news listing pages: normalise categories too
  for (const p of pages) if (p.meta.categories) p.meta.categories = p.meta.categories.map(c => (c === 'community-engagement' ? 'community-engagements' : c.replace(/-latest$/, '')));

  return { pages, posts, people, menus, settings, programs, categories, redirects: read('redirects') };
}
