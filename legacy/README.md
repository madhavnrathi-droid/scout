# legacy — the abandoned v1 build

Nothing in this directory runs. It is kept so the history is legible, not because
it is wired into anything.

Scout v1 was a conventional stack: Supabase for auth and Postgres, an Express API,
a Playwright crawler writing to the database, and Razorpay billing. It was replaced
by the current zero-dependency build — static `public/` plus stateless functions in
`api/`, with a live fan-out feed instead of a crawler, and browser-local storage
instead of a database.

| Path | Was |
|---|---|
| `v1-supabase-build/supabase/` | Edge functions and schema |
| `v1-supabase-build/crawler/` | Playwright crawler → Postgres |
| `v1-supabase-build/js/auth.js` | Supabase client-side auth |
| `v1-supabase-build/dashboard.html` | The v1 dashboard page |
| `v1-supabase-build/icons_block.js`, `img/` | v1 assets, pre-rebrand |

Also gone, and only in git history now: a Vercel Blob encrypted-KV store with
zero-dependency auth and cross-device sync. That shipped in v27 and was removed in
v35 when accounts were dropped in favour of browser-local storage. If you ever need
it back: `git log --all --oneline -- api/auth.js api/sync.js api/_lib/store.js`.

Safe to delete this whole directory. It is here for reference only.
