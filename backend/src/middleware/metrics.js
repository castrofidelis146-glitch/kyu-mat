// In-memory request metrics (reset when the server restarts).
const started = Date.now();
const lat = [];
const routes = new Map();
const s = { total: 0, ok: 0, client: 0, server: 0 };

export const metrics = (req, res, next) => {
  const t = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - t) / 1e6;
    s.total++;
    res.statusCode >= 500 ? s.server++ : res.statusCode >= 400 ? s.client++ : s.ok++;
    lat.push(ms); if (lat.length > 500) lat.shift();
    const key = `${req.method} ${req.baseUrl}${req.route?.path || ''}`;
    const r = routes.get(key) || { count: 0, total: 0 };
    r.count++; r.total += ms; routes.set(key, r);
  });
  next();
};

export const snapshot = () => {
  const sorted = [...lat].sort((a, b) => a - b);
  const avg = lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length : 0;
  return {
    uptimeSec: Math.round((Date.now() - started) / 1000),
    requests: s,
    errorRate: s.total ? +((s.server / s.total) * 100).toFixed(2) : 0,
    avgMs: +avg.toFixed(1),
    p95Ms: +(sorted[Math.floor(sorted.length * 0.95)] || 0).toFixed(1),
    memoryMb: Math.round(process.memoryUsage().rss / 1048576),
    slowest: [...routes].map(([route, r]) => ({ route, count: r.count, avgMs: +(r.total / r.count).toFixed(1) }))
      .sort((a, b) => b.avgMs - a.avgMs).slice(0, 6),
  };
};
