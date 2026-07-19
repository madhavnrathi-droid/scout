// POST /api/ai-search — conversational search over the LIVE opportunity feed.
// Frontend sends { q, profile } and expects { text } (HTML-ish snippet).
import { callLLM } from './_lib/llm.js';
import { getFeed, searchFeed } from './_lib/feed.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const body = req.body || {};
  const { q, profile } = typeof body === 'string' ? JSON.parse(body) : body;
  const query = (q || '').toString().trim();
  if (!query) return res.status(400).json({ error: 'q required' });

  // Pre-filter the live feed to keep the prompt small and ground answers in real listings.
  const feed = await getFeed();
  const hits = searchFeed(feed.items, query).slice(0, 5);

  const catalog = (hits.length ? hits : feed.items.slice(0, 6))
    .map((o) => `- ${o.title} (${o.org}) · ${o.type} · ${o.location} · deadline ${o.deadline} (${o.days_left}d left) · ${o.prize} · ${o.applied ? o.applied + ' registered' : 'new'}`)
    .join('\n');

  const system =
    'You help Indian students find opportunities. Answer in 2-4 sentences, concrete and warm. ' +
    'Recommend ONLY from the provided listings — never invent opportunities. ' +
    'Lead with the single best match for the query. ' +
    'FORMAT: output is rendered as raw HTML inline — NEVER use markdown (*, -, #, backticks) or LaTeX; ' +
    'plain sentences with <b>bold</b> for opportunity names only.';
  const userMsg =
    `Query: "${query}"\n` +
    (profile ? `User: ${profile.role || ''} interested in ${(profile.domains || []).join(', ')}.\n` : '') +
    `Available listings:\n${catalog}`;

  const ai = await callLLM({ system, messages: [{ role: 'user', content: userMsg }], max_tokens: 400 });
  if (ai.ok) return res.status(200).json({ text: ai.text });

  return res.status(200).json({ text: fallback(query, hits), fallback: true });
}

function fallback(query, hits) {
  if (!hits.length) {
    return `I couldn’t find an exact match for <b>"${query}"</b>. Try a category (fellowship, hackathon, grant) or a domain (AI/ML, biotech, policy).`;
  }
  const top = hits[0];
  const rest = hits.slice(1, 3).map((h) => `<b>${h.title}</b>`).join(' and ');
  return (
    `For <b>"${query}"</b>, your strongest match is <b>${top.title}</b> (${top.org}) — ${top.type}, ${top.location}, deadline ${top.deadline}.` +
    (rest ? ` Also worth a look: ${rest}.` : '')
  );
}
