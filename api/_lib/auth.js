// Scout — account + session primitives (node:crypto only, no dependencies).
//
// Passwords: scrypt (N=16384) with a per-user 16-byte salt, compared in constant time.
// Sessions:  compact HMAC-SHA256 signed tokens — <base64url(payload)>.<base64url(sig)>.
//            Stateless, so a session survives without a session table.
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';

const SESSION_DAYS = 60;
const secret = () => process.env.AUTH_SECRET || '';

export const normEmail = (e) => String(e || '').trim().toLowerCase();
export const emailOk = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(normEmail(e));

export function hashPassword(password) {
  const salt = randomBytes(16);
  const dk = scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('hex')}$${dk.toString('hex')}`;
}
export function verifyPassword(password, stored) {
  try {
    const [scheme, saltHex, hashHex] = String(stored || '').split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
    const dk = scryptSync(String(password), Buffer.from(saltHex, 'hex'), 64, { N: 16384, r: 8, p: 1 });
    const want = Buffer.from(hashHex, 'hex');
    return dk.length === want.length && timingSafeEqual(dk, want);
  } catch { return false; }
}

const b64u = (buf) => Buffer.from(buf).toString('base64url');
export function signSession(uid) {
  const payload = b64u(JSON.stringify({ uid, exp: Date.now() + SESSION_DAYS * 864e5 }));
  const sig = b64u(createHmac('sha256', secret()).update(payload).digest());
  return `${payload}.${sig}`;
}
export function readSession(tokenStr) {
  try {
    const [payload, sig] = String(tokenStr || '').split('.');
    if (!payload || !sig) return null;
    const want = b64u(createHmac('sha256', secret()).update(payload).digest());
    const a = Buffer.from(sig), b = Buffer.from(want);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.uid || !data.exp || Date.now() > data.exp) return null;
    return data;
  } catch { return null; }
}
/** pull a session from the Authorization header */
export function sessionFrom(req) {
  const h = req.headers.authorization || req.headers.Authorization || '';
  return readSession(String(h).replace(/^Bearer\s+/i, ''));
}

/** college-domain detection — powers the "verified student" badge */
const KNOWN = {
  'iitm.ac.in': 'IIT Madras', 'iitb.ac.in': 'IIT Bombay', 'iitd.ac.in': 'IIT Delhi',
  'iitk.ac.in': 'IIT Kanpur', 'iitkgp.ac.in': 'IIT Kharagpur', 'iitr.ac.in': 'IIT Roorkee',
  'nitt.edu': 'NIT Trichy', 'nitk.edu.in': 'NIT Surathkal', 'bits-pilani.ac.in': 'BITS Pilani',
  'iisc.ac.in': 'IISc Bengaluru', 'du.ac.in': 'Delhi University', 'vit.ac.in': 'VIT',
  'manipal.edu': 'Manipal', 'srmist.edu.in': 'SRM', 'christuniversity.in': 'Christ University',
};
export function institutionFor(email) {
  const dom = normEmail(email).split('@')[1] || '';
  if (KNOWN[dom]) return { name: KNOWN[dom], verified: true };
  if (/\.(ac\.in|edu|edu\.in)$/.test(dom)) return { name: dom.split('.')[0].toUpperCase(), verified: true };
  return null;
}
