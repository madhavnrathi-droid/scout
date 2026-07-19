// Cold-import every api module in a fresh process.
//
// `node --check` only PARSES — it never resolves imports, so a deleted or
// renamed module passes it and then fails at runtime in production. That is
// exactly how api/_data/opportunities.js went missing: local dev kept serving
// because the module was already resident in the long-running dev process,
// and every reload was against a warm cache.
//
// Run this before every deploy. It is the cheapest possible insurance.
import { readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';

const roots = ['api', 'api/_lib', 'api/_data'];
let failed = 0, checked = 0;

for (const dir of roots) {
  let files = [];
  try { files = await readdir(dir); } catch { continue; }
  for (const f of files.filter((x) => x.endsWith('.js'))) {
    const rel = join(dir, f);
    checked++;
    try {
      await import(pathToFileURL(resolve(rel)).href);
      console.log(`  ok   ${rel}`);
    } catch (err) {
      failed++;
      console.error(`  FAIL ${rel}\n       ${err.message}`);
    }
  }
}

console.log(`\n${checked} modules checked, ${failed} failed`);
process.exit(failed ? 1 : 0);
