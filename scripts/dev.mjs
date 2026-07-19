// Local full-stack dev server for Scout — serves public/ statically and
// routes /api/* to the Vercel serverless handlers in api/.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { parse } from 'node:url';

const ROOT = '/Users/madhavrathi/timshel';
const PORT = parseInt(process.argv[2] || '3001', 10);

// load .env.local so the auth/sync handlers have their secrets in dev too
try {
  const env = await readFile(join(ROOT, '.env.local'), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* no local env — auth endpoints will report themselves unconfigured */ }
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

async function handleApi(req, res, pathname, query) {
  const name = pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  let mod;
  try { mod = await import(join(ROOT, 'api', name + '.js') + '?t=' + Date.now()); }
  catch (e) { res.writeHead(404, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'no such api: ' + name })); return; }
  let body = '';
  for await (const chunk of req) body += chunk;
  let parsed = undefined;
  try { parsed = body ? JSON.parse(body) : undefined; } catch { parsed = body; }
  const vreq = { method: req.method, query, headers: req.headers, body: parsed };
  const vres = {
    _status: 200, _headers: {},
    setHeader(k, v) { this._headers[k.toLowerCase()] = v; },
    status(c) { this._status = c; return this; },
    json(d) { res.writeHead(this._status, { 'content-type': 'application/json', ...this._headers }); res.end(JSON.stringify(d)); return this; },
    end(d) { res.writeHead(this._status, this._headers); res.end(d); return this; },
  };
  try { await mod.default(vreq, vres); }
  catch (e) { console.error('api error', name, e); res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: String(e) })); }
}

createServer(async (req, res) => {
  const { pathname, query } = parse(req.url, true);
  if (pathname.startsWith('/api/')) return handleApi(req, res, pathname, query);
  let p = pathname === '/' ? '/index.html' : pathname;
  p = normalize(p).replace(/^(\.\.[/\\])+/, '');
  try {
    const data = await readFile(join(ROOT, 'public', p));
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  } catch {
    try {
      const data = await readFile(join(ROOT, 'public', 'index.html'));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(data);
    } catch { res.writeHead(404); res.end('not found'); }
  }
}).listen(PORT, () => console.log('scout dev on http://localhost:' + PORT));
