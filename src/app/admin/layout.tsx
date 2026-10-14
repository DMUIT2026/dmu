import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Sans_Arabic, Plus_Jakarta_Sans } from 'next/font/google';
import '../globals.css';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap', axes: ['opsz', 'SOFT'] });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const plexAr = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600'], variable: '--font-plex-ar', display: 'swap' });

export const metadata: Metadata = { title: { default: 'DMU Admin', template: '%s · DMU Admin' }, robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable} ${plexAr.variable}`}>
      <body><div className="min-h-screen bg-[#f6f4ef] text-ink">{children}</div></body>
    </html>
  );
}
