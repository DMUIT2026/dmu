import { getMenu, getSettings } from '@/lib/content';
import type { Locale } from '@/lib/i18n';
import type { MenuLink } from '@/lib/types';
import HeaderClient from './HeaderClient';

export default async function Header({ locale, overlay = false }: { locale: Locale; overlay?: boolean }) {
  const [menu, settings] = await Promise.all([getMenu('main'), getSettings(locale)]);
  return (
    <HeaderClient
      locale={locale}
      overlay={overlay}
      items={(menu?.items as MenuLink[]) ?? []}
      phone={settings.contact?.phone}
      phoneLink={settings.contact?.phone_link}
      portals={(settings.portal_links ?? []) as { label: string; label_ar?: string; url: string }[]}
    />
  );
}
