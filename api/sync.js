// Scout — /api/sync
// GET  → the signed-in user's stored document
// POST → merge the client's document into storage and return the merged result
//
// The client keeps working offline against localStorage; this is the durable copy
// that makes an account portable across devices. Merges are per-record last-write-wins
// on `ts`, so two devices editing different opportunities never clobber each other.
import { kvGet, kvSet, configured } from './_lib/store.js';
import { sessionFrom } from './_lib/auth.js';

const EMPTY = { profile: null, pipe: {}, saved: [], kit: {}, accounts: {}, master: {}, threads: [], scope: 'feed', updatedAt: 0 };

function mergeDoc(remote, local) {
  const r = { ...EMPTY, ...(remote || {}) }, l = { ...EMPTY, ...(local || {}) };
  const out = { ...r };

  // pipeline: per-opportunity, newest edit wins
  const pipe = { ...(r.pipe || {}) };
  for (const [id, rec] of Object.entries(l.pipe || {})) {
    const cur = pipe[id];
    if (!cur || (rec.ts || 0) >= (cur.ts || 0)) pipe[id] = rec;
  }
  out.pipe = pipe;

  // saved is a set union, minus anything explicitly dropped from the pipeline
  out.saved = [...new Set([...(r.saved || []), ...(l.saved || [])])].filter((id) => pipe[String(id)] || (l.saved || []).includes(id));

  // documents: whichever side was touched last
  out.profile = (l.updatedAt || 0) >= (r.updatedAt || 0) ? (l.profile || r.profile) : (r.profile || l.profile);
  out.kit = { ...(r.kit || {}), ...(l.kit || {}) };
  out.accounts = { ...(r.accounts || {}), ...(l.accounts || {}) };
  out.master = { ...(r.master || {}), ...(l.master || {}) };
  out.scope = (l.updatedAt || 0) >= (r.updatedAt || 0) ? (l.scope || r.scope) : (r.scope || l.scope);

  // threads: union by id, newest kept, capped
  const byId = {};
  for (const t of [...(r.threads || []), ...(l.threads || [])]) {
    if (!t || !t.id) continue;
    if (!byId[t.id] || (t.ts || 0) >= (byId[t.id].ts || 0)) byId[t.id] = t;
  }
  out.threads = Object.values(byId).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 20);

  out.updatedAt = Date.now();
  return out;
}

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type, authorization');
  res.setHeader('cache-control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!configured()) return res.status(503).json({ error: 'sync is not configured on this deployment' });

  const s = sessionFrom(req);
  if (!s) return res.status(401).json({ error: 'not signed in' });
  const key = `data:${s.uid}`;

  try {
    if (req.method === 'GET') {
      let doc;
      try { doc = await kvGet(key); }
      catch { return res.status(503).json({ error: 'storage unavailable — your device copy is still safe' }); }
      return res.status(200).json({ ok: true, data: doc || EMPTY });
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      let remote;
      // a failed read must NOT be treated as "remote is empty" — that would overwrite another device
      try { remote = await kvGet(key); }
      catch { return res.status(503).json({ error: 'storage unavailable — nothing was overwritten' }); }
      const merged = mergeDoc(remote, body.data || {});
      await kvSet(key, merged);
      return res.status(200).json({ ok: true, data: merged });
    }
    return res.status(405).json({ error: 'GET or POST' });
  } catch (err) {
    return res.status(500).json({ error: 'sync failed', detail: String(err && err.message || err).slice(0, 120) });
  }
}
