import { NextResponse, type NextRequest } from 'next/server';
import { serverClient } from '@/lib/supabase/server';

// Finishes sign-in from email links (invitations and password resets).
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/admin';
  if (code) {
    const supabase = await serverClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(next.startsWith('/') ? next : '/admin', url.origin));
}
