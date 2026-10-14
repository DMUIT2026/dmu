// Uploads local image/document files to Supabase Storage and the media library. Prints each public link.
// usage: npx tsx scripts/upload-files.ts path/to/file.jpg [more files]
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { lookup } from 'mime-types';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
(async () => {
  for (const f of process.argv.slice(2)) {
    const key = `library/${new Date().getFullYear()}/${path.basename(f).toLowerCase().replace(/[^a-z0-9._-]+/g, '-')}`;
    const mime = lookup(f) || 'application/octet-stream';
    const body = fs.readFileSync(f);
    const { error } = await sb.storage.from('media').upload(key, body, { contentType: mime, upsert: true, cacheControl: '31536000' });
    if (error) { console.log(f, 'FAILED', error.message); continue; }
    const url = sb.storage.from('media').getPublicUrl(key).data.publicUrl;
    await sb.from('media').upsert({ path: key, url, name: path.basename(f), mime, size: body.length }, { onConflict: 'path' });
    console.log(url);
  }
})();
