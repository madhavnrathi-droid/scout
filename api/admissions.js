// Scout — /api/admissions
// The admissions catalog: entrance exams, university intakes, exec programs,
// online degrees. Two sources, labelled honestly:
//   • CYCLES  — a research-verified catalog of real 2026-27 application windows
//               (web-researched July 2026; each entry carries its own status_note)
//   • ?uni=   — live university directory lookup via the keyless Hipolabs API
import { CYCLES } from './_data/admissions.js';

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('cache-control', 's-maxage=3600, stale-while-revalidate=86400');

  const q = req.query || {};

  // live university directory (name/country search)
  if (q.uni) {
    try {
      const r = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(String(q.uni).slice(0, 60))}&limit=24`, { signal: AbortSignal.timeout(8000) });
      const list = await r.json();
      return res.status(200).json({
        ok: true,
        universities: (Array.isArray(list) ? list : []).slice(0, 24).map((u) => ({
          name: u.name, country: u.country, site: (u.web_pages || [])[0] || '',
        })),
      });
    } catch { return res.status(200).json({ ok: true, universities: [] }); }
  }

  // the catalog, with computed urgency
  const now = Date.now();
  const parse = (s) => { const t = Date.parse(String(s || '')); return Number.isNaN(t) ? null : t; };
  const cycles = CYCLES.map((c, i) => {
    const closeTs = parse(c.window_close);
    const openTs = parse(c.window_open);
    const openNow = openTs && closeTs ? now >= openTs && now <= closeTs : /VERIFIED-OPEN/i.test(c.status_note || '');
    return {
      id: 'adm-' + i + '-' + String(c.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40),
      ...c,
      open_now: !!openNow,
      days_to_close: closeTs ? Math.ceil((closeTs - now) / 864e5) : null,
      days_to_open: openTs && now < openTs ? Math.ceil((openTs - now) / 864e5) : null,
    };
  }).filter((c) => c.days_to_close === null || c.days_to_close > -14);

  return res.status(200).json({ ok: true, count: cycles.length, updated: '2026-07-19', cycles });
}
