// Scout — /api/compose
// The application composer's LLM path. Unlike /api/agent (intent router → ontology
// tools → narrative), this is a straight pass-through: the client sends a fully-formed
// drafting prompt and gets exactly what the model wrote back, with nothing wrapped
// around it. Two modes:
//   mode:'json'  → one pass over every field, must return a JSON object (autofill)
//   mode:'text'  → one field, plain prose (Draft with Scout)
import { callLLM } from './_lib/llm.js';

const SYSTEM = `You write real applications for Indian students and early-career people.
Rules you never break:
- First person, plain, specific. No clichés, no "I am writing to express my interest", no "passionate about".
- Ground every claim in the facts you are given. Never invent an award, employer, credential or number.
- If something cannot be grounded, write something honest and general instead of fabricating it.
- Character limits are targets, not ceilings: write to roughly 80% of the limit. A thin answer to a long question reads as low effort and gets rejected. Never exceed the limit.
- Return only what is asked for — no preamble, no headings, no options, no commentary.`;

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { prompt, mode = 'text', max_tokens } = body;
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt required' });

  const sys = mode === 'json'
    ? SYSTEM + '\nYou are returning a JSON object and nothing else. No code fences. No text before or after the object.'
    : SYSTEM;

  const ai = await callLLM({
    system: sys,
    messages: [{ role: 'user', content: prompt.slice(0, 12000) }],
    max_tokens: Math.min(max_tokens || (mode === 'json' ? 1600 : 500), 2000),
  });

  if (!ai.ok) return res.status(503).json({ error: 'llm unavailable', detail: ai.error || null });

  let text = (ai.text || '').trim();

  if (mode === 'json') {
    // models like to fence or chatter — dig the object out, and only answer if it parses
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
    if (s < 0 || e <= s) return res.status(502).json({ error: 'model returned no object', raw: cleaned.slice(0, 200) });
    try {
      return res.status(200).json({ ok: true, data: JSON.parse(cleaned.slice(s, e + 1)) });
    } catch (err) {
      return res.status(502).json({ error: 'model returned invalid json', raw: cleaned.slice(0, 200) });
    }
  }

  return res.status(200).json({ ok: true, text });
}
