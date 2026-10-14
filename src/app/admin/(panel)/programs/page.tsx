import ProgramsEditor from '@/components/admin/ProgramsEditor';
import { requireAdmin } from '@/lib/admin-auth';
import type { Program } from '@/lib/types';

export default async function ProgramsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('programs').select('*').order('sort_order');
  return <ProgramsEditor initial={(data as Program[]) ?? []} />;
}
