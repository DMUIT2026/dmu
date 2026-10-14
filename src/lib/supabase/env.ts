export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
/** When "local", the public site reads the copied content from migration/data instead of Supabase (preview only). */
export const CONTENT_SOURCE = process.env.CONTENT_SOURCE === 'local' ? 'local' : 'supabase';
