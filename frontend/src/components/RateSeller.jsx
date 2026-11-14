import { useEffect, useState } from 'react';
import { Star, LogIn } from 'lucide-react';
import { api } from '../api.js';
import { StarInput } from './Stars.jsx';

export default function RateSeller({ sellerId, sellerName, user, onAuth }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [had, setHad] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const first = (sellerName || 'the seller').split(' ')[0];

  useEffect(() => {
    if (!user) return;
    api.seller(sellerId).then((s) => { if (s.my_rating) { setStars(s.my_rating.rating); setComment(s.my_rating.comment || ''); setHad(true); } }).catch(() => {});
  }, [sellerId, user]);

  async function submit(e) {
    e.preventDefault(); setMsg(null);
    if (!stars) return setMsg({ ok: false, t: 'Tap a star from 1 to 5 first.' });
    setBusy(true);
    try { await api.rateSeller(sellerId, { rating: stars, comment }); setHad(true); setMsg({ ok: true, t: 'Thank you! Your rating was saved.' }); }
    catch (x) { setMsg({ ok: false, t: x.message }); } finally { setBusy(false); }
  }

  return (
    <div className="rounded-xl border-2 border-amber-400 bg-white p-4">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Star className="size-5 fill-amber-400 text-amber-500" />Rate {first}</h2>
      {!user ? (
        <>
          <p className="my-2 text-sm text-ink/70">Bought from or dealt with this seller? Log in to leave a rating and review.</p>
          <button onClick={() => onAuth('login')} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"><LogIn className="size-4" />Log in to rate</button>
        </>
      ) : (
        <form onSubmit={submit} className="mt-2 space-y-3">
          <StarInput value={stars} onChange={setStars} />
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3}
            placeholder="Write a review (optional): was the item as described? Was the seller easy to deal with?"
            className="w-full rounded-lg border border-brand/30 px-3 py-2" />
          {msg && <p role="alert" className={`text-sm ${msg.ok ? 'text-brand-dark' : 'text-red-700'}`}>{msg.t}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button disabled={busy} className="rounded-lg bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">{had ? 'Update rating' : 'Submit rating'}</button>
            <a href={`#/seller/${sellerId}`} className="text-sm font-semibold text-brand underline">See all reviews</a>
          </div>
        </form>
      )}
    </div>
  );
}
