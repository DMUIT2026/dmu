// Small brand marks drawn inline (no external icon set needed)
export function SocialIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  const p = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true } as const;
  if (n.includes('facebook')) return <svg {...p}><path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H7v4h2v9h4v-9h3l1-4h-4V9c0-.6.4-1 1-1z" /></svg>;
  if (n.includes('twitter') || n === 'x') return <svg {...p}><path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.5l11.2 14.5z" /></svg>;
  if (n.includes('linkedin')) return <svg {...p}><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3V9.5zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.5z" /></svg>;
  if (n.includes('instagram')) return <svg {...p} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>;
  if (n.includes('youtube')) return <svg {...p}><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15.1V8.9l5.7 3.1-5.7 3.1z" /></svg>;
  return <span className="text-xs">{name[0]}</span>;
}
