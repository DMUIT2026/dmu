// Reads the crawled copy of dmu.ae and writes clean JSON content for the new site.
// usage: node scripts/migrate/extract.mjs <crawlDir> <apiDir> <outDir>
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as cheerio from 'cheerio';
import { cleanHtml, mapUrl, bestSrc } from './clean.mjs';

const [crawlDir, apiDir, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const index = JSON.parse(fs.readFileSync(path.join(crawlDir, 'index.json'), 'utf8'));
const api = n => JSON.parse(fs.readFileSync(path.join(apiDir, n + '.json'), 'utf8'));

// --- redirects (old URL -> final URL) -------------------------------------------------------
const redirects = {};
for (const [u, v] of Object.entries(index)) if (v.final && v.final !== u && v.status === 200) redirects[u] = v.final.endsWith('/') ? v.final : v.final + '/';

const fileFor = u => {
  const f = path.join(crawlDir, 'pages', crypto.createHash('md5').update(u).digest('hex').slice(0, 12) + '.html');
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
};
const decode = s => cheerio.load(`<i>${s}</i>`)('i').text();

const allImages = new Set(), allDocs = new Set();
function newCtx() { return { images: new Set(), docs: new Set(), embeds: [], redirects }; }
function collect(ctx) { ctx.images.forEach(i => allImages.add(i)); ctx.docs.forEach(d => allDocs.add(d)); }

async function fetchHtml(u) {
  const cached = fileFor(u); if (cached) return cached;
  try { const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 DMU-migration' } }); if (r.ok) return await r.text(); } catch { }
  return null;
}

function mainContent($) {
  for (const sel of ['.page-main-content .entry-content', '.page-main-content', '.program-details-area', '.blog-details-desc', '.entry-content']) {
    const el = $(sel).first(); if (el.length && el.text().trim().length > 20) return el;
  }
  // Elementor full-width template: the page element after the header
  const els = $('[data-elementor-type="wp-page"], [data-elementor-type="wp-post"]').filter((_, e) => !$(e).closest('header,#masthead,footer').length);
  if (els.length) return els.first();
  return $('body');
}

async function inlineEmbeds(html, ctx, depth = 0) {
  const re = /<!--embed:(.*?)-->/g; let m; let out = html;
  while ((m = re.exec(html))) {
    let inner = '';
    if (depth < 2) {
      const src = m[1].replace(/^http:/, 'https:');
      const page = await fetchHtml(src.endsWith('/') || src.includes('?') ? src : src + '/') || await fetchHtml(src);
      if (page) {
        const $ = cheerio.load(page);
        const root = mainContent($);
        const sub = newCtx(); sub.redirects = redirects;
        inner = cleanHtml(root.html() || '', sub);
        inner = await inlineEmbeds(inner, sub, depth + 1);
        sub.images.forEach(i => ctx.images.add(i)); sub.docs.forEach(d => ctx.docs.add(d));
      }
    }
    out = out.replace(m[0], inner);
  }
  return out;
}

// --- side navigation & college sub-navigation -----------------------------------------------
const navs = {}; // key -> {title, groups:[{title, links:[{label,url}]}]}
function navKey(obj) { return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex').slice(0, 10); }
function linkList($, $ul) {
  return $ul.children('li').filter((_, li) => !/display:\s*none/.test($(li).attr('style') || '')).map((_, li) => {
    const a = $(li).children('a').first();
    const label = a.text().replace(/\s+/g, ' ').trim();
    const href = a.attr('href');
    const kids = $(li).children('ul');
    const item = { label, url: href && href !== '#' ? mapUrl(href, redirects) : null };
    if (kids.length) item.children = linkList($, kids.first());
    return label ? item : null;
  }).get().filter(Boolean);
}
function extractSideNav($) {
  const groups = [];
  $('nav.sidebar').each((_, n) => {
    const $n = $(n);
    const title = $n.children('h3,h4,h5,h6').first().text().replace(/\s+/g, ' ').trim() || $n.find('h3,h4,h5,h6').first().text().trim();
    const links = linkList($, $n.find('ul').first());
    if (links.length) groups.push({ title, links });
  });
  if (!groups.length) return null;
  const k = 'side-' + navKey(groups);
  navs[k] = { title: groups[0].title, groups };
  return k;
}
function extractCollegeNav($) {
  const nav = $('nav.second-navbar').first();
  if (!nav.length) return null;
  const title = nav.find('.navbar-brand').first().text().replace(/\s+/g, ' ').trim();
  const titleHref = nav.find('.navbar-brand').first().attr('href');
  const items = linkList($, nav.find('ul.navbar-nav').first());
  const groups = items.map(i => ({ title: i.label, links: i.children || [] }));
  const k = 'college-' + navKey({ title, groups });
  navs[k] = { title, url: titleHref ? mapUrl(titleHref, redirects) : null, groups };
  return k;
}

function heroOf($, root) {
  const hw = $('.inner-heros-warp').first();
  if (hw.length) {
    return { title: hw.find('h1,h2').first().text().replace(/\s+/g, ' ').trim(), image: bestSrc(hw.find('img').first()) || null };
  }
  // Elementor programme pages: a big banner image with a heading and "Apply Now"
  const img = root.find('img[fetchpriority="high"]').first();
  if (img.length) {
    let box = img.parent();
    while (box.length && !box.find('h1,h2').length && !box.is(root)) box = box.parent();
    const heading = box.find('h1,h2').first().text().replace(/\s+/g, ' ').trim();
    const src = bestSrc(img);
    if (box.length && !box.is(root) && box.text().replace(/\s+/g, ' ').trim().length < 200) box.remove();
    else { img.remove(); box.find('h1,h2').first().remove(); }
    return { title: heading, image: src };
  }
  return { title: '', image: null };
}

function factsOf($, root) {
  const facts = [];
  root.find('.program-strip .program-item, .program-grid .program-item').each((_, it) => {
    const $it = $(it);
    let label = $it.find('.label').text().trim(); let value = $it.find('.value').text().replace(/\s+/g, ' ').trim();
    if (!label) { const t = $it.text().replace(/\s+/g, ' ').trim(); const m = t.match(/^(Duration|Next Intake|Study Mode|Annual Fee|Credit Hours|Total Fee|Mode|Intake)\s*(.*)$/i); if (m) { label = m[1]; value = m[2]; } }
    const note = $it.find('.note').text().trim();
    if (label) facts.push({ label, value: value + (note && !value.includes(note) ? ' ' + note : '') });
  });
  root.find('.program-strip').remove();
  return facts;
}

const titleOf = $ => decode($('title').text().replace(/\s*[-|–]\s*Dubai Medical University.*$/i, '').trim());
const seoDesc = $ => $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null;

// ===========================================================================================
const pages = [], posts = [], people = [], skipped = [];
const blogApi = new Map(api('blog_post').map(p => [p.slug, p]));
const postApi = new Map(api('posts').map(p => [p.slug, p]));
const media = api('media');
const blogCats = new Map(api('blog_category').map(c => [c.id, c]));
const wpCats = new Map(api('categories').map(c => [c.id, c]));
const listingPages = [];

const urls = Object.entries(index).filter(([u, v]) => v.status === 200 && v.final === u && !u.includes('?'));
for (const [u] of urls) {
  const rel = u.replace('https://dmu.ae/home/', '').replace(/\/$/, '');
  if (rel === '') continue; // home page is rebuilt from settings
  if (/^(custom|dmuhon)\//.test(rel) || /\.(css|js)$/.test(rel)) continue;
  if (/\/page\/\d+$/.test(rel) || /^(blog-category|category)\//.test(rel) || ['blog', 'program-post', 'blog-post'].includes(rel)) { skipped.push(rel); continue; }
  const html = fileFor(u); if (!html) continue;
  const $ = cheerio.load(html);

  // ---------------- news articles ----------------
  if (rel.startsWith('blog-post/')) {
    const slug = rel.slice(10); const a = blogApi.get(slug);
    const ctx = newCtx();
    let content = a ? cleanHtml(a.content.rendered, ctx) : cleanHtml(mainContent($).html() || '', ctx);
    content = await inlineEmbeds(content, ctx);
    let cover = a && media[a.featured_media] ? media[a.featured_media].source_url : null;
    if (!cover) { const im = $('.blog-details-desc img, .blog-image-with-content img').filter((_, i) => !/header_/.test(bestSrc($(i)))).first(); if (im.length) cover = bestSrc(im); }
    if (cover) { cover = cover.replace(/^http:/, 'https:'); ctx.images.add(cover); }
    // remove a duplicate of the cover image at the top of the body
    if (cover) content = content.replace(new RegExp('^<figure><img src="' + cover.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*></figure>'), '');
    const cats = a ? (a['blog-category'] || []).map(id => blogCats.get(id)?.slug).filter(Boolean) : [];
    const excerpt = a ? cheerio.load(a.excerpt.rendered).text().replace(/\s+/g, ' ').replace(/\[…\]|\[&hellip;\]/g, '…').trim() : null;
    collect(ctx);
    posts.push({ slug, title: a ? decode(a.title.rendered) : titleOf($), excerpt, cover_image: cover, content, categories: cats, published_at: a ? a.date + '+04:00' : null, original_url: u });
    continue;
  }

  // ---------------- faculty profiles ----------------
  if (rel.startsWith('program-post/')) {
    const slug = rel.slice(13);
    const root = $('.program-details-area').first().length ? $('.program-details-area').first() : mainContent($);
    const team = root.find('.team').first();
    const ctx = newCtx();
    const photo = bestSrc(team.find('.team-image img').first()) || bestSrc(root.find('img.rounded-circle').first()) || null;
    if (photo) ctx.images.add(photo);
    const name = (team.find('.team-title h4, .team-title h3, h4').first().text() || titleOf($)).replace(/\s+/g, ' ').trim();
    const title = team.find('.team-title span, .team-title p').first().text().replace(/\s+/g, ' ').trim()
      || (team.find('.team-title').text().replace(name, '').replace(/\s+/g, ' ').trim());
    const email = (root.find('a[href^="mailto:"]').first().attr('href') || '').replace('mailto:', '') || null;
    const phone = (root.find('a[href^="tel:"]').first().attr('href') || '').replace('tel:', '') || null;
    team.find('.team-image, .team-title').remove();
    root.find('a[href^="mailto:"], a[href^="tel:"]').closest('p').remove();
    root.find('h5').filter((_, h) => /Faculty Details/i.test($(h).text())).remove();
    let content = cleanHtml(root.html() || '', ctx);
    content = await inlineEmbeds(content, ctx);
    collect(ctx);
    content = content.replace(/<details[^>]*><summary>([^<]*)<\/summary>/g, '<h3>$1</h3>').replace(/<\/details>/g, '');
    people.push({ slug, name, title, email, phone, photo, bio: content, original_url: u });
    continue;
  }

  // ---------------- old-style WP posts at top level ----------------
  if (postApi.has(rel)) {
    const a = postApi.get(rel); const ctx = newCtx();
    let content = cleanHtml(a.content.rendered, ctx); content = await inlineEmbeds(content, ctx);
    let cover = media[a.featured_media]?.source_url?.replace(/^http:/, 'https:') || null; if (cover) ctx.images.add(cover);
    collect(ctx);
    posts.push({ slug: rel, title: decode(a.title.rendered), excerpt: cheerio.load(a.excerpt.rendered).text().trim(), cover_image: cover, content, categories: (a.categories || []).map(id => wpCats.get(id)?.slug).filter(Boolean).map(s => s === 'pharmacy' ? 'pharmacy' : s), published_at: a.date + '+04:00', original_url: u, legacy_path: rel });
    continue;
  }

  // ---------------- regular pages ----------------
  const ctx = newCtx();
  const collegeNav = extractCollegeNav($);
  const sideNav = extractSideNav($);
  const root = mainContent($);
  const hero = heroOf($, root);
  const facts = factsOf($, root);
  // news listing pages: remember which posts they list
  const listed = root.find('.wpbaw-blog-class, .blog-list .blog-title a, .blog-inner-wrap-view').length;
  let template = 'default';
  const meta = {};
  if (listed >= 3) {
    template = 'news';
    const slugs = new Set();
    root.find('a[href*="/blog-post/"]').each((_, a) => { const m = ($(a).attr('href') || '').match(/blog-post\/([^/]+)/); if (m) slugs.add(m[1]); });
    listingPages.push({ rel, slugs: [...slugs] });
    root.find('.wpbaw-blog-class, .blog-inner-wrap-view, .blogfree-plugin, .blog-list, .wpbaw-blog-grid-main, .wpbaw-blog-grid, .pagination, .page-numbers').remove();
  }
  if (rel === 'dmu-faculty-and-staff-directory') template = 'directory';
  if (rel === 'contact-us') template = 'contact';
  root.find('.elementor-widget-sidebar').remove();
  let content = cleanHtml(root.html() || '', ctx);
  content = await inlineEmbeds(content, ctx);
  if (hero.image) ctx.images.add(hero.image);
  collect(ctx);
  if (facts.length) meta.facts = facts;
  if (sideNav) meta.sidenav = sideNav;
  if (collegeNav) meta.collegenav = collegeNav;
  const title = hero.title && hero.title.length < 120 ? hero.title : titleOf($);
  const empty = !content.replace(/<[^>]+>/g, '').trim() && !/<img|<iframe|<table/.test(content);
  pages.push({
    status: empty ? 'draft' : 'published',
    path: rel, title: titleOf($) || title, display_title: title, hero_image: hero.image, template, content, meta,
    seo_title: decode($('title').text()), seo_description: seoDesc($), original_url: u,
  });
}

// work out the category behind each news listing page
const postCats = new Map(posts.map(p => [p.slug, p.categories]));
for (const l of listingPages) {
  const counts = {};
  for (const s of l.slugs) for (const c of postCats.get(s) || []) counts[c] = (counts[c] || 0) + 1;
  const n = l.slugs.length;
  const cats = Object.entries(counts).filter(([, c]) => c >= Math.max(1, n * 0.6)).map(([k]) => k);
  const page = pages.find(p => p.path === l.rel);
  page.meta.categories = cats.length ? cats : [];
  page.meta.listed = l.slugs.length;
}

// ---------------- faculty directory ----------------
const dirHtml = fileFor('https://dmu.ae/home/dmu-faculty-and-staff-directory/');
const directory = [];
if (dirHtml) {
  const $ = cheerio.load(dirHtml);
  $('#demoSix > li').each((i, li) => {
    const $li = $(li); if ($li.attr('style')?.includes('display:none') || $li.hasClass('ln-no-match')) return;
    const ps = $li.children('p');
    const get = n => $(ps[n]).text().replace(/\s+/g, ' ').trim();
    const name = $li.find('strong').first().text().replace(/\s+/g, ' ').trim(); if (!name) return;
    const photo = bestSrc($li.find('img').first()) || null; if (photo) allImages.add(photo);
    const profile = $li.find('a[href*="program-post"]').attr('href');
    directory.push({
      name, department: get(0).replace(name, '').replace(/\s+/g, ' ').trim(), title: $li.find('.pe-7s-id').parent().text().replace(/\s+/g, ' ').trim() || get(2),
      phone: ($li.find('a[href^="tel:"]').attr('href') || '').replace('tel:', '') || null,
      email: ($li.find('a[href^="mailto:"]').attr('href') || '').replace('mailto:', '') || null,
      college: $li.find('.last-college').text().trim() || null, photo,
      profile_slug: profile ? profile.match(/program-post\/([^/]+)/)?.[1] : null, sort_order: i,
    });
  });
}

// ---------------- main menu & footer from the home page ----------------
const $h = cheerio.load(fileFor('https://dmu.ae/home/'));
const mainMenu = linkList($h, $h('#menu-primary-menu').first()).filter(i => i.label);
const footer = { quick: [], colleges: [], social: [] };
$h('footer .footer-widget').each((_, w) => {
  const h = $h(w).find('h4,h3').first().text().trim();
  const links = $h(w).find('a').map((_, a) => ({ label: $h(a).text().replace(/\s+/g, ' ').trim(), url: mapUrl($h(a).attr('href'), redirects) })).get().filter(l => l.label);
  if (/quick/i.test(h)) footer.quick = links; else if (/college/i.test(h)) footer.colleges = links;
});
$h('footer a.dmusrsocial-icon').each((_, a) => footer.social.push({ label: $h(a).attr('aria-label'), url: $h(a).attr('href') }));

// ---------------- home page blocks ----------------
const hroot = $h('body');
const colleges = [];
$h('a[href*="college-of-"]').filter((_, a) => $h(a).find('h4').length && $h(a).find('img').length).each((_, a) => {
  const img = bestSrc($h(a).find('img').first()); allImages.add(img);
  colleges.push({ title: $h(a).find('h4').text().replace(/\s+/g, ' ').trim(), url: mapUrl($h(a).attr('href'), redirects), icon: img });
});
const homeStats = $h('.dmucontainer').map((_, c) => {
  const $c = $h(c); const v = $c.find('.num').attr('data-val');
  const num = v ? v + $c.find('.tail').text().trim() : $c.find('div').first().text().replace(/\s+/g, ' ').trim();
  return { value: num, label: $c.find('.text').text().trim() || $c.text().replace(/\s+/g, ' ').replace(num, '').trim() };
}).get();
const homePrograms = [];
$h('h6 a').each((i, a) => {
  const $a = $h(a); const href = $a.attr('href');
  let box = $a.parent();
  while (box.length && !box.find('img').length) box = box.parent();
  const img = bestSrc(box.find('img').first()) || bestSrc($h(`a[href="${href}"] img`).first());
  if (img) allImages.add(img);
  homePrograms.push({ title: $a.text().replace(/\s+/g, ' ').trim(), url: mapUrl(href, redirects), image: img, start_date: (box.find('pre').first().text().match(/Start Date:\s*(.*)/) || [])[1]?.trim() || null, sort_order: i });
});
const alumniLogos = [...new Set($h('figure img').map((_, i) => bestSrc($h(i))).get().filter(s => /partnerdmu/.test(s)))];
alumniLogos.forEach(i => allImages.add(i));
const sliderImgs = [...new Set((fileFor('https://dmu.ae/home/').match(/https?:\\?\/\\?\/dmu\.ae\\?\/home\\?\/wp-content\\?\/uploads\\?\/[^"'\s]+?\.(jpg|jpeg|png|webp|mp4)/gi) || []).map(s => s.replace(/\\\//g, '/')).filter(s => /slider|slide|banner|hero/i.test(s)))];
sliderImgs.forEach(i => allImages.add(i));

const settings = {
  contact: { phone: '800DMU1 (8003681)', phone_link: 'tel:8003681', email: 'info@dmu.ae', address: 'P.O.BOX: 20170, Al Mizhar\nDubai - United Arab Emirates' },
  social: footer.social,
  home_hero: { slides: sliderImgs.map(src => ({ image: src })), },
  home_colleges: colleges,
  home_stats: { title: 'Why study at Dubai Medical University?', items: homeStats },
  home_alumni: { title: 'Where DMU Alumni Work', logos: alumniLogos },
  navs,
};

// ---------------- write ----------------
const w = (n, d) => fs.writeFileSync(path.join(outDir, n + '.json'), JSON.stringify(d, null, 1).replace(/class=\\"people\\"/g, 'class=\\"cards\\"').replace(/class=\\"person\\"/g, 'class=\\"card\\"'));
w('pages', pages); w('posts', posts); w('people', people); w('directory', directory);
w('menu', { main: mainMenu, footer_quick: footer.quick, footer_colleges: footer.colleges });
w('settings', settings); w('home_programs', homePrograms);
w('categories', api('blog_category').map(c => ({ slug: c.slug, name: decode(c.name), count: c.count })).concat(api('categories').filter(c => !api('blog_category').some(b => b.slug === c.slug)).map(c => ({ slug: c.slug, name: decode(c.name), count: c.count }))));
w('assets', { images: [...allImages].filter(Boolean).sort(), docs: [...allDocs].filter(Boolean).sort() });
w('redirects', redirects);
console.log({ pages: pages.length, posts: posts.length, people: people.length, directory: directory.length, navs: Object.keys(navs).length, images: allImages.size, docs: allDocs.size, skipped: skipped.length, listingPages: listingPages.length });
