import { requireAdmin } from '@/lib/admin-auth';
import { PageTitleStatic } from '@/components/admin/static';
import TranslationForm from '@/components/admin/TranslationForm';
import { translatorConfig } from '@/lib/translate';

export default async function TranslationPage() {
  const { supabase } = await requireAdmin();
  const cfg = await translatorConfig(supabase);
  const { count } = await supabase.from('pages').select('id', { count: 'exact', head: true }).eq('ar_status', 'needs_review');
  const { count: posts } = await supabase.from('posts').select('id', { count: 'exact', head: true }).eq('ar_status', 'needs_review');
  return (
    <>
      <PageTitleStatic title="Arabic translation" subtitle="When English content is saved, the Arabic version is created automatically with Google Gemini." />
      <TranslationForm hasKey={!!cfg.apiKey} keyHint={cfg.apiKey ? '…' + cfg.apiKey.slice(-4) : ''} model={cfg.model} auto={cfg.auto} />
      <section className="mt-8 rounded-2xl border border-line bg-white p-5 text-sm leading-relaxed">
        <p className="font-medium">How it works</p>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-stone-500">
          <li>Write or change the English and press Save or Publish — the Arabic tab is filled in automatically.</li>
          <li>If you correct the Arabic by hand, your corrections are kept. They are only replaced when the English changes again.</li>
          <li>Use “Translate again” in the Arabic tab to redo a translation on purpose.</li>
          <li>Machine translations are marked “Needs review” until someone ticks “Arabic checked”. Waiting for review: {count ?? 0} pages, {posts ?? 0} news articles.</li>
        </ul>
      </section>
    </>
  );
}
