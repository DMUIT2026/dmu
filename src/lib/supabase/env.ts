export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
/**
 * "local" = read the copied content from migration/data instead of Supabase.
 * Used for previews, and automatically when Supabase is not configured, so the site never builds empty.
 */
export const CONTENT_SOURCE = process.env.CONTENT_SOURCE === 'local' || !SUPABASE_URL ? 'local' : 'supabase';
