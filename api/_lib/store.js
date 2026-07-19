// Scout — encrypted key/value store on Vercel Blob.
//
// Two properties of the underlying store shape this design:
//
//  1. The store the CLI can provision is PUBLIC — its URLs are readable by anyone
//     who knows them. So nothing sensitive is ever written in the clear: every
//     pathname is HMAC(AUTH_SECRET, key) and every value is AES-256-GCM encrypted
//     with DATA_KEY. A leaked URL yields ciphertext, not a user's data.
//
//  2. Overwriting a blob is eventually consistent — a re-read can serve the previous
//     value for up to a minute, which would silently resurrect stale pipelines and
//     lose saves. So values are never overwritten. Each write lands at a NEW
//     timestamped path (immutable, so a URL's content can never be stale), and a read
//     lists the key's directory — the authenticated list API is strongly consistent —
//     and fetches the newest version. Old versions are pruned in the background.
import { createHmac, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const BLOB_API = 'https://blob.vercel-storage.com';
const KEEP_VERSIONS = 2;
const token = () => process.env.BLOB_READ_WRITE_TOKEN || '';
const secret = () => process.env.AUTH_SECRET || '';
const dataKey = () => Buffer.from(process.env.DATA_KEY || '', 'hex');

export function configured() { return !!(token() && secret() && process.env.DATA_KEY); }

/** stable, unguessable directory for a logical key */
function dirFor(key) {
  return createHmac('sha256', secret()).update('path:' + key).digest('hex');
}
const authHeaders = () => ({ authorization: `Bearer ${token()}`, 'x-api-version': '7' });

function encrypt(plain) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', dataKey(), iv);
  const body = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString('base64');
}
function decrypt(b64) {
  const raw = Buffer.from(b64, 'base64');
  const d = createDecipheriv('aes-256-gcm', dataKey(), raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8');
}

/** every version of a key, newest first (list is strongly consistent) */
async function versions(dir) {
  const r = await fetch(`${BLOB_API}?prefix=${dir}/&limit=100`, { headers: authHeaders(), cache: 'no-store' });
  if (!r.ok) throw new Error('store list ' + r.status);
  const j = await r.json();
  return (j.blobs || []).sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
}

async function removeUrls(urls) {
  if (!urls.length) return;
  try {
    await fetch(`${BLOB_API}/delete`, {
      method: 'POST',
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ urls }),
    });
  } catch { /* pruning is best-effort */ }
}

/** write a new immutable version of `key` */
export async function kvSet(key, value) {
  const dir = dirFor(key);
  // zero-padded so lexicographic order == chronological order
  const stamp = String(Date.now()).padStart(14, '0') + '-' + randomBytes(3).toString('hex');
  const r = await fetch(`${BLOB_API}/${dir}/${stamp}.bin`, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'x-content-type': 'application/octet-stream',
      'x-add-random-suffix': '0',
      'x-cache-control-max-age': '0',
    },
    body: encrypt(JSON.stringify(value)),
  });
  if (!r.ok) throw new Error('store write failed: ' + r.status);
  // drop superseded versions so a key never accumulates history
  try {
    const all = await versions(dir);
    await removeUrls(all.slice(KEEP_VERSIONS).map((b) => b.url));
  } catch { /* best-effort */ }
  return true;
}
// writes are immediately visible via list, so no separate confirm step is needed
export const kvSetConfirmed = kvSet;

/** read the newest version. null ONLY when the key genuinely has no versions;
 *  a transient failure throws so callers never mistake it for "absent". */
export async function kvGet(key) {
  const dir = dirFor(key);
  let all;
  try { all = await versions(dir); }
  catch (e) { throw e; }
  if (!all.length) return null;

  let lastErr = null;
  for (const blob of all.slice(0, KEEP_VERSIONS)) {      // fall back to the previous version if the newest 404s
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch(blob.url, { cache: 'no-store' });
        if (r.ok) {
          const body = await r.text();
          if (body) return JSON.parse(decrypt(body));
          return null;
        }
        lastErr = new Error('store read ' + r.status);
      } catch (e) { lastErr = e; }
      await new Promise((res) => setTimeout(res, 150 * (attempt + 1)));
    }
  }
  throw lastErr || new Error('store read failed');
}

/** delete every version of a key */
export async function kvDel(key) {
  try {
    const all = await versions(dirFor(key));
    await removeUrls(all.map((b) => b.url));
    return true;
  } catch { return false; }
}
