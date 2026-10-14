import type { Metadata } from 'next';

export const metadata: Metadata = { title: { default: 'DMU Admin', template: '%s · DMU Admin' }, robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f6f4ef] text-ink">{children}</div>;
}
