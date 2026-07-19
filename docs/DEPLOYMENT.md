# Deployment

Scout is static files plus six stateless serverless functions. No database, no session store, no persistent volume. That makes it portable — the Vercel setup is convenience, not a dependency.

---

## Before every deploy

**Bump the cache markers — all three, together:**

```
public/index.html   <link rel="stylesheet" href="/scout.css?v=N">
public/index.html   <script src="/scout.js?v=N" defer>
public/sw.js        const CACHE = 'scout-vN-0';
```

The service worker is stale-while-revalidate. Bump two of the three and returning visitors get the previous bundle exactly once — a bug that reproduces for nobody and wastes an afternoon.

**Check syntax:**

```bash
npm run check      # node --check across scout.js and every api file
```

---

## Vercel (current)

```bash
vercel --prod
```

`vercel.json` sets `outputDirectory: public`, `cleanUrls`, security headers, a 30s function timeout, and a long CDN cache on `/data/*`.

Environment — all optional, AI features only:

```bash
vercel env add OPENAI_COMPAT_KEY production
```

### The git-author trap

Vercel checks the **commit author's email** against team membership and refuses to build anything authored by a non-member. On a Hobby plan only the account owner is a member.

Symptom: deployments come back `BLOCKED`, the build never starts, and there are no build logs.

The error is real but hidden — the `v13` deployment endpoint omits `errorMessage`, while `v6` returns it:

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v6/deployments?teamId=$TEAM&limit=5" \
  | python3 -c "import json,sys; [print(d['state'], d.get('errorMessage','')) for d in json.load(sys.stdin)['deployments']]"
```

Fix, scoped to this repo so a machine-wide identity stays untouched:

```bash
git config --local user.email "you@example.com"   # the Vercel account owner
git commit --amend --reset-author --no-edit
vercel --prod
```

---

## Self-hosting

Nothing here is Vercel-specific. You need two things: serve `public/` as static files, and route `/api/*` to the handler modules.

`scripts/dev.mjs` already does both in about 100 lines, with no dependencies. It is a legitimate production reference — read it before writing your own.

### Node + systemd + nginx

```ini
# /etc/systemd/system/scout.service
[Unit]
Description=Scout
After=network.target

[Service]
Type=simple
User=scout
WorkingDirectory=/srv/scout
EnvironmentFile=/srv/scout/.env.local
ExecStart=/usr/bin/node scripts/dev.mjs 3001
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```nginx
server {
  listen 443 ssl http2;
  server_name scout.example.com;

  # static assets straight off disk — never through Node
  root /srv/scout/public;

  location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 60s;              # extract.js can take ~30s on a large scan
  }

  # the feed is expensive to compute and safe to cache
  location = /api/opportunities {
    proxy_pass http://127.0.0.1:3001;
    proxy_cache scout;
    proxy_cache_valid 200 10m;
    proxy_cache_use_stale updating error timeout;
  }

  location /data/ { expires 1d; add_header Cache-Control "public, stale-while-revalidate=604800"; }

  # never cache these — cache-busting is done with ?v=N
  location = /index.html { expires -1; add_header Cache-Control "no-cache"; }
  location = /sw.js      { expires -1; add_header Cache-Control "no-cache"; }

  location / { try_files $uri $uri/ /index.html; }
}
```

Two things that matter more than they look:

- **`sw.js` and `index.html` must not be cached by the CDN or proxy.** They carry the version markers; caching them defeats the whole scheme.
- **Cache `/api/opportunities`.** It fans out to nine upstream sources. Without a cache every visitor triggers that fan-out, which is slow for them and rude to the sources.

### Caddy

```
scout.example.com {
  root * /srv/scout/public
  handle /api/* { reverse_proxy 127.0.0.1:3001 }
  handle {
    header /index.html Cache-Control "no-cache"
    header /sw.js Cache-Control "no-cache"
    file_server
    try_files {path} /index.html
  }
}
```

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
EXPOSE 3001
CMD ["node", "scripts/dev.mjs", "3001"]
```

No build stage and no `npm install`, because there is nothing to install.

---

## Other platforms

The functions are plain `export default async function handler(req, res)`.

- **Netlify** — closest to Vercel's model; `netlify.toml` with `publish = "public"` and a functions directory, plus a redirect for `/api/*`.
- **Cloudflare Pages / Workers** — needs an adapter: Workers use `fetch(request, env)`, not `(req, res)`. A thin shim mapping `res.status().json()` onto a `Response` covers all six handlers. Enable `nodejs_compat` for `node:` builtins.
- **Any static host + separate API** — the frontend is genuinely static. `API_BASE` in `public/scout.js` points the client at wherever the functions live.

---

## Verifying a deploy

```bash
# version actually shipped
curl -s https://your-host/ | grep -oE 'scout\.(js|css)\?v=[0-9]+'

# feed alive, and served from cache
curl -s -o /dev/null -w '%{http_code} %{size_download}b\n' 'https://your-host/api/opportunities?limit=50'

# static admissions data
curl -s -o /dev/null -w '%{http_code}\n' https://your-host/data/admissions.json
```

Then open it, complete onboarding, save something, and check it appears in the dashboard's Today section. The feed loading is the fastest signal that the backend is healthy.
