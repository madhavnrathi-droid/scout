// Scout — /api/enrich
// Turns any public URL a user connects (portfolio, Behance, YouTube channel,
// Drive file, blog…) into application-ready context: what it is, what it proves,
// and the highlights worth citing. Fetch → platform-aware extraction → LLM read.
// LinkedIn is auth-walled and is stored honestly as a URL-only credential.
import { sessionFrom } from './_lib/auth.js';
import { callLLM } from './_lib/llm.js';

const MAX_BYTES = 600e3;

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&quot;|&#\d+;|&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function meta(html, name) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)`, 'i');
  const m = html.match(re);
  return m ? m[1] : '';
}

async function fetchPage(url) {
  const r = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; ScoutBot/1.0; +https://opportune-six.vercel.app)' },
    signal: AbortSignal.timeout(12000),
    redirect: 'follow',
  });
  if (!r.ok) throw new Error('that page answered ' + r.status);
  const reader = r.body.getReader();
  let got = 0; const chunks = [];
  while (got < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); got += value.length;
  }
  try { reader.cancel(); } catch {}
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
}

/* YouTube: og tags + the channel's RSS feed gives real recent work, keylessly */
async function readYouTube(url, html) {
  const idM = html.match(/"channelId":"(UC[\w-]{20,})"/) || html.match(/channel_id=(UC[\w-]{20,})/);
  let videos = [];
  if (idM) {
    try {
      const rss = await (await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${idM[1]}`, { signal: AbortSignal.timeout(8000) })).text();
      videos = [...rss.matchAll(/<title>([^<]+)<\/title>/g)].map((m) => m[1]).slice(1, 7);
    } catch { /* fine */ }
  }
  return { extra: videos.length ? 'Recent uploads: ' + videos.join(' · ') : '' };
}

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type, authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!sessionFrom(req)) return res.status(401).json({ error: 'not signed in' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  let { url, platform } = body;
  try { url = new URL(String(url)).toString(); } catch { return res.status(400).json({ error: 'that is not a valid link' }); }
  if (!/^https?:$/.test(new URL(url).protocol)) return res.status(400).json({ error: 'http(s) links only' });
  const host = new URL(url).hostname;

  // LinkedIn walls off logged-out reads — be honest instead of pretending
  if (/linkedin\.com/.test(host)) {
    return res.status(200).json({
      ok: true, platform: 'linkedin', title: 'LinkedIn — ' + (url.split('/in/')[1] || '').replace(/\/$/, ''),
      kind: 'professional profile',
      summary: 'LinkedIn cannot be read without logging in, so Scout stores the URL and fills it into forms that ask for it.',
      highlights: [],
    });
  }

  try {
    const html = await fetchPage(url);
    const title = meta(html, 'og:title') || (html.match(/<title[^>]*>([^<]+)/i) || [])[1] || host;
    const desc = meta(html, 'og:description') || meta(html, 'description') || '';
    let extra = '';
    if (/youtube\.com|youtu\.be/.test(host)) { platform = 'youtube'; extra = (await readYouTube(url, html)).extra; }
    if (/behance\.net/.test(host)) platform = 'behance';
    if (/dribbble\.com/.test(host)) platform = 'dribbble';
    if (/drive\.google\.com|docs\.google\.com/.test(host)) platform = 'drive';
    const text = stripHtml(html).slice(0, 5500);

    const ai = await callLLM({
      system: 'You read a person\'s public page and produce application-ready context. Ground everything in the text given. Never invent projects, numbers, or followers. Return ONLY a JSON object.',
      messages: [{ role: 'user', content: `Page: ${url}\nTitle: ${title}\nDescription: ${desc}\n${extra ? extra + '\n' : ''}Visible text (truncated):\n${text}\n\nReturn JSON: {"kind": "<2-4 words: what this is, e.g. 'design portfolio', 'tech YouTube channel', 'personal blog'>", "summary": "<ONE sentence an application-writing assistant can use: what this shows about the person>", "highlights": ["<up to 4 short concrete items worth citing: project names, video titles, notable pieces>"], "use_for": "<one phrase: which kinds of applications this strengthens>"}` }],
      max_tokens: 420,
    });
    let out = { kind: platform || 'link', summary: desc.slice(0, 180), highlights: [] };
    if (ai.ok) {
      try {
        const t = ai.text.replace(/```json|```/g, '');
        const s = t.indexOf('{'), e = t.lastIndexOf('}');
        if (s >= 0 && e > s) out = { ...out, ...JSON.parse(t.slice(s, e + 1)) };
      } catch { /* keep the og fallback */ }
    }
    return res.status(200).json({ ok: true, platform: platform || 'portfolio', title: String(title).slice(0, 90), ...out });
  } catch (err) {
    return res.status(502).json({ error: 'Could not read that page — ' + String(err && err.message || err).slice(0, 80) });
  }
}
