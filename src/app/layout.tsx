import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap', axes: ['opsz', 'SOFT'] });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dmu.ae'),
  title: { default: 'Dubai Medical University', template: '%s | Dubai Medical University' },
  description:
    'Dubai Medical University (DMU) — medicine, pharmacy, nursing and health sciences education in Dubai. Shaping the next generation of health care leaders.',
  openGraph: { siteName: 'Dubai Medical University', type: 'website' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
