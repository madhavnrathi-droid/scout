// crawler/src/index.js — Main crawler orchestrator
import { db, queries } from '../../api/db.js';
import { crawlSERB } from './sources/serb.js';
import { crawlIIT } from './sources/iit.js';
import { crawlDevfolio } from './sources/devfolio.js';
import { crawlUnstop } from './sources/unstop.js';
import { crawlOpportunityDesk } from './sources/opportunity-desk.js';
import { crawlReddit } from './sources/reddit.js';
import { crawlDAAD } from './sources/daad.js';
import { crawlGeneric } from './sources/generic.js';

// ─── SOURCE REGISTRY ──────────────────────────────────────────────────────────

const CRAWLERS = {
  // Government / Academic
  'SERB':           { fn: crawlSERB,           priority: 1 },
  'IIT Madras':     { fn: crawlIIT,            priority: 1, opts: { name: 'IIT Madras', url: 'https://research.iitm.ac.in' } },
  'IISc':           { fn: crawlIIT,            priority: 1, opts: { name: 'IISc', url: 'https://iisc.ac.in/admissions' } },
  'PMRF':           { fn: crawlGeneric,         priority: 1, opts: { url: 'https://www.pmrf.in', source: 'PMRF' } },

  // International
  'DAAD':           { fn: crawlDAAD,           priority: 2 },
  'OpportunityDesk': { fn: crawlOpportunityDesk, priority: 2 },

  // Hackathons
  'Devfolio':       { fn: crawlDevfolio,        priority: 1 },
  'Unstop':         { fn: crawlUnstop,          priority: 1 },

  // Reddit (free API, no scraping)
  'Reddit/scholarships':    { fn: crawlReddit, priority: 3, opts: { subreddit: 'scholarships', type: 'Fellowship' } },
  'Reddit/gradadmissions':  { fn: crawlReddit, priority: 3, opts: { subreddit: 'gradadmissions', type: 'Fellowship' } },
  'Reddit/cscareerIN':      { fn: crawlReddit, priority: 3, opts: { subreddit: 'cscareerquestionsIN', type: 'Internship' } },
  'Reddit/MachineLearning': { fn: crawlReddit, priority: 3, opts: { subreddit: 'MachineLearning', query: 'fellowship grant', type: 'Grant' } },
};

// ─── RUNNER ───────────────────────────────────────────────────────────────────

export async function runCrawler(sourceName) {
  const entry = CRAWLERS[sourceName];
  if (!entry) throw new Error(`Unknown source: ${sourceName}`);

  const logId = queries.startLog.run(sourceName).lastInsertRowid;
  console.log(`\n[${sourceName}] Starting crawl...`);

  try {
    const results = await entry.fn(entry.opts || {});
    const inserted = upsertOpportunities(results);

    queries.finishLog.run(inserted, logId);
    queries.updateSource.run(Math.floor(Date.now() / 1000), inserted, sourceName);
    console.log(`[${sourceName}] ✓ ${inserted} opportunities saved`);
    return { source: sourceName, count: inserted, status: 'success' };
  } catch (err) {
    queries.errorLog.run(err.message, logId);
    queries.sourceError.run(err.message, sourceName);
    console.error(`[${sourceName}] ✗ Error:`, err.message);
    return { source: sourceName, count: 0, status: 'error', error: err.message };
  }
}

export async function runAllCrawlers() {
  const sources = Object.keys(CRAWLERS).sort((a, b) =>
    CRAWLERS[a].priority - CRAWLERS[b].priority
  );

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  Opportune Crawler — ${new Date().toISOString()}`);
  console.log(`  Sources: ${sources.length}`);
  console.log(`${'═'.repeat(50)}`);

  const results = [];
  for (const source of sources) {
    const result = await runCrawler(source);
    results.push(result);
    // Small delay between crawlers to be respectful
    await sleep(1500);
  }

  const total = results.reduce((s, r) => s + r.count, 0);
  const succeeded = results.filter(r => r.status === 'success').length;

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  Done: ${succeeded}/${sources.length} sources, ${total} opportunities`);
  console.log(`${'═'.repeat(50)}\n`);

  return results;
}

function upsertOpportunities(opps) {
  let count = 0;
  const upsert = db.transaction(() => {
    for (const opp of opps) {
      try {
        queries.upsert.run(opp);
        count++;
      } catch (e) {
        // skip duplicates / invalid
      }
    }
  });
  upsert();
  return count;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const allFlag    = args.includes('--all');
const sourceFlag = args.findIndex(a => a === '--source');
const sourceName = sourceFlag >= 0 ? args[sourceFlag + 1] : null;

if (allFlag) {
  runAllCrawlers().then(() => process.exit(0)).catch(console.error);
} else if (sourceName) {
  runCrawler(sourceName).then(() => process.exit(0)).catch(console.error);
} else if (args.length === 0) {
  // Default: run all
  runAllCrawlers().then(() => process.exit(0)).catch(console.error);
}
