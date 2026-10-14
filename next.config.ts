import type { NextConfig } from 'next';
import fs from 'fs';
import path from 'path';

// Old WordPress addresses (dmu.ae/home/...) keep working: they are forwarded to the new pages.
function legacyRedirects() {
  const file = path.join(process.cwd(), 'migration', 'data', 'redirects.json');
  const map: Record<string, string> = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const strip = (u: string) => u.replace(/^https?:\/\/(www\.)?dmu\.ae\/home/, '').replace(/\/$/, '') || '/';
  const target = (u: string) => {
    const p = strip(u);
    return p.replace(/^\/blog-post\//, '/news/').replace(/^\/program-post\//, '/people/').replace(/^\/blog-category\//, '/news/category/').replace(/\/page\/\d+$/, '');
  };
  const seen = new Set<string>();
  return Object.entries(map)
    .map(([from, to]) => ({ source: strip(from), destination: target(to), permanent: true }))
    .filter(r => r.source !== '/' && !r.source.includes('?') && r.source !== r.destination && !seen.has(r.source) && seen.add(r.source))
    .filter(r => /^\/[\w\-./]+$/.test(r.source));
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'dmu.ae' },
      { protocol: 'https', hostname: 'oppeygclkxogrsmsafng.supabase.co' },
      { protocol: 'https', hostname: 'dpc.edu' },
      { protocol: 'https', hostname: 'dmcg.edu' },
    ],
    // WebP is quick to produce; converted copies are kept for a year
    formats: ['image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920],
  },
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/home/blog-post/:slug', destination: '/news/:slug', permanent: true },
      { source: '/home/blog-post', destination: '/news', permanent: true },
      { source: '/home/blog', destination: '/news', permanent: true },
      { source: '/home/blog-category/:slug', destination: '/news/category/:slug', permanent: true },
      { source: '/home/category/:slug', destination: '/news/category/:slug', permanent: true },
      { source: '/home/program-post/:slug', destination: '/people/:slug', permanent: true },
      ...legacyRedirects(),
      { source: '/home/:path*', destination: '/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
