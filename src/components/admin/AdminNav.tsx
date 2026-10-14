'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { CalendarDays, ExternalLink, FileText, Home, Image as ImageIcon, Languages, LayoutDashboard, ListTree, LogOut, Mail, Menu, Newspaper, GraduationCap, UserCog, Users, X } from 'lucide-react';
import { signOut } from '@/app/admin/actions';

const items = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pages', label: 'Pages', icon: FileText },
  { href: '/admin/news', label: 'News', icon: Newspaper },
  { href: '/admin/events', label: 'Events calendar', icon: CalendarDays },
  { href: '/admin/people', label: 'Faculty & Staff', icon: Users },
  { href: '/admin/programs', label: 'Programmes', icon: GraduationCap },
  { href: '/admin/home', label: 'Home page & contact', icon: Home },
  { href: '/admin/menus', label: 'Menus', icon: ListTree },
  { href: '/admin/media', label: 'Images & files', icon: ImageIcon },
  { href: '/admin/messages', label: 'Messages', icon: Mail },
  { href: '/admin/translation', label: 'Arabic translation', icon: Languages },
  { href: '/admin/users', label: 'Admin users', icon: UserCog },
];

export default function AdminNav({ email, unread }: { email: string; unread: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/admin"><Image src="/brand/logo.png" alt="DMU" width={150} height={48} className="h-10 w-auto" /></Link>
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
      </div>
      <ul className="flex-1 space-y-0.5 px-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? path === '/admin' : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[.93rem] transition ${active ? 'bg-espresso text-white' : 'text-ink/75 hover:bg-white hover:text-ink'}`}>
                <Icon className="size-[18px]" />{label}
                {href === '/admin/messages' && unread > 0 && <span className="ml-auto rounded-full bg-gold-500 px-2 py-0.5 text-xs font-semibold text-espresso">{unread}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-line p-3">
        <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/75 hover:bg-white"><ExternalLink className="size-4" />View website</a>
        <Link href="/admin/account" className="block truncate rounded-xl px-3 py-2 text-xs text-stone-500 hover:bg-white">{email}</Link>
        <form action={signOut}><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/75 hover:bg-white"><LogOut className="size-4" />Sign out</button></form>
      </div>
    </nav>
  );
  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-[#f6f4ef]/95 px-4 py-3 backdrop-blur lg:hidden">
        <Image src="/brand/logo.png" alt="DMU" width={120} height={40} className="h-8 w-auto" />
        <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-6" /></button>
      </div>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-line bg-[#efebe2] lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-[#efebe2]">{nav}</aside>
        </div>
      )}
    </>
  );
}
