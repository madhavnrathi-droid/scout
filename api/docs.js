// Scout — /api/docs
// The documents vault: photo, signature, marksheets, certificates, resume.
// POST { action:'put', slot, name, mime, data(base64) }  → stores encrypted
// POST { action:'get', slot }                            → returns the document
// POST { action:'del', slot }                            → removes it
// POST { action:'list' }                                 → slot index (no bytes)
// Everything is AES-encrypted by the store layer before it touches the (public) blob,
// and every key is namespaced to the signed-in user.
import { kvGet, kvSet, kvDel, configured } from './_lib/store.js';
import { sessionFrom } from './_lib/auth.js';

export const SLOTS = ['photo', 'signature', 'marksheet10', 'marksheet12', 'degree', 'resume', 'idproof', 'category', 'other1', 'other2'];
const SLOT_RE = /^(photo|signature|marksheet10|marksheet12|degree|resume|idproof|category|other1|other2|cert-\d{6,16})$/;
const MAX_SLOTS = 40;
const MAX_BYTES = 2.6e6;      // ~2.6MB base64 ≈ 2MB file — compressed client-side first

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type, authorization');
  res.setHeader('cache-control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!configured()) return res.status(503).json({ error: 'documents are not configured on this deployment' });

  const s = sessionFrom(req);
  if (!s) return res.status(401).json({ error: 'not signed in' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { action, slot } = body;
  const idxKey = `docsidx:${s.uid}`;

  try {
    if (action === 'list') {
      let idx;
      try { idx = (await kvGet(idxKey)) || { slots: {} }; }
      catch { return res.status(503).json({ error: 'storage unavailable' }); }
      return res.status(200).json({ ok: true, slots: idx.slots });
    }

    if (!SLOT_RE.test(String(slot || ''))) return res.status(400).json({ error: 'unknown document slot' });
    const docKey = `doc:${s.uid}:${slot}`;

    if (action === 'put') {
      const { name, mime, data } = body;
      { let idx0; try { idx0 = (await kvGet(idxKey)) || { slots: {} }; } catch { idx0 = { slots: {} }; }
        if (!idx0.slots[slot] && Object.keys(idx0.slots).length >= MAX_SLOTS) return res.status(400).json({ error: 'Document vault is full (40) — remove something first' }); }
      if (!data || typeof data !== 'string') return res.status(400).json({ error: 'no file data' });
      if (data.length > MAX_BYTES) return res.status(413).json({ error: 'File too large — Scout compresses images automatically, but this one is still over 2MB' });
      if (!/^[A-Za-z0-9+/=]+$/.test(data.slice(0, 400))) return res.status(400).json({ error: 'bad encoding' });
      await kvSet(docKey, { name: String(name || slot).slice(0, 80), mime: String(mime || '').slice(0, 60), data, ts: Date.now() });
      let idx; try { idx = (await kvGet(idxKey)) || { slots: {} }; } catch { idx = { slots: {} }; }
      idx.slots[slot] = { name: String(name || slot).slice(0, 80), mime: String(mime || '').slice(0, 60), bytes: Math.round(data.length * 0.75), ts: Date.now() };
      await kvSet(idxKey, idx);
      return res.status(200).json({ ok: true, slots: idx.slots });
    }

    if (action === 'meta') {
      let idx; try { idx = (await kvGet(idxKey)) || { slots: {} }; } catch { idx = { slots: {} }; }
      if (idx.slots[slot]) {
        idx.slots[slot] = { ...idx.slots[slot], kind: String(body.kind || '').slice(0, 40), summary: String(body.summary || '').slice(0, 220) };
        await kvSet(idxKey, idx);
      }
      return res.status(200).json({ ok: true, slots: idx.slots });
    }

    if (action === 'get') {
      let doc;
      try { doc = await kvGet(docKey, { expect: true }); }
      catch { return res.status(503).json({ error: 'storage unavailable' }); }
      if (!doc) return res.status(404).json({ error: 'no document in that slot' });
      return res.status(200).json({ ok: true, doc });
    }

    if (action === 'del') {
      await kvDel(docKey);
      let idx; try { idx = (await kvGet(idxKey)) || { slots: {} }; } catch { idx = { slots: {} }; }
      delete idx.slots[slot];
      await kvSet(idxKey, idx);
      return res.status(200).json({ ok: true, slots: idx.slots });
    }

    return res.status(400).json({ error: 'unknown action' });
  } catch (err) {
    return res.status(500).json({ error: 'docs failed', detail: String(err && err.message || err).slice(0, 120) });
  }
}
