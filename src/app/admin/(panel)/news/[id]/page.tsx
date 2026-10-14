import { notFound } from 'next/navigation';
import PostEditor from '@/components/admin/PostEditor';
import { requireAdmin } from '@/lib/admin-auth';
import type { Post } from '@/lib/types';

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: cats } = await supabase.from('categories').select('slug,name').order('sort_order');
  let post: Post = { slug: '', title: '', content: '', categories: [], status: 'draft', published_at: new Date().toISOString() };
  if (id !== 'new') {
    const { data } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
    if (!data) notFound();
    post = data as Post;
  }
  return <PostEditor initial={post} categories={cats ?? []} />;
}
