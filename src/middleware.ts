import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// 1) Public pages: English lives at normal addresses, Arabic under /ar. Internally every page sits under /en or /ar.
// 2) Admin: keeps the login session fresh and sends signed-out visitors to the login page.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/admin')) {
    if (pathname === '/en' || pathname.startsWith('/en/')) {
      const url = req.nextUrl.clone(); url.pathname = pathname.slice(3) || '/';
      return NextResponse.redirect(url, 308);
    }
    if (pathname === '/ar' || pathname.startsWith('/ar/')) return NextResponse.next();
    const url = req.nextUrl.clone(); url.pathname = '/en' + (pathname === '/' ? '' : pathname);
    return NextResponse.rewrite(url);
  }

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const isLogin = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/auth');
  if (!user && !isLogin) {
    const url = req.nextUrl.clone(); url.pathname = '/admin/login'; url.search = '';
    return NextResponse.redirect(url);
  }
  return res;
}

// everything except Next.js internals, files with an extension (images, icons…) and API routes
export const config = { matcher: ['/((?!_next/|api/|.*\\.[\\w]+$).*)'] };
