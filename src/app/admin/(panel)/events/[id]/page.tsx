import { notFound } from 'next/navigation';
import EventEditor from '@/components/admin/EventEditor';
import { requireAdmin } from '@/lib/admin-auth';
import type { DmuEvent } from '@/lib/types';

export default async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  let ev: DmuEvent = { title: '', description: '', starts_on: new Date().toISOString().slice(0, 10), category: 'event', status: 'draft' };
  if (id !== 'new') {
    const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
    if (!data) notFound();
    ev = data as DmuEvent;
  }
  return <EventEditor initial={ev} />;
}
