// Scout — /api/auth
// POST { action: 'signup' | 'login' | 'me' | 'password', ... }
//
// Accounts live in the encrypted blob KV under two keys:
//   user:<email>  → { uid, email, name, pass, createdAt, institution, verified }
//   uid:<uid>     → the same record, so a session can resolve without knowing the email
import { kvGet, kvSet, kvSetConfirmed, configured } from './_lib/store.js';
import { hashPassword, verifyPassword, signSession, sessionFrom, normEmail, emailOk, institutionFor } from './_lib/auth.js';
import { randomUUID } from 'node:crypto';

const publicUser = (u) => ({
  uid: u.uid, email: u.email, name: u.name,
  institution: u.institution || null, verified: !!u.verified, createdAt: u.createdAt,
});

// crude but useful throttle: a few failed logins per email slows brute force
async function noteFail(email) {
  const k = `fail:${email}`;
  let rec = { n: 0, at: 0 };
  try { rec = (await kvGet(k)) || rec; } catch { /* throttle is best-effort */ }
  const fresh = Date.now() - rec.at > 15 * 60e3 ? { n: 0, at: Date.now() } : rec;
  try { await kvSet(k, { n: fresh.n + 1, at: Date.now() }); } catch { /* best-effort */ }
}
async function tooMany(email) {
  try {
    const rec = await kvGet(`fail:${email}`);
    return !!(rec && rec.n >= 8 && Date.now() - rec.at < 15 * 60e3);
  } catch { return false; }                    // never lock someone out over a read blip
}

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type, authorization');
  res.setHeader('cache-control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!configured()) return res.status(503).json({ error: 'accounts are not configured on this deployment' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const action = body.action || 'me';

  try {
    if (action === 'me') {
      const s = sessionFrom(req);
      if (!s) return res.status(401).json({ error: 'not signed in' });
      const u = await kvGet(`uid:${s.uid}`, { expect: true });
      if (!u) return res.status(401).json({ error: 'account not found' });
      return res.status(200).json({ ok: true, user: publicUser(u) });
    }

    const email = normEmail(body.email);
    if (!emailOk(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    const password = String(body.password || '');

    if (action === 'signup') {
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      const name = String(body.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Tell us your name' });
      if (await kvGet(`user:${email}`)) return res.status(409).json({ error: 'An account already uses this email — sign in instead' });

      const inst = institutionFor(email);
      const user = {
        uid: randomUUID(), email, name,
        pass: hashPassword(password),
        institution: inst ? inst.name : null,
        verified: !!(inst && inst.verified),
        createdAt: Date.now(),
      };
      await kvSetConfirmed(`user:${email}`, user);   // sign-in must work the instant this returns
      await kvSet(`uid:${user.uid}`, user);
      // the questionnaire answers captured before sign-up land with the account
      if (body.data && typeof body.data === 'object') {
        await kvSet(`data:${user.uid}`, { ...body.data, updatedAt: Date.now() });
      }
      return res.status(200).json({ ok: true, token: signSession(user.uid), user: publicUser(user) });
    }

    if (action === 'login') {
      if (await tooMany(email)) return res.status(429).json({ error: 'Too many attempts — wait 15 minutes and try again' });
      let u;
      try { u = await kvGet(`user:${email}`, { expect: true }); }
      catch { return res.status(503).json({ error: 'We could not reach storage just now — try again in a moment' }); }
      if (!u || !verifyPassword(password, u.pass)) {
        await noteFail(email);
        return res.status(401).json({ error: 'That email and password do not match' });
      }
      try { await kvSet(`fail:${email}`, { n: 0, at: Date.now() }); } catch { /* throttle reset is best-effort */ }
      return res.status(200).json({ ok: true, token: signSession(u.uid), user: publicUser(u) });
    }

    if (action === 'password') {
      const s = sessionFrom(req);
      if (!s) return res.status(401).json({ error: 'not signed in' });
      const u = await kvGet(`uid:${s.uid}`, { expect: true });
      if (!u || !verifyPassword(String(body.current || ''), u.pass)) return res.status(401).json({ error: 'Current password is wrong' });
      if (password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      const next = { ...u, pass: hashPassword(password) };
      await kvSetConfirmed(`user:${u.email}`, next);
      await kvSet(`uid:${u.uid}`, next);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'unknown action' });
  } catch (err) {
    const msg = String(err && err.message || err);
    if (/403/.test(msg)) return res.status(503).json({ error: 'Account storage is paused on the server — existing sign-ins still work, new signups resume once storage is re-activated' });
    return res.status(500).json({ error: 'auth failed', detail: msg.slice(0, 120) });
  }
}
