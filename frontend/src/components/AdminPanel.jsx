import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Package, Activity } from 'lucide-react';
import { api } from '../api.js';

const card = 'rounded-xl border border-brand/15 bg-white p-4';
const fmtUp = (s) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;

const Stat = ({ label, value, sub }) => (
  <div className={card}><p className="text-sm text-ink/70">{label}</p><p className="text-3xl font-extrabold text-brand-dark">{value}</p>{sub && <p className="text-xs text-ink/60">{sub}</p>}</div>
);

function DailyChart({ title, data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const w = 600 / data.length;
  const total = data.reduce((a, d) => a + d.count, 0);
  return (
    <div className={card}>
      <p className="font-bold">{title} <span className="font-normal text-ink/60">· {total} in 30 days</span></p>
      <svg viewBox="0 0 600 150" className="mt-2 w-full" role="img" aria-label={title}>
        {data.map((d, i) => {
          const h = (d.count / max) * 120;
          return <rect key={d.day} x={i * w + 2} y={130 - h} width={w - 4} height={Math.max(h, 1)} rx="2" className={d.count ? 'fill-brand' : 'fill-brand/20'}><title>{d.day}: {d.count}</title></rect>;
        })}
        <text x="0" y="148" fontSize="10" className="fill-ink/60">{data[0].day.slice(5)}</text>
        <text x="600" y="148" fontSize="10" textAnchor="end" className="fill-ink/60">{data.at(-1).day.slice(5)}</text>
        <text x="600" y="10" fontSize="10" textAnchor="end" className="fill-ink/60">peak {max}</text>
      </svg>
    </div>
  );
}

function Bars({ title, rows, label, value }) {
  const max = Math.max(1, ...rows.map((r) => r[value]));
  return (
    <div className={card}>
      <p className="mb-2 font-bold">{title}</p>
      <ul className="space-y-1.5">{rows.map((r) => (
        <li key={r[label]} className="text-sm"><div className="flex justify-between"><span>{r[label]}</span><b>{r[value]}</b></div>
          <div className="h-2 rounded bg-brand/10"><div className="h-2 rounded bg-brand" style={{ width: `${(r[value] / max) * 100}%` }} /></div></li>
      ))}</ul>
    </div>
  );
}

function Overview({ a }) {
  const t = a.totals;
  const sale = a.types.find((x) => x.listing_type === 'FOR_SALE')?.count || 0;
  const ex = a.types.find((x) => x.listing_type === 'FOR_EXCHANGE')?.count || 0;
  const pct = sale + ex ? Math.round((sale / (sale + ex)) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Registered users" value={t.users} sub={`+${t.new_users_7d} this week`} />
        <Stat label="Active ads" value={t.active_ads} sub={`+${t.new_ads_7d} this week`} />
        <Stat label="Items sold" value={t.sold_ads} sub={`${t.sold_ads + t.active_ads ? Math.round((t.sold_ads / (t.sold_ads + t.active_ads)) * 100) : 0}% sell-through`} />
        <Stat label="Avg. price" value={`KSh ${t.avg_price.toLocaleString()}`} sub={`${t.favorites} saved items · ${t.banned} suspended`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DailyChart title="New users per day" data={a.signups} />
        <DailyChart title="New ads per day" data={a.listings} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Bars title="Ads by category" rows={a.categories} label="name" value="count" />
        <div className={card}>
          <p className="mb-3 font-bold">Sale vs exchange</p>
          <div className="mx-auto size-28 rounded-full" style={{ background: `conic-gradient(#15803d 0 ${pct}%, #d97706 ${pct}% 100%)` }} role="img" aria-label={`${pct}% for sale`} />
          <p className="mt-3 text-sm"><span className="text-brand">■</span> For sale {sale} &nbsp; <span className="text-amber-600">■</span> Exchange {ex}</p>
        </div>
        <Bars title="Top sellers (ads posted)" rows={a.sellers.length ? a.sellers : [{ full_name: 'No sellers yet', ads: 0 }]} label="full_name" value="ads" />
      </div>
    </div>
  );
}

function System({ s }) {
  const healthy = s.p95Ms < 300 && s.errorRate < 2;
  return (
    <div className="space-y-4">
      <p className={`rounded-xl p-3 font-semibold ${healthy ? 'bg-brand/10 text-brand-dark' : 'bg-amber-100 text-amber-900'}`}>
        {healthy ? 'Healthy: responses are fast and error rate is low.' : 'Needs attention: slow responses or a high error rate.'}
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Uptime" value={fmtUp(s.uptimeSec)} sub="since last restart" />
        <Stat label="Requests served" value={s.requests.total} sub={`${s.requests.client} client errors`} />
        <Stat label="Server error rate" value={`${s.errorRate}%`} sub={`${s.requests.server} failed`} />
        <Stat label="Memory" value={`${s.memoryMb} MB`} />
        <Stat label="Avg response" value={`${s.avgMs} ms`} sub="last 500 requests" />
        <Stat label="Slowest 5% (p95)" value={`${s.p95Ms} ms`} />
        <Stat label="Database ping" value={`${s.dbMs} ms`} />
      </div>
      <div className={card}>
        <p className="mb-2 font-bold">Slowest endpoints</p>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-ink/60"><th>Route</th><th>Calls</th><th>Avg ms</th></tr></thead>
          <tbody>{s.slowest.map((r) => <tr key={r.route} className="border-t border-brand/10"><td className="py-1 font-mono text-xs">{r.route}</td><td>{r.count}</td><td>{r.avgMs}</td></tr>)}</tbody></table></div>
        <p className="mt-2 text-xs text-ink/60">Performance figures reset whenever the server restarts.</p>
      </div>
    </div>
  );
}

function Table({ rows, cols, empty }) {
  if (!rows) return <p>Loading…</p>;
  if (!rows.length) return <p className={card}>{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-brand/15 bg-white">
      <table className="w-full text-sm"><thead><tr className="bg-brand-tint text-left">{cols.map((c) => <th key={c.h} className="p-2">{c.h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id} className="border-t border-brand/10">{cols.map((c) => <td key={c.h} className="p-2">{c.v(r)}</td>)}</tr>)}</tbody></table>
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState('overview');
  const [a, setA] = useState(null);
  const [users, setUsers] = useState(null);
  const [listings, setListings] = useState(null);
  const [err, setErr] = useState('');
  const load = (which = tab) => {
    setErr('');
    const f = { overview: () => api.analytics().then(setA), system: () => api.analytics().then(setA), users: () => api.adminUsers().then(setUsers), listings: () => api.adminListings().then(setListings) }[which];
    f().catch((e) => setErr(e.message));
  };
  useEffect(() => { load(tab); }, [tab]);
  const act = (fn) => async () => { try { await fn(); load(tab); } catch (e) { setErr(e.message); } };
  const date = (d) => new Date(d).toLocaleDateString();
  const btn = 'rounded-lg border px-2 py-1 text-xs font-semibold';
  const userCols = [
    { h: 'Name', v: (u) => <>{u.full_name}{u.is_admin && <b className="ml-1 text-brand"> (admin)</b>}</> },
    { h: 'Email', v: (u) => u.email }, { h: 'Phone', v: (u) => u.phone_number },
    { h: 'Joined', v: (u) => date(u.created_at) }, { h: 'Ads', v: (u) => u.ads },
    { h: 'Status', v: (u) => (u.is_banned ? 'Suspended' : 'Active') },
    { h: '', v: (u) => !u.is_admin && <button className={`${btn} ${u.is_banned ? 'border-brand text-brand' : 'border-red-700/40 text-red-700'}`}
      onClick={act(() => (u.is_banned || confirm(`Suspend ${u.full_name}? They will not be able to log in or post.`)) && api.banUser(u.id, !u.is_banned))}>{u.is_banned ? 'Reinstate' : 'Suspend'}</button> },
  ];
  const adCols = [
    { h: 'Title', v: (p) => <a className="font-semibold hover:text-brand" href={`#/product/${p.id}`}>{p.title}</a> },
    { h: 'Seller', v: (p) => `${p.seller_name} (${p.seller_email})` },
    { h: 'Price', v: (p) => (p.price != null ? `KSh ${Number(p.price).toLocaleString()}` : 'Swap') },
    { h: 'Status', v: (p) => p.status }, { h: 'Posted', v: (p) => date(p.created_at) },
    { h: '', v: (p) => <button className={`${btn} border-red-700/40 text-red-700`} onClick={act(() => confirm(`Remove "${p.title}"?`) && api.adminDelete(p.id))}>Remove</button> },
  ];
  return (
    <section className="py-8">
      <div className="mb-5 flex flex-wrap items-center gap-2" role="tablist">
        <h1 className="mr-3 text-2xl font-extrabold text-brand-dark">Admin</h1>
        {[['overview', 'Overview', LayoutDashboard], ['users', 'Users', Users], ['listings', 'Listings', Package], ['system', 'Performance', Activity]].map(([k, l, Icon]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? 'bg-brand text-white' : 'bg-white border border-brand/20'}`}><Icon className="mr-1.5 inline size-4 align-text-bottom" />{l}</button>
        ))}
        <button onClick={() => load()} className="ml-auto text-sm font-semibold text-brand underline">Refresh</button>
      </div>
      {err && <p role="alert" className="mb-3 text-red-700">{err}</p>}
      {tab === 'overview' && (a ? <Overview a={a} /> : <p>Loading…</p>)}
      {tab === 'system' && (a ? <System s={a.system} /> : <p>Loading…</p>)}
      {tab === 'users' && <Table rows={users} cols={userCols} empty="No users yet." />}
      {tab === 'listings' && <Table rows={listings} cols={adCols} empty="No listings yet." />}
    </section>
  );
}
