import { useEffect, useState } from 'react';
import { Activity, Users, Store, GraduationCap } from 'lucide-react';
import { api } from '../api.js';
import BarChart from './BarChart.jsx';

const Card = ({ icon: Icon, label, value, sub }) => (
  <div className="rounded-xl border border-brand/15 bg-white p-4">
    <p className="flex items-center gap-1.5 text-sm text-ink/70"><Icon className="size-4 text-brand" />{label}</p>
    <p className="text-3xl font-extrabold text-brand-dark">{value}</p>
    {sub && <p className="text-xs text-ink/60">{sub}</p>}
  </div>
);

export default function LiveStats() {
  if (import.meta.env.VITE_HIDE_LIVE_STATS === 'true') return null;
  const [d, setD] = useState(null);
  const [at, setAt] = useState(null);

  useEffect(() => {
    let stop = false;
    const load = () => {
      if (document.visibilityState === 'hidden') return;
      api.publicStats().then((x) => { if (!stop) { setD(x); setAt(new Date()); } }).catch(() => {});
    };
    api.ping().catch(() => {}).finally(load); // count this visitor first, then read the numbers
    const t = setInterval(load, 10000);
    document.addEventListener('visibilitychange', load);
    return () => { stop = true; clearInterval(t); document.removeEventListener('visibilitychange', load); };
  }, []);

  if (!d) return null;
  const t = d.totals;
  const max = Math.max(1, ...d.categories.map((c) => c.count));
  return (
    <section aria-label="Live statistics" className="space-y-4 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-brand-dark"><Activity className="size-6" />Live on KYU Mart</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-dark">
          <span className="size-2 animate-pulse rounded-full bg-brand" />Live · updated {at?.toLocaleTimeString()}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card icon={Activity} label="Online now" value={t.online_now} sub="Active in the last 90 seconds" />
        <Card icon={Users} label="Visitors today" value={t.visitors_today} sub={`${t.visitors_7d} in the last 7 days`} />
        <Card icon={Store} label="Active ads" value={t.active_ads} sub={`${t.ads_today} new today · ${t.sold_ads} sold`} />
        <Card icon={GraduationCap} label="Members" value={t.members} sub="Registered students" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart title="Visitors per hour (last 24 hours)" data={d.hourly} unit="visits" />
        <BarChart title="Visitors per day (last 14 days)" data={d.daily} unit="visitors" />
      </div>
      <div className="rounded-xl border border-brand/15 bg-white p-4">
        <p className="mb-2 font-bold">Active ads by category</p>
        <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {d.categories.map((c) => (
            <li key={c.name} className="text-sm">
              <div className="flex justify-between"><span>{c.name}</span><b>{c.count}</b></div>
              <div className="h-2 rounded bg-brand/10"><div className="h-2 rounded bg-brand" style={{ width: `${(c.count / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-ink/60">Visitors are counted anonymously, once per person per hour. Numbers refresh automatically.</p>
    </section>
  );
}
