import sanitizeHtml from 'sanitize-html';

const allowed: sanitizeHtml.IOptions = {
  allowedTags: ['h2', 'h3', 'h4', 'h5', 'p', 'br', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'u', 's', 'sup', 'sub', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col', 'blockquote', 'iframe', 'video', 'source',
    'details', 'summary', 'dl', 'dt', 'dd', 'hr', 'div', 'span', 'code', 'pre', 'mark'],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'class'], img: ['src', 'alt', 'width', 'height', 'loading'], iframe: ['src', 'allowfullscreen', 'loading', 'title'],
    video: ['src', 'controls', 'preload', 'poster'], source: ['src', 'type'], td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan'],
    ol: ['start'], details: ['open'], div: ['class', 'id'], figure: ['class'], span: ['class'], p: ['style'], h2: ['style'], h3: ['style'], h4: ['style'],
  },
  allowedStyles: { '*': { 'text-align': [/^(left|right|center|justify)$/] } },
  allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com', 'www.google.com', 'maps.google.com', 'docs.google.com', 'forms.office.com', 'app.powerbi.com', 'view.officeapps.live.com', 'oppeygclkxogrsmsafng.supabase.co'],
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
};

export function prepareHtml(html: string, locale: 'en' | 'ar' = 'en') {
  let out = sanitizeHtml(html ?? '', allowed);
  if (locale === 'ar') out = out.replace(/href="\/(?!ar\/|ar"|admin)/g, 'href="/ar/');
  return out
    .replace(/<table/g, '<div class="table-wrap"><table').replace(/<\/table>/g, '</table></div>')
    .replace(/<img /g, '<img loading="lazy" ');
}

export default function RichText({ html, className = '', locale = 'en' }: { html: string; className?: string; locale?: 'en' | 'ar' }) {
  return <div className={`prose-dmu ${className}`} dangerouslySetInnerHTML={{ __html: prepareHtml(html, locale) }} />;
}
