import { notFound } from 'next/navigation';
import PersonEditor from '@/components/admin/PersonEditor';
import { requireAdmin } from '@/lib/admin-auth';
import type { Person } from '@/lib/types';

export default async function EditPerson({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  let person: Person = { name: '', bio: '', in_directory: true, status: 'published' };
  if (id !== 'new') {
    const { data } = await supabase.from('people').select('*').eq('id', id).maybeSingle();
    if (!data) notFound();
    person = data as Person;
  }
  return <PersonEditor initial={person} />;
}
