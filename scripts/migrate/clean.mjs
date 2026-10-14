// Turns messy WordPress/Elementor markup into clean, simple HTML that the new site styles itself.
import * as cheerio from 'cheerio';

const OLD = /^https?:\/\/(www\.)?dmu\.ae\/home/i;

// Map an old dmu.ae/home URL to the new site path.
export function mapUrl(href, redirects = {}) {
  if (!href) return href;
  href = href.trim();
  if (/^(mailto:|tel:|#|javascript:)/i.test(href)) return href;
  let u = href.replace(/^\/\//, 'https://');
  if (u.startsWith('/home/')) u = 'https://dmu.ae' + u;
  if (!OLD.test(u)) return href;
  if (/\/wp-content\/uploads\//.test(u)) return u.replace(/^http:/, 'https:'); // files are rewritten during import
  const full = u.replace(/^http:/, 'https:').replace(/^https:\/\/www\./, 'https://');
  const [noHash, hash] = full.split('#');
  const key = noHash.endsWith('/') || noHash.includes('?') ? noHash : noHash + '/';
  const target = redirects[key] || key;
  let p = target.replace(OLD, '').replace(/^\/+|\/+$/g, '');
  p = p.replace(/\?.*$/, '');
  if (p.startsWith('blog-post/')) p = 'news/' + p.slice(10);
  else if (p === 'blog-post' || p === 'blog') p = 'news';
  else if (p.startsWith('blog-category/')) p = 'news/category/' + p.slice(14);
  else if (p.startsWith('category/')) p = 'news/category/' + p.slice(9);
  else if (p.startsWith('program-post/')) p = 'people/' + p.slice(13);
  p = p.replace(/\/page\/\d+$/, '');
  return '/' + p + (hash ? '#' + hash : '');
}

const DROP = [
  'script', 'style', 'noscript', 'link', 'meta', 'svg', 'form', 'input', 'select', 'button:not(.accordion-button)',
  'header', 'footer', 'nav', '#masthead', '.offcanvas', '.navbar', '.responsive-navbar', '.pum', '.pum-overlay',
  '#backtotop', '.elementor-hidden-desktop', '.latest-side-news', '.search-popup', '.copy-right-warp',
  '.footer-area', '.share-list', '.tags-share', '.previous-next-post', '.nav-previous', '.inner-heros-warp',
  '.elementor-spacer', 'sr7-module', 'rs-module-wrap', '.blog-author', '.breadcrumb', 'iframe[src*="googletagmanager"]',
  '.ln-letters', '.listNavHide', '[style*="display:none"]', '[style*="display: none"]',
].join(',');

const KEEP = new Set(['h2', 'h3', 'h4', 'h5', 'p', 'br', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'u', 'sup', 'sub', 'img',
  'figure', 'figcaption', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'blockquote', 'iframe', 'video', 'source',
  'details', 'summary', 'dl', 'dt', 'dd', 'hr', 'caption', 'colgroup', 'col']);
const RENAME = { h1: 'h2', h6: 'h5', b: 'strong', i: 'em', pre: 'p', center: 'div', font: 'span', big: 'strong', small: 'span' };
const INLINE = new Set(['a', 'strong', 'em', 'u', 'sup', 'sub', 'br', 'img', 'span', 'b', 'i', 'font', 'small', 'big', 'label', 'abbr', 'code', 'mark', 'time', 'cite', 'q', 's', 'del', 'ins']);
const DECOR_IMG = /(quote_(left|right)|fun-fact\d|new50dmu\d|_icon\d*\.(png|svg)|icon_|\/icons?\/|biography\.png|education\.png|research(_pub)?\.png|external_profiles\.png|shape|arrow|bullet|line\.png|spacer|placeholder|loader|loading\.gif)/i;

export function bestSrc($img) {
  const attrs = ['data-src', 'data-lazy-src', 'data-original', 'src'];
  let src = '';
  for (const a of attrs) { const v = $img.attr(a); if (v && !v.startsWith('data:')) { src = v; break; } }
  const srcset = $img.attr('data-srcset') || $img.attr('srcset');
  if (srcset) {
    let best = 0;
    for (const part of srcset.split(',')) {
      const [u, w] = part.trim().split(/\s+/);
      const n = parseInt(w) || 0;
      if (u && !u.startsWith('data:') && n >= best) { best = n; src = u; }
    }
  }
  src = src.replace(/^\/\//, 'https://').replace(/^http:\/\//, 'https://');
  // prefer the original upload rather than a resized copy
  return src.replace(/-\d{2,4}x\d{2,4}(\.(jpe?g|png|webp|gif))$/i, '$1');
}

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function attrEsc(s) { return esc(s).replace(/"/g, '&quot;'); }

// Pre-pass: convert known widgets into simple, recognisable structures.
function transformWidgets($, ctx) {
  // Animated counters: use the real target value
  $('[data-val],[data-to-value],[data-count],[data-to]').each((_, el) => {
    const $e = $(el);
    const v = $e.attr('data-val') ?? $e.attr('data-to-value') ?? $e.attr('data-count') ?? $e.attr('data-to');
    if (v && /^[\d.,]+$/.test(v)) $e.text(v);
  });
  // Stats rows (".dmucontainer" pattern)
  $('.dmuwrapper, .dmucontainer').closest(':has(> .dmucontainer)').each((_, wrap) => {
    const items = $(wrap).children('.dmucontainer').map((_, c) => {
      const $c = $(c);
      const num = $c.find('.num').text().trim() + $c.find('.tail').text().trim();
      const label = $c.find('.text').text().trim();
      const first = num || $c.find('div').first().text().trim();
      return `<div class="stat"><strong>${esc(first || '')}</strong><span>${esc(label || $c.text().replace(first, '').trim())}</span></div>`;
    }).get();
    if (items.length) $(wrap).replaceWith(`<div class="stats">${items.join('')}</div>`);
  });
  // Elementor/Falar fun-facts (number in h2, suffix in another h2, label in p)
  $('[data-widget_type="Falar_Funfact.default"]').each((_, w) => {
    const blocks = [];
    $(w).find('p').each((_, p) => {
      const $box = $(p).parent();
      const nums = $box.find('h2,h3').map((_, h) => $(h).text().trim()).get().join('');
      if (nums) blocks.push(`<div class="stat"><strong>${esc(nums)}</strong><span>${esc($(p).text().trim())}</span></div>`);
    });
    if (blocks.length) $(w).replaceWith(`<div class="stats">${blocks.join('')}</div>`);
  });
  // Bootstrap accordions
  $('.accordion-item, .sscaccordion-item').each((_, it) => {
    const $it = $(it);
    const q = $it.find('.accordion-button, .accordion-header, .sscaccordion-header').first().text().trim();
    const $body = $it.find('.accordion-body, .accordion-collapse, .sscaccordion-content').first();
    if (q) $it.replaceWith(`<details><summary>${esc(q)}</summary><div>${$body.html() || ''}</div></details>`);
  });
  // Elementor tabs / accordions / toggles
  $('.elementor-tabs, .elementor-accordion, .elementor-toggle').each((_, t) => {
    const $t = $(t); const out = [];
    const titles = $t.find('.elementor-tab-desktop-title, .elementor-accordion-title, .elementor-toggle-title, .elementor-tab-title').filter((_, e) => !$(e).hasClass('elementor-tab-mobile-title'));
    const seen = new Set();
    titles.each((_, ti) => {
      const $ti = $(ti); const id = $ti.attr('aria-controls') || $ti.attr('data-tab');
      const label = $ti.text().trim(); if (!label || seen.has(label)) return; seen.add(label);
      let $c = id ? $t.find(`#${id}`) : $();
      if (!$c.length) $c = $ti.closest('.elementor-accordion-item, .elementor-toggle-item').find('.elementor-tab-content').first();
      if (!$c.length && $ti.attr('data-tab')) $c = $t.find(`.elementor-tab-content[data-tab="${$ti.attr('data-tab')}"]`).first();
      out.push(`<details${out.length === 0 && $t.hasClass('elementor-tabs') ? ' open' : ''}><summary>${esc(label)}</summary><div>${$c.html() || ''}</div></details>`);
    });
    if (out.length) $t.replaceWith(out.join(''));
  });
  // ARIA tab widgets (faculty profiles etc.)
  $('[role="tablist"]').each((_, tl) => {
    const $tl = $(tl); const root = $tl.parent(); const out = [];
    $tl.find('[role="tab"]').each((_, tab) => {
      const $tab = $(tab); const id = $tab.attr('aria-controls');
      const $p = id ? root.find(`#${id}`) : $();
      if (!$p.length) return;
      $p.find('h5,h4').first().filter((_, h) => $(h).text().trim() === $tab.text().trim()).remove();
      $p.find('a[href*="faculty-and-staff-directory"]').filter((_, a) => /back/i.test($(a).text())).remove();
      out.push(`<h3>${esc($tab.text().trim())}</h3>${$p.html()}`);
      $p.remove();
    });
    if (out.length) { $tl.replaceWith(out.join('')); root.find('[role="tabpanel"]').remove(); }
  });
  // People cards: blocks of "photo + name + role" (board of trustees, leadership, team pages...)
  const isDecor = src => !src || DECOR_IMG.test(src);
  const cardInfo = el => {
    const $c = $(el);
    if ($c.find('table, ul, ol, details, .stats').length) return null;
    const imgs = $c.find('img').filter((_, i) => !isDecor(bestSrc($(i))));
    if (imgs.length !== 1) return null;
    const $h = $c.find('h2,h3,h4,h5,h6,strong,b,.team-title,.name').filter((_, h) => $(h).text().trim()).first();
    const text = $c.text().replace(/\s+/g, ' ').trim();
    if (!$h.length || text.length < 3 || text.length > 450) return null;
    const name = $h.text().replace(/\s+/g, ' ').trim();
    if (name.length > 90) return null;
    const lines = [];
    const FMT = new Set(['strong', 'b', 'em', 'i', 'u', 'a', 'sup', 'sub', 'font', 'small']);
    let buf = '';
    const push = () => { const v = buf.replace(/\s+/g, ' ').trim(); if (v && v !== name && !lines.includes(v)) lines.push(v); buf = ''; };
    const walk = n => {
      if (n.type === 'text') { buf += n.data; return; }
      if (n.type !== 'tag') return;
      const t = n.tagName.toLowerCase();
      if (t === 'img' || t === 'script' || t === 'style') return;
      if (t === 'br') { push(); return; }
      if (FMT.has(t)) { n.children.forEach(walk); return; }
      push(); n.children.forEach(walk); push();
    };
    walk(el); push();
    const link = $c.find('a[href]').filter((_, l) => !/^(mailto|tel):|^#/.test($(l).attr('href') || '')).first().attr('href');
    return { name, img: bestSrc(imgs.first()), role: lines.filter(l => !/^(mailto:|tel:)/.test(l)).slice(0, 5), link };
  };
  const cardHtml = info => {
    ctx.images.add(info.img);
    const inner = `<img src="${attrEsc(info.img)}" alt="${attrEsc(info.name)}"><strong>${esc(info.name)}</strong>${info.role.length ? `<span>${info.role.map(esc).join('<br>')}</span>` : ''}`;
    return info.link ? `<a class="person" href="${attrEsc(info.link)}">${inner}</a>` : `<div class="person">${inner}</div>`;
  };
  const parents = $('#__root *').toArray().filter(e => $(e).children().length >= 1)
    .map(e => ({ e, d: $(e).parents().length })).sort((a, b) => b.d - a.d);
  for (const { e } of parents) {
    if (!$(e).closest('#__root').length) continue; // already replaced
    const kids = $(e).children().toArray().filter(k => $(k).text().trim() || $(k).find('img').length);
    if (!kids.length) continue;
    const infos = kids.map(cardInfo);
    const ok = infos.filter(Boolean).length;
    const single = kids.length === 1 && /^(article)$/.test(kids[0].tagName) || /team|profile|member/.test($(kids[0]).attr('class') || '');
    if (ok >= 2 && ok === kids.length || (ok === 1 && kids.length === 1 && single)) {
      $(e).replaceWith(`<div class="people">${infos.map(cardHtml).join('')}</div>`);
    }
  }
  // Merge consecutive people grids
}

export function cleanHtml(html, ctx) {
  const $ = cheerio.load(`<div id="__root">${html}</div>`, null, false);
  $('[aria-hidden="true"]:not(.elementor-tab-content)').filter((_, e) => !$(e).text().trim() && !$(e).find('img').length).remove();
  $(DROP).remove();
  transformWidgets($, ctx);
  $('*').contents().filter((_, n) => n.type === 'comment').remove();

  function ser(node, inBlock) {
    if (node.type === 'text') return esc(node.data.replace(/\s+/g, ' '));
    if (node.type !== 'tag') return '';
    let tag = node.tagName.toLowerCase();
    const $n = $(node);
    const cls = $n.attr('class') || '';
    // pass through the structures produced in transformWidgets
    if ((tag === 'div' && /^(stats|stat|people|person)$/.test(cls)) || (tag === 'a' && cls === 'person')) {
      const inner = node.children.map(c => ser(c, false)).join('');
      return `<${tag} class="${cls}"${tag === 'a' ? ` href="${attrEsc(mapUrl($n.attr('href'), ctx.redirects))}"` : ''}>${inner}</${tag}>`;
    }
    if (tag === 'span' && $n.parent().is('.stat, .person')) return `<span>${$n.parent().is('.person') ? $n.html() : esc($n.text())}</span>`;
    if (tag === 'strong' && $n.parent().is('.person')) return `<strong>${esc($n.text())}</strong>`;
    if (RENAME[tag]) tag = RENAME[tag];
    if (tag === 'img') {
      const src = bestSrc($n);
      if (!src || DECOR_IMG.test(src)) return '';
      ctx.images.add(src);
      const alt = ($n.attr('alt') || '').replace(/^(images?|logo)$/i, '');
      return `<img src="${attrEsc(src)}" alt="${attrEsc(alt)}">`;
    }
    if (tag === 'iframe') {
      let src = ($n.attr('src') || $n.attr('data-src') || '').replace(/^\/\//, 'https://');
      if (!src) return '';
      if (OLD.test(src) && !/\.pdf/i.test(src)) { ctx.embeds.push(src); return `<!--embed:${src}-->`; }
      if (/\.pdf/i.test(src)) { ctx.docs.add(src); return `<p><a href="${attrEsc(src)}">View document (PDF)</a></p>`; }
      return `<iframe src="${attrEsc(src)}" loading="lazy" allowfullscreen></iframe>`;
    }
    if (tag === 'video') {
      const src = bestSrcVideo($n); if (!src) return '';
      ctx.images.add(src);
      return `<video controls preload="metadata" src="${attrEsc(src)}"></video>`;
    }
    if (tag === 'hr') return '';
    if (tag === 'a') {
      const href = $n.attr('href');
      const inner = node.children.map(c => ser(c, false)).join('').trim();
      if ((!href || href === '#') && /^apply now$/i.test($n.text().trim())) return `<a class="button" href="/admissions">Apply Now</a>`;
      if (!href || href === '#' || /^javascript:/i.test(href)) return inner;
      if (!inner) return '';
      if (/\/wp-content\/uploads\/.+\.(pdf|docx?|xlsx?|pptx?|zip)$/i.test(href)) ctx.docs.add(href.replace(/^http:/, 'https:'));
      const mapped = mapUrl(href, ctx.redirects);
      const ext = /^https?:/.test(mapped) && !OLD.test(mapped);
      return `<a href="${attrEsc(mapped)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`;
    }
    if (tag === 'td' || tag === 'th') {
      const inner = node.children.map(c => ser(c, false)).join('').trim();
      const span = ['colspan', 'rowspan'].map(a => $n.attr(a) && $n.attr(a) !== '1' ? ` ${a}="${$n.attr(a)}"` : '').join('');
      return `<${tag}${span}>${inner}</${tag}>`;
    }
    if (tag === 'details') {
      const sum = $n.children('summary').first();
      const rest = node.children.filter(c => c !== sum[0]);
      let body = serChildren(rest, true);
      const sumText = sum.text().trim();
      body = body.replace(/^<h[2-5]>([^<]*)<\/h[2-5]>/, (m, t) => t.trim().toLowerCase() === sumText.toLowerCase() ? '' : m);
      if (!body.replace(/<[^>]+>/g, '').trim() && !/<img|<iframe|<table/.test(body)) return `<h4>${esc(sum.text().trim())}</h4>`;
      return `<details${$n.attr('open') !== undefined ? ' open' : ''}><summary>${esc(sum.text().trim())}</summary>${body}</details>`;
    }
    if (KEEP.has(tag)) {
      const block = !INLINE.has(tag);
      const inner = (['ul', 'ol', 'li', 'blockquote', 'figure', 'dd', 'td', 'th'].includes(tag) ? serChildren(node.children, tag !== 'li' ? true : 'li') : node.children.map(c => ser(c, false)).join('')).trim();
      if (tag === 'br') return '<br>';
      if (!inner && !['td', 'th'].includes(tag)) return '';
      if (/^h[2-5]$/.test(tag)) return `<${tag}>${inner.replace(/<br>/g, ' ').replace(/<\/?(strong|em|u)>/g, '')}</${tag}>`;
      const a = tag === 'ol' && $n.attr('start') ? ` start="${$n.attr('start')}"` : '';
      return `<${tag}${a}>${inner}</${tag}>` + (block ? '' : '');
    }
    // unwrap everything else
    if (INLINE.has(tag)) return node.children.map(c => ser(c, false)).join('');
    return serChildren(node.children, true);
  }

  // Serialise children of a block container: wrap loose inline runs in <p>
  function serChildren(children, wrap) {
    let out = ''; let run = '';
    const flush = () => {
      const t = run.replace(/^(\s|<br>)+|(\s|<br>)+$/g, '').trim();
      if (t && t.replace(/<[^>]+>/g, '').trim() || /<img|<iframe/.test(t)) out += wrap === true ? `<p>${t}</p>` : t;
      run = '';
    };
    for (const c of children) {
      const isInline = c.type === 'text' || (c.type === 'tag' && INLINE.has(c.tagName.toLowerCase()) && !$(c).is('a.person'));
      if (isInline) run += ser(c, false);
      else { flush(); out += ser(c, true); }
    }
    flush();
    return out;
  }

  let out = serChildren($('#__root')[0].children, true);
  // tidy up
  out = out
    .replace(/<p>\s*(<br>\s*)*<\/p>/g, '')
    .replace(/(<br>\s*){3,}/g, '<br><br>')
    .replace(/<p>(<img[^>]+>)<\/p>/g, '<figure>$1</figure>')
    .replace(/<figure>\s*<figure>([\s\S]*?)<\/figure>\s*<\/figure>/g, '<figure>$1</figure>')
    .replace(/<p>\s*(<iframe[^>]*><\/iframe>)\s*<\/p>/g, '$1')
    .replace(/(<\/span><\/(div|a)>|<\/strong><\/(div|a)>)<\/div><div class="people">/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/<p> /g, '<p>').replace(/ <\/p>/g, '</p>');
  return out.trim();
}

function bestSrcVideo($v) {
  const s = $v.attr('src') || $v.find('source').attr('src') || '';
  return s.replace(/^\/\//, 'https://');
}
