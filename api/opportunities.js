// GET /api/opportunities — Scout's live aggregated feed.
// Live Unstop + Devpost + curated seed, scored (urgency/virality/prize/brand)
// and rotated on a 20-minute bucket so the feed re-deals like a news app.
//
// Query params:
//   ?limit=50        cap results (max 300)
//   ?type=Hackathon  filter by type (Hackathon|Competition|Scholarship|Internship|Fellowship|Grant)
//   ?q=climate       keyword filter
//   ?rank=closing    ordering: rotation (default) | closing | viral | prize | fresh
import { getFeed, searchFeed } from './_lib/feed.js';

export default async function handler(req, res) {
  const feed = await getFeed();
  let items = feed.items.slice();

  const { limit, type, q, rank } = req.query || {};
  if (type && type !== 'All') {
    const tl = String(type).toLowerCase().replace(/s$/, '');
    items = items.filter((o) => o.type.toLowerCase() === tl);
  }
  if (q) items = searchFeed(items, String(q));
  if (rank === 'closing') items = items.filter((o) => o.days_left > 0).sort((a, b) => a.days_left - b.days_left);
  else if (rank === 'viral') items = items.slice().sort((a, b) => b.applied - a.applied);
  else if (rank === 'prize') items = items.slice().sort((a, b) => (b.prize_cash || 0) - (a.prize_cash || 0));
  else if (rank === 'fresh') items = items.slice().sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

  const n = Math.min(parseInt(limit, 10) || 120, 5000);

  res.setHeader('cache-control', 's-maxage=600, stale-while-revalidate=1200');
  res.setHeader('access-control-allow-origin', '*');
  return res.status(200).json({
    results: items.slice(0, n),
    count: items.length,
    source: feed.live ? 'live' : 'curated',
    live_count: feed.liveCount || 0,
    rotation_bucket: feed.bucket,
    updated: new Date(feed.at).toISOString(),
  });
}
