import { useEffect, useState } from 'react';
import { Eye, Users, Heart, Star, CircleCheck } from 'lucide-react';
import { api, timeAgo } from '../api.js';
import BarChart from './BarChart.jsx';
import Stars from './Stars.jsx';

const Stat = ({ icon: Icon, label, value, sub }) => (
  <div className="rounded-xl border border-brand/15 bg-white p-4">
    <p className="flex items-center gap-1.5 text-sm text-ink/70"><Icon className="size-4 text-brand" />{label}</p>
    <p className="text-3xl font-extrabold text-brand-dark">{value}</p>
    {sub && <p className="text-xs text-ink/60">{sub}</p>}
  </div>
);

export default function SellerDashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [at, setAt] = useState(null);

  useEffect(() => {
    let stop = false;
    const load = () => {
      if (document.visibilityState === 'hidden') return;
      api.sellerStats().then((x) => { if (!stop) { setD(x); setAt(new Date()); setErr(''); } }).catch((e) => { if (!stop) setErr(e.message); });
    };
    load();
    const t = setInterval(load, 10000);
    document.addEventListener('visibilitychange', load);
    return () => { stop = true; clearInterval(t); document.removeEventListener('visibilitychange', load); };
  }, []);

  if (!d) return <p className="py-16 text-center">{err || 'Loading your dashboard…'}</p>;
  const t = d.totals;
  return (
    <section className="space-y-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold text-brand-dark">Seller dashboard</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-dark">
          <span className="size-2 animate-pulse rounded-full bg-brand" />Live · updated {at?.toLocaleTimeString()}
        </span>
        <a href="#/account" className="ml-auto text-sm font-semibold text-brand underline">My Ads</a>
      </div>
      {err && <p role="alert" className="text-sm text-red-700">Could not refresh: {err}</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Eye} label="Views, last 24 hours" value={t.views_24h} sub={`${t.views_7d} in 7 days · ${t.views_total} all time`} />
        <Stat icon={Users} label="Unique visitors" value={t.visitors_total} sub={`${t.visitors_24h} in the last 24 hours`} />
        <Stat icon={Heart} label="Saved by students" value={t.saves} sub={t.last_view_at ? `Last view ${timeAgo(t.last_view_at)}` : 'No views yet'} />
        <Stat icon={Star} label="Your rating" value={t.rating_count ? t.rating.toFixed(1) : '–'} sub={`${t.rating_count} rating${t.rating_count === 1 ? '' : 's'}`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart title="Views per hour (last 24 hours)" data={d.hourly.map((x) => ({ label: x.hour, count: x.count }))} />
        <BarChart title="Views per day (last 14 days)" data={d.daily.map((x) => ({ label: x.day.slice(5), count: x.count }))} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-brand/15 bg-white">
        <table className="w-full text-sm">
          <thead><tr className="bg-brand-tint text-left"><th className="p-2">Ad</th><th className="p-2">Status</th><th className="p-2">Views</th><th className="p-2">Visitors</th><th className="p-2">Saves</th></tr></thead>
          <tbody>
            {d.ads.length === 0 && <tr><td className="p-3" colSpan={5}>You have no ads yet.</td></tr>}
            {d.ads.map((a) => (
              <tr key={a.id} className="border-t border-brand/10">
                <td className="p-2"><a href={`#/product/${a.id}`} className="font-semibold hover:text-brand">{a.title}</a></td>
                <td className="p-2">{a.status === 'SOLD' ? <span className="inline-flex items-center gap-1"><CircleCheck className="size-4 text-brand" />Sold</span> : 'Available'}</td>
                <td className="p-2">{a.views}</td><td className="p-2">{a.visitors}</td><td className="p-2">{a.saves}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-brand/15 bg-white p-4">
        <p className="mb-2 font-bold">Latest reviews</p>
        {d.reviews.length === 0 ? <p className="text-sm text-ink/70">No reviews yet. Buyers can rate you from your seller page.</p> : (
          <ul className="space-y-3">{d.reviews.map((r, i) => (
            <li key={i} className="text-sm"><Stars value={r.rating} /> <b>{r.reviewer}</b> <span className="text-ink/60">{timeAgo(r.created_at)}</span>{r.comment && <p className="mt-1">{r.comment}</p>}</li>
          ))}</ul>
        )}
      </div>
      <p className="text-xs text-ink/60">A view is counted once per person per ad per day. Your own views and search-engine bots are not counted.</p>
    </section>
  );
}
