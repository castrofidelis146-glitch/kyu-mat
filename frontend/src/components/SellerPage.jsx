import { useEffect, useState } from 'react';
import { ArrowLeft, LogIn } from 'lucide-react';
import { api, timeAgo } from '../api.js';
import Stars, { StarInput } from './Stars.jsx';
import ProductCard from './ProductCard.jsx';

export default function SellerPage({ id, user, favs, onFav, onAuth }) {
  const [s, setS] = useState(null);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.seller(id).then((p) => { setS(p); if (p.my_rating) { setStars(p.my_rating.rating); setComment(p.my_rating.comment || ''); } }).catch((e) => setErr(e.message));
  useEffect(() => { setS(null); setErr(''); load(); api.products({ seller: id }).then(setItems).catch(() => {}); }, [id, user]);

  async function submit(e) {
    e.preventDefault(); setMsg(null);
    if (!stars) return setMsg({ ok: false, t: 'Choose 1 to 5 stars.' });
    setBusy(true);
    try { await api.rateSeller(id, { rating: stars, comment }); setMsg({ ok: true, t: 'Thank you, your rating was saved.' }); load(); }
    catch (x) { setMsg({ ok: false, t: x.message }); } finally { setBusy(false); }
  }

  if (err) return <p className="py-16 text-center">{err} <a href="#top" className="text-brand underline">Back to listings</a></p>;
  if (!s) return <p className="py-16 text-center">Loading…</p>;
  const mineProfile = user?.id === s.id;
  const max = Math.max(1, ...Object.values(s.distribution));
  return (
    <section className="space-y-6 py-8">
      <a href="#listings" className="inline-flex items-center gap-1 text-sm font-semibold text-brand"><ArrowLeft className="size-4" />Back to listings</a>
      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <div className="space-y-2 rounded-xl border border-brand/15 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-full bg-brand text-xl font-bold text-white">{s.name[0]}</span>
            <div><h1 className="text-2xl font-extrabold text-brand-dark">{s.name}</h1><p className="text-sm text-ink/70">Member since {new Date(s.member_since).toLocaleDateString()}</p></div>
          </div>
          <p>{s.rating_count ? <Stars value={s.rating} count={s.rating_count} /> : <span className="text-sm text-ink/70">No ratings yet</span>}</p>
          <p className="text-sm text-ink/70">{s.active_ads} active ad{s.active_ads === 1 ? '' : 's'} · {s.sold_ads} sold</p>
          {s.rating_count > 0 && <ul className="space-y-1 pt-2 text-sm">{[5, 4, 3, 2, 1].map((n) => (
            <li key={n} className="flex items-center gap-2"><span className="w-10">{n} star</span>
              <span className="h-2 flex-1 rounded bg-brand/10"><span className="block h-2 rounded bg-amber-500" style={{ width: `${(s.distribution[n] / max) * 100}%` }} /></span>
              <span className="w-6 text-right">{s.distribution[n]}</span></li>))}</ul>}
        </div>
        <div className="rounded-xl border border-brand/15 bg-white p-5">
          <h2 className="mb-2 text-lg font-bold">Rate this seller</h2>
          {mineProfile ? <p className="text-sm text-ink/70">This is your own seller page. Buyers rate you from here.</p>
            : !user ? <button onClick={() => onAuth('login')} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 font-semibold text-white"><LogIn className="size-4" />Log in to rate</button>
            : (
              <form onSubmit={submit} className="space-y-3">
                <StarInput value={stars} onChange={setStars} />
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3} placeholder="Optional: how was the deal? Was the item as described?" className="w-full rounded-lg border border-brand/30 px-3 py-2" />
                {msg && <p role="alert" className={`text-sm ${msg.ok ? 'text-brand-dark' : 'text-red-700'}`}>{msg.t}</p>}
                <button disabled={busy} className="rounded-lg bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">{s.my_rating ? 'Update rating' : 'Submit rating'}</button>
              </form>
            )}
        </div>
      </div>
      <div>
        <h2 className="mb-3 text-lg font-bold">Reviews</h2>
        {s.reviews.length === 0 ? <p className="text-sm text-ink/70">No reviews yet.</p> : (
          <ul className="space-y-3">{s.reviews.map((r, i) => (
            <li key={i} className="rounded-xl border border-brand/15 bg-white p-4 text-sm"><Stars value={r.rating} /> <b>{r.reviewer}</b> <span className="text-ink/60">{timeAgo(r.created_at)}</span>{r.comment && <p className="mt-1">{r.comment}</p>}</li>
          ))}</ul>
        )}
      </div>
      {items.length > 0 && <div>
        <h2 className="mb-3 text-lg font-bold">Ads from {s.name.split(' ')[0]}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} liked={favs.has(p.id)} onFav={onFav} />)}</div>
      </div>}
    </section>
  );
}
