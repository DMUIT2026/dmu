import HomeEditor from '@/components/admin/HomeEditor';
import { requireAdmin } from '@/lib/admin-auth';
import type { Settings } from '@/lib/types';

export default async function HomeSettings() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('settings').select('key,value');
  const s = Object.fromEntries((data ?? []).map(r => [r.key, r.value])) as unknown as Settings;
  s.home_hero ??= { slides: [] }; s.home_stats ??= { title: '', items: [] }; s.home_alumni ??= { title: '', logos: [] };
  s.contact ??= { phone: '', phone_link: '', email: '', address: '' }; s.social ??= []; s.home_colleges ??= [];
  return <HomeEditor initial={s} />;
}
