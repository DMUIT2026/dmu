'use client';
import { browserClient } from './supabase/browser';

/** Uploads a file to the "media" storage bucket and records it in the media library. */
export async function uploadFile(file: File): Promise<{ url: string; path: string }> {
  const supabase = browserClient();
  const d = new Date();
  const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const path = `library/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${Date.now().toString(36)}-${safe}`;
  const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '31536000', contentType: file.type, upsert: false });
  if (error) throw error;
  const url = supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
  await supabase.from('media').insert({ path, url, name: file.name, mime: file.type, size: file.size });
  return { url, path };
}
