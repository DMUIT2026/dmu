'use client';
import { useActionState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { sendMessage } from '@/app/actions';

export default function ContactForm() {
  const [state, action, pending] = useActionState(sendMessage, null);
  if (state?.ok) return (
    <div className="flex items-start gap-4 rounded-[var(--radius-card)] border border-line bg-white p-8">
      <CheckCircle2 className="size-7 shrink-0 text-bronze-600" />
      <div><p className="font-display text-2xl">Thank you</p><p className="mt-2 text-stone-500">Your message has been sent. Our team will get back to you soon.</p></div>
    </div>
  );
  const input = 'w-full rounded-xl border border-line bg-sand-50 px-4 py-3 outline-none transition focus:border-gold-500 focus:bg-white';
  return (
    <form action={action} className="grid gap-4 rounded-[var(--radius-card)] border border-line bg-white p-6 md:p-8 shadow-[var(--shadow-soft)]">
      <p className="font-display text-2xl">Send us a message</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">Full name<input name="name" required className={input} autoComplete="name" /></label>
        <label className="grid gap-1.5 text-sm font-medium">Email<input name="email" type="email" required className={input} autoComplete="email" /></label>
        <label className="grid gap-1.5 text-sm font-medium">Phone (optional)<input name="phone" className={input} autoComplete="tel" /></label>
        <label className="grid gap-1.5 text-sm font-medium">Subject<input name="subject" className={input} /></label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">Message<textarea name="message" required rows={5} className={input} /></label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn btn-dark justify-self-start disabled:opacity-60">{pending ? 'Sending…' : 'Send message'}</button>
    </form>
  );
}
