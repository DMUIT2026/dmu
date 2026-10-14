'use server';
import { publicClient } from '@/lib/supabase/public';

export async function sendMessage(_: unknown, form: FormData): Promise<{ ok: boolean; error?: string }> {
  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const body = String(form.get('message') ?? '').trim();
  if (form.get('website')) return { ok: true }; // spam trap
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || body.length < 5) return { ok: false, error: 'Please fill in your name, a valid email and a message.' };
  const { error } = await publicClient().from('messages').insert({
    name, email, body, phone: String(form.get('phone') ?? '').trim() || null, subject: String(form.get('subject') ?? '').trim() || null,
  });
  if (error) return { ok: false, error: 'Sorry, your message could not be sent. Please email info@dmu.ae.' };
  return { ok: true };
}
