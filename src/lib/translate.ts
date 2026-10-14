import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Automatic English → Arabic translation with Google Gemini, using the API key the DMU team saves
 * in Admin → Translation. Runs as the signed-in admin (the key is in an admin-only table).
 */
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

const GUIDE = `You translate website content for Dubai Medical University (UAE) from English into formal Modern Standard Arabic, as used by UAE universities. Translate meaning naturally, not word for word.
Fixed terms: Dubai Medical University → جامعة دبي الطبية; College of Medicine → كلية الطب; College of Pharmacy → كلية الصيدلة; College of Nursing → كلية التمريض; College of Health Sciences → كلية العلوم الصحية; Dubai Medical College for Girls → كلية دبي الطبية للبنات; Dubai Pharmacy College → كلية دبي للصيدلة; QAIE → ضمان الجودة والفاعلية المؤسسية (QAIE); Commission for Academic Accreditation (CAA) → هيئة الاعتماد الأكاديمي (CAA); Board of Trustees → مجلس الأمناء; Vice Chancellor → نائب مدير الجامعة; Dean → العميد; Professor → أستاذ; Associate Professor → أستاذ مشارك; Assistant Professor → أستاذ مساعد; Prof. → أ.د.; Dr. → د.; Doctor of Medicine (MD) → دكتور في الطب (MD); Bachelor of Pharmacy → بكالوريوس الصيدلة; Doctor of Pharmacy (PharmD) → دكتور في الصيدلة (PharmD); Credit Hours → ساعات معتمدة; Study Plan → الخطة الدراسية; Admission Requirements → متطلبات القبول; Tuition Fees → الرسوم الدراسية; Apply Now → قدّم الآن; AED 100 → 100 درهم.
Rules: keep Western digits; translate month names; keep course codes, acronyms, product names, email addresses, links and research citations (authors, article and journal titles) unchanged; write person names in Arabic script.`;

export async function translatorConfig(supabase: SupabaseClient) {
  const { data } = await supabase.from('private_settings').select('key,value').in('key', ['gemini_api_key', 'gemini_model', 'auto_translate']);
  const m = Object.fromEntries((data ?? []).map(r => [r.key, r.value as string]));
  return { apiKey: m.gemini_api_key || '', model: m.gemini_model || DEFAULT_MODEL, auto: m.auto_translate !== 'off' };
}

/** Translates a set of named fields. Fields whose value contains HTML keep their markup exactly. */
export async function translateFields(apiKey: string, model: string, fields: Record<string, string>): Promise<Record<string, string>> {
  const keys = Object.keys(fields).filter(k => fields[k]?.trim());
  if (!keys.length) return {};
  const input = Object.fromEntries(keys.map(k => [k, fields[k]]));
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: GUIDE }] },
      contents: [{
        role: 'user',
        parts: [{
          text: 'Translate every value of this JSON object into Arabic. Return a JSON object with exactly the same keys. ' +
            'When a value is HTML, keep every tag and attribute exactly as it is (including href and src) and translate only the visible text.\n\n' +
            JSON.stringify(input),
        }],
      }],
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 65536 },
    }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(res.status === 400 || res.status === 403 ? 'The Gemini API key was not accepted. Please check it in Admin → Translation.' : `Gemini error ${res.status}: ${msg.slice(0, 200)}`);
  }
  const json = await res.json();
  const text: string = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  let out: Record<string, string>;
  try { out = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch { throw new Error('The translation came back incomplete. Please try saving again.'); }
  return Object.fromEntries(keys.filter(k => typeof out[k] === 'string' && out[k].trim()).map(k => [k, out[k]]));
}

/**
 * Called when content is saved. Translates a field when its Arabic is empty, or when the English changed
 * and nobody edited the Arabic in this save (so manual corrections are kept).
 * pairs: [englishField, arabicField]
 */
export async function autoTranslate<T extends Record<string, unknown>>(
  supabase: SupabaseClient, row: T, before: Record<string, unknown> | null, pairs: [string, string][], opts: { force?: boolean } = {},
): Promise<{ row: T; translated: number; warning?: string }> {
  const cfg = await translatorConfig(supabase);
  if (!cfg.apiKey || (!cfg.auto && !opts.force)) return { row, translated: 0 };
  const todo: Record<string, string> = {};
  for (const [en, ar] of pairs) {
    const enVal = row[en];
    if (typeof enVal !== 'string' || !enVal.replace(/<[^>]+>/g, '').trim()) continue;
    const arEmpty = !(typeof row[ar] === 'string' && (row[ar] as string).trim());
    const enChanged = !!before && before[en] !== enVal;
    const arUntouched = !before || row[ar] === before[ar];
    if (opts.force || arEmpty || (enChanged && arUntouched)) todo[en] = enVal;
  }
  if (!Object.keys(todo).length) return { row, translated: 0 };
  try {
    const out = await translateFields(cfg.apiKey, cfg.model, todo);
    const next: Record<string, unknown> = { ...row };
    for (const [en, ar] of pairs) if (out[en]) next[ar] = out[en];
    if ('ar_status' in next || pairs.some(([en]) => en === 'content')) next.ar_status = 'needs_review';
    return { row: next as T, translated: Object.keys(out).length };
  } catch (e) {
    return { row, translated: 0, warning: (e as Error).message };
  }
}
