import { getMenu, getSettings } from '@/lib/content';
import type { MenuLink } from '@/lib/types';
import HeaderClient from './HeaderClient';

export default async function Header({ overlay = false }: { overlay?: boolean }) {
  const [menu, settings] = await Promise.all([getMenu('main'), getSettings()]);
  return (
    <HeaderClient
      overlay={overlay}
      items={(menu?.items as MenuLink[]) ?? []}
      phone={settings.contact?.phone}
      phoneLink={settings.contact?.phone_link}
      portals={settings.portal_links ?? []}
    />
  );
}
