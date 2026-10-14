// Converts research.dmu.ae, smarteducation.dmu.ae and sustainability.dmu.ae into pages of the main website.
// usage: node scripts/migrate/extract-extra.mjs <researchCrawlDir> <spaDomDir> <outFile>
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as cheerio from 'cheerio';
import { cleanHtml, bestSrc } from './clean.mjs';

const [researchDir, domDir, outFile, researchPostsFile] = process.argv.slice(2);
const rPosts = researchPostsFile && fs.existsSync(researchPostsFile) ? new Map(JSON.parse(fs.readFileSync(researchPostsFile, 'utf8')).map(p => [p.slug, p])) : new Map();
const index = JSON.parse(fs.readFileSync(path.join(researchDir, 'index.json'), 'utf8'));
const fileFor = u => { const f = path.join(researchDir, 'pages', crypto.createHash('md5').update(u).digest('hex').slice(0, 12) + '.html'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };
const decode = s => cheerio.load(`<i>${s}</i>`)('i').text();
const assets = new Set();
const ctx = () => ({ images: new Set(), docs: new Set(), embeds: [], redirects: {} });
const keep = c => { c.images.forEach(i => assets.add(i)); c.docs.forEach(d => assets.add(d)); };

/** Links between the merged sites now point inside the main website. */
function relink(html) {
  return html
    .replace(/href="https?:\/\/research\.dmu\.ae\/home\/?([^"#?]*)/g, (_, p) => `href="/research${p ? '/' + p.replace(/\/$/, '') : ''}`)
    .replace(/href="https?:\/\/smarteducation\.dmu\.ae\/?([^"#?]*)/g, (_, p) => `href="/ai-smart-education${p ? '/' + p.replace(/\/$/, '') : ''}`)
    .replace(/href="\/\/([a-z-]*)(#[^"]*)?"/g, (_, p, h) => `href="/ai-smart-education${p ? '/' + p : ''}${h ?? ''}"`)
    .replace(/href="https?:\/\/sustainability\.dmu\.ae\/?[^"]*"/g, 'href="/sustainability"')
    .replace(/href="https?:\/\/(www\.)?dmu\.ae\/home\/blog-post\/([^"/]+)\/?"/g, 'href="/news/$2"')
    .replace(/href="https?:\/\/(www\.)?dmu\.ae\/home\/([^"]*?)\/?"/g, (_, w, p) => `href="/${p}"`)
    .replace(/ target="_blank" rel="noopener"(?=>[^<]*<\/a>)/g, m => m) // external links keep their new-tab behaviour
    .replace(/href="\/(ai-smart-education|research|sustainability)([^"]*)" target="_blank" rel="noopener"/g, 'href="/$1$2"');
}

// =========================== research.dmu.ae ===========================
const pages = [], posts = [];
const rUrls = Object.entries(index).filter(([u, v]) => v.status === 200 && v.final === u && !u.includes('?'));
const toVcSections = ($) => {
  // WPBakery tabs/accordions → headed sections
  $('.vc_tta').each((_, t) => {
    const $t = $(t); const out = [];
    $t.find('.vc_tta-panel').each((_, p) => {
      const title = $(p).find('.vc_tta-panel-title').first().text().trim();
      const body = $(p).find('.vc_tta-panel-body').first();
      body.find('h1,h2,h3,h4,h5').first().filter((_, h) => $(h).text().trim() === title).remove();
      if (title) out.push(`<h3>${title}</h3>${body.html() ?? ''}`);
    });
    if (out.length) $t.replaceWith(out.join(''));
  });
};
for (const [u] of rUrls) {
  const rel = u.replace('https://research.dmu.ae/home/', '').replace(/\/$/, '');
  if (/^\d{4}\//.test(rel) || /^category\//.test(rel) || /\/page\/\d+$/.test(rel) || /\.(css|js)$/.test(rel) || /^dmuhon\//.test(rel)) continue;
  const html = fileFor(u); if (!html) continue;
  const $ = cheerio.load(html);
  const isPost = /\bsingle-post\b/.test($('body').attr('class') || '');
  const title = decode($('title').text().replace(/\s*[-|–]\s*DMU Research.*$/i, '').trim()) || 'Research';
  $('.header, .mainbar, footer, .copyright, .menu_container, .head_panel .owl-nav, script, style').remove();
  toVcSections($);
  const c = ctx();
  if (isPost) {
    const root = $('.single_post, article.post, .post_content, .main').first();
    const cover = bestSrc(root.find('.post_figure img, .wp-post-image, img').first()) || null;
    if (cover) c.images.add(cover);
    root.find('.post_figure, .post_info, .post_sub, .comments, .post_tags, .share').remove();
    const api = rPosts.get(rel);
    const date = api ? api.date + '+04:00' : ($('time[datetime]').attr('datetime') || $('meta[property="article:published_time"]').attr('content') || null);
    let content = relink(cleanHtml(root.html() || '', c));
    if (cover) content = content.replace(new RegExp('^<figure><img src="' + cover.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*></figure>'), '');
    content = content.replace(/^<h[2-5]>[^<]*<\/h[2-5]>/, m => (m.replace(/<[^>]+>/g, '').trim() === title ? '' : m));
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    keep(c);
    posts.push({ slug: rel, title, excerpt: text.slice(0, 240).replace(/\s+\S*$/, '') + (text.length > 240 ? '…' : ''), cover_image: cover, content, categories: ['research'], published_at: date, original_url: u });
    continue;
  }
  let hero = null, subtitle = null;
  if (rel === '') {
    // the research home slider: first slide becomes the banner; slides become an intro list
    const slides = $('.head_panel .item').map((_, s) => ({ t: $(s).find('h1,h2,h3,.title').first().text().trim(), d: $(s).find('p.desc').text().trim(), img: bestSrc($(s).find('img').first()) || ($(s).find('[style*="background"]').attr('style') || '').match(/url\(['"]?([^'")]+)/)?.[1] })).get();
    hero = slides.find(s => s.img)?.img ?? null; subtitle = slides[0]?.d || null;
    $('.head_panel').remove();
  }
  const root = $('.main').first().length ? $('.main').first() : $('body');
  const headImg = root.find('.head_panel img, .page_header img').first();
  if (!hero && headImg.length) hero = bestSrc(headImg);
  root.find('.head_panel, .page_header').remove();
  let content = relink(cleanHtml(root.html() || '', c)).replace(/(<br>)?More<\/span>/g, '</span>').replace(/<span><\/span>/g, '');
  if (!hero && /^research\/.+(lab|laboratory|labs)$/.test(rel ? `research/${rel}` : '')) hero = content.match(/<img src="([^"]+\.(?:jpe?g|webp))"/)?.[1] ?? null;
  if (hero) { hero = hero.replace(/^\/\//, 'https://'); c.images.add(hero); }
  keep(c);
  const pathOut = rel ? `research/${rel}` : 'research';
  const template = rel === 'news-events' ? 'news' : 'default';
  if (template === 'news') content = '';
  pages.push({ path: pathOut, title: rel ? title : 'Research', subtitle, hero_image: hero, template, content, meta: template === 'news' ? { categories: ['research'] } : {}, section: 'research', original_url: u });
}

// =========================== app-style sites ===========================
function counters(bundleFile) {
  if (!fs.existsSync(bundleFile)) return [];
  const js = fs.readFileSync(bundleFile, 'utf8');
  return [...js.matchAll(/\{value:(\d+(?:\.\d+)?),suffix:"([^"]*)",label:"([^"]+)"\}/g)].map(m => ({ value: m[1] + m[2], label: m[3] }));
}
function spaPage(file, base, opts) {
  const $ = cheerio.load(fs.readFileSync(path.join(domDir, file), 'utf8'));
  $('script, style, header, footer, button, svg, [aria-hidden="true"]:not(img)').remove();
  for (const { value, label } of opts.counters ?? []) {
    $('*').filter((_, e) => $(e).children().length === 0 && $(e).text().trim() === label).each((_, e) => {
      let p = $(e).parent();
      for (let k = 0; k < 3 && p.length; k++, p = p.parent()) {
        const zero = p.find('*').filter((_, z) => $(z).children().length === 0 && /^0\s*\+?$/.test($(z).text().trim())).first();
        if (zero.length) { zero.text(value); zero.next().filter((_, n) => /^\+$/.test($(n).text().trim())).remove(); break; }
      }
    });
  }
  // absolute image/video links
  $('img[src], video[src], source[src], a[href]').each((_, e) => {
    for (const a of ['src', 'href']) { const v = $(e).attr(a); if (v && v.startsWith('/') && !v.startsWith('//')) $(e).attr(a, base + v); }
  });
  const sections = $(opts.root).first().children('section, div');
  const first = sections.first();
  const title = opts.title ?? first.find('h1').first().text().replace(/\s+/g, ' ').trim();
  const subtitle = first.find('h1').first().nextAll('p').first().text().replace(/\s+/g, ' ').trim() || null;
  const heroImg = first.find('img').filter((_, i) => !/logo/i.test($(i).attr('src') || '')).first();
  const hero = heroImg.length ? bestSrc(heroImg) : null;
  const c = ctx();
  const parts = [];
  sections.each((i, s) => {
    if (i === 0 && opts.skipFirst !== false) return;
    const cls = ($(s).attr('class') || '').split(/\s+/)[0];
    const html = relink(cleanHtml($(s).html() || '', c));
    if (!html.replace(/<[^>]+>/g, '').trim() && !/<img|<video|<iframe/.test(html)) return;
    parts.push(opts.anchors?.includes(cls) ? `<div id="${cls}">${html}</div>` : html);
  });
  void 0;
  if (hero) c.images.add(hero);
  $('video[src], source[src]').each((_, v) => c.images.add($(v).attr('src')));
  keep(c);
  let content = parts.join('\n');
  for (const { value, label } of opts.counters ?? []) content = content.replace(new RegExp('<p>0\\s*\\+?</p>(\\s*<p>' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</p>)'), `<p><strong>${value}</strong></p>$1`);
  return { title, subtitle, hero_image: hero, content };
}

const seRoutes = [['', 'home', 'AI & Smart Education Unit'], ['who-we-are', 'who-we-are', 'About the Unit'], ['initiatives', 'initiatives', 'Innovation Ecosystem'], ['learning', 'learning', 'Training & Courses'], ['mededai-lab', 'mededai-lab', 'MedEdAI Lab'], ['news-events', 'news-events', 'News & Updates']];
const seCounters = counters(path.join(domDir, '..', 'se.js'));
for (const [route, f, name] of seRoutes) {
  const p = spaPage(`se_${f}.html`, 'https://smarteducation.dmu.ae', { root: 'main', counters: seCounters });
  pages.push({ path: route ? `ai-smart-education/${route}` : 'ai-smart-education', title: name, subtitle: route ? p.title : p.subtitle, hero_image: p.hero_image, template: 'default', content: p.content, meta: {}, section: 'ai-smart-education', original_url: `https://smarteducation.dmu.ae/${route}` });
}
const suCounters = counters(path.join(domDir, '..', 'su.js'));
const su = spaPage('su_home.html', 'https://sustainability.dmu.ae', { root: '#root > div', counters: suCounters, anchors: ['about', 'pillars', 'initiatives', 'green-campus', 'committee', 'sdgs', 'news', 'get-involved'] });
pages.push({ path: 'sustainability', title: 'Sustainability', subtitle: su.subtitle || 'At DMU, sustainability is a core value that guides our operations, research, and community engagement — nurturing a greener future for Dubai and beyond.', hero_image: su.hero_image, template: 'default', content: su.content, meta: {}, section: 'sustainability', original_url: 'https://sustainability.dmu.ae/' });

fs.writeFileSync(outFile, JSON.stringify({ pages, posts, assets: [...assets].filter(Boolean) }, null, 1).replace(/class=\\"people\\"/g, 'class=\\"cards\\"').replace(/class=\\"person\\"/g, 'class=\\"card\\"'));
console.log({ pages: pages.length, posts: posts.length, assets: assets.size, seCounters: seCounters.length, suCounters: suCounters.length });
