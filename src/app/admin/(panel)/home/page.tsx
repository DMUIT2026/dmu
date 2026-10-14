import HomeEditor from '@/components/admin/HomeEditor';
import { requireAdmin } from '@/lib/admin-auth';
import type { Settings } from '@/lib/types';

export default async function HomeSettings() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('settings').select('key,value');
  const all = Object.fromEntries((data ?? []).map(r => [r.key, r.value])) as Record<string, unknown>;
  const fix = (s: Settings) => {
    s.home_hero ??= { slides: [] }; s.home_stats ??= { title: '', items: [] }; s.home_alumni ??= { title: '', logos: [] };
    s.contact ??= { phone: '', phone_link: '', email: '', address: '' }; s.social ??= []; s.home_colleges ??= [];
    return s;
  };
  const en = fix(Object.fromEntries(Object.entries(all).filter(([k]) => !k.endsWith('_ar'))) as unknown as Settings);
  const ar = fix(Object.fromEntries(Object.entries(all).filter(([k]) => !k.endsWith('_ar')).map(([k, v]) => [k, all[k + '_ar'] ?? v])) as unknown as Settings);
  return <HomeEditor initial={en} initialAr={ar} />;
}
