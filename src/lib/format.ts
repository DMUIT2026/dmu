export const fmtDate = (d?: string | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  d ? new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'Asia/Dubai' }).format(new Date(d)) : '';
export const stripHtml = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
export const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);
