export const fmtDate = (d?: string | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  d ? new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'Asia/Dubai' }).format(new Date(d)) : '';
export const stripHtml = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
export const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);

import type { ArticleImage } from './types';
const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
/** Places a news article's extra photos (top / middle / end) into its text. */
export function placeArticleImages(html: string, images: ArticleImage[] | null | undefined, ar = false) {
  if (!images?.length) return html;
  const fig = (i: ArticleImage) => {
    const cap = (ar && i.caption_ar) || i.caption;
    return `<figure class="news-img news-img--${i.size} news-img--${i.align}"><img src="${escAttr(i.url)}" alt="${escAttr(cap ?? '')}">${cap ? `<figcaption>${escAttr(cap)}</figcaption>` : ''}</figure>`;
  };
  const at = (p: ArticleImage['place']) => images.filter(i => i.place === p).map(fig).join('');
  const parts = html.split('</p>');
  let body = html;
  const mid = at('middle');
  if (mid) {
    if (parts.length > 2) { const k = Math.floor((parts.length - 1) / 2); body = parts.slice(0, k).join('</p>') + '</p>' + mid + parts.slice(k).join('</p>'); }
    else body = html + mid;
  }
  return at('top') + body + at('end');
}
