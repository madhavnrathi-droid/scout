// Scout — /api/extract
// Reads an uploaded document IMAGE (marksheet, ID, certificate) with a vision model
// and returns the structured fields a form would ask for — so the user never types
// what a document already says. Groq's OpenAI-compatible endpoint with Llama-4 Scout
// (multimodal) does the reading; we never store the model's raw output.
import { sessionFrom } from './_lib/auth.js';

// vision-capable model ids differ per provider — discover them from /models at runtime
const VISION_FALLBACK = ['qwen/qwen3.6-27b', 'meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct'];
const VISION_RE = /qwen3|qwen.*vl|llama-4|scout|maverick|vision|llava|pixtral|gemma-3|internvl/i;
async function visionModels(base, key) {
  try {
    const r = await fetch(`${base}/models`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return VISION_FALLBACK;
    const j = await r.json();
    const ids = (j.data || []).map((m) => m.id).filter((id) => VISION_RE.test(id));
    return ids.length ? ids.slice(0, 4) : VISION_FALLBACK;
  } catch { return VISION_FALLBACK; }
}

const PROMPT = `Read this document image (likely an Indian marksheet, certificate, or ID). Extract ONLY what is actually printed — never guess. Return a JSON object with any of these keys you can read (omit the rest):
name, fatherName, motherName, dob (YYYY-MM-DD), rollNo, board (e.g. CBSE, ICSE, Maharashtra State Board), school, examYear, percentage (overall % as a number), cgpa, subjects (array of {subject, marks}), stream (Science/Commerce/Arts), degree, university, docType (one of: marksheet10, marksheet12, degree, id, certificate, other),
kind (a 2-4 word classification, e.g. "NCC A certificate", "hackathon winner", "internship completion", "sports achievement", "language proficiency"),
summary (ONE sentence: what this document certifies, with the issuing body and year if visible — written so an application-writing assistant can cite it).
Return the JSON object only — no prose, no code fences.`;

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type, authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!sessionFrom(req)) return res.status(401).json({ error: 'not signed in' });

  const key = process.env.OPENAI_COMPAT_KEY;
  if (!key) return res.status(503).json({ error: 'document reading is not configured' });
  const base = (process.env.OPENAI_COMPAT_BASE || 'https://api.groq.com/openai/v1').replace(/\/$/, '');

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { data, mime } = body;
  if (!data || !/^image\//.test(mime || '')) return res.status(400).json({ error: 'send an image (photos of documents work; for PDFs, upload a photo/screenshot of the page)' });
  if (data.length > 3e6) return res.status(413).json({ error: 'image too large' });

  let lastDetail = '';
  const chain = body.tryModel ? [String(body.tryModel)] : await visionModels(base, key);
  for (const model of chain) {
    try {
      const r = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          max_tokens: 900,
          temperature: 0.1,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${data}` } },
            ],
          }],
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!r.ok) { lastDetail = model + ' → ' + r.status + ' ' + (await r.text()).slice(0, 140); continue; }
      const j = await r.json();
      const text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').replace(/```json|```/g, '').trim();
      const s0 = text.indexOf('{'), e0 = text.lastIndexOf('}');
      if (s0 < 0 || e0 <= s0) continue;
      const fields = JSON.parse(text.slice(s0, e0 + 1));
      return res.status(200).json({ ok: true, fields, model });
    } catch (e) { lastDetail = String(e && e.message || e).slice(0, 160); }
  }
  return res.status(502).json({ error: 'could not read this document — try a clearer photo', detail: lastDetail });
}
