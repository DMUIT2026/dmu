import { requireAdmin } from '@/lib/admin-auth';
import { PageTitleStatic } from '@/components/admin/static';
import ScopusForm from '@/components/admin/ScopusForm';
import { DEFAULT_AFFILIATIONS } from '@/lib/scopus';

export default async function ResearchSettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('private_settings').select('key,value').in('key', ['scopus_api_key', 'scopus_insttoken', 'scopus_affiliations']);
  const m = Object.fromEntries((data ?? []).map(r => [r.key, String(r.value ?? '')]));
  const [{ count: people }, { count: pages }] = await Promise.all([
    supabase.from('people').select('id', { count: 'exact', head: true }).not('scopus_author_id', 'is', null),
    supabase.from('pages').select('id', { count: 'exact', head: true }).not('meta->>scopus_author_id', 'is', null),
  ]);
  const key = m.scopus_api_key ?? '';
  return (
    <>
      <PageTitleStatic title="Research (Scopus)" subtitle="Publications and researcher metrics come straight from Elsevier Scopus and refresh every day — no manual updates." />
      <ScopusForm hasKey={!!key} keyHint={key ? '…' + key.slice(-4) : ''} hasToken={!!m.scopus_insttoken} affiliations={m.scopus_affiliations || DEFAULT_AFFILIATIONS} />
      <section className="mt-8 rounded-2xl border border-line bg-white p-5 text-sm leading-relaxed">
        <p className="font-medium">How it works</p>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-stone-500">
          <li>The DMU Publications pages list every DMU publication in Scopus, newest first, filterable by college and year.</li>
          <li>Each faculty or research profile with a Scopus Author ID shows a live box with publications, citations, h-index and the latest papers. Profiles with an ID now: {people ?? 0} staff profiles, {pages ?? 0} research profile pages.</li>
          <li>To add or correct someone&apos;s ID, open their profile (Faculty &amp; Staff, or the research profile page) and fill in “Scopus Author ID”.</li>
          <li>Without a key, the publication list still works through the research office&apos;s service, but researcher metrics are hidden.</li>
        </ul>
      </section>
    </>
  );
}
