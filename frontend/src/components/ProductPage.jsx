import { useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle, Phone, ShieldCheck, LogIn } from 'lucide-react';
import { api, timeAgo } from '../api.js';
import Stars from './Stars.jsx';
import RateSeller from './RateSeller.jsx';

const intl = (n) => n.replace(/\D/g, '').replace(/^0/, '254');

export default function ProductPage({ id, user, onAuth }) {
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [img, setImg] = useState(0);
  useEffect(() => { setP(null); setErr(''); setImg(0); api.product(id).then(setP).catch((e) => setErr(e.message)); }, [id, user]);

  if (err) return <p className="py-16 text-center">{err} <a href="#top" className="text-brand underline">Back to listings</a></p>;
  if (!p) return <p className="py-16 text-center">Loading…</p>;

  const sale = p.listing_type === 'FOR_SALE';
  const mine = !!user && user.id === p.seller_id;
  const first = p.seller_name.split(' ')[0];
  const chat = p.seller_phone
    ? `https://wa.me/${intl(p.seller_phone)}?text=${encodeURIComponent(`Hi ${first}, I saw your ad "${p.title}" on KYU Mart (${location.origin}/#/product/${p.id}). Is it still available?`)}`
    : null;

  return (
    <article className="py-8">
      <a href="#listings" className="inline-flex items-center gap-1 text-sm font-semibold text-brand"><ArrowLeft className="size-4" />Back to listings</a>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-brand/10">
            {p.images[img] && <img src={p.images[img].image_url} alt={p.title} className="size-full object-cover" />}
          </div>
          {p.images.length > 1 && (
            <div className="mt-2 flex gap-2">
              {p.images.map((im, i) => (
                <button key={i} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`} className={`size-16 overflow-hidden rounded-lg border-2 ${i === img ? 'border-brand' : 'border-transparent'}`}>
                  <img src={im.image_url} alt="" className="size-full object-cover" /></button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold text-white ${sale ? 'bg-brand' : 'bg-amber-600'}`}>{sale ? 'For Sale' : 'For Exchange'}</span>
            <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{p.title}</h1>
            <p className="text-2xl font-extrabold">{p.price != null ? `KSh ${Number(p.price).toLocaleString()}` : 'Open to swaps'}</p>
            <p className="text-sm text-ink/70">{p.category} · {p.condition} · {p.location} · posted {timeAgo(p.created_at)}</p>
            {p.description && <p className="whitespace-pre-line">{p.description}</p>}
          </div>

          <div className="rounded-xl border border-brand/15 bg-white p-4">
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              Seller: <a href={`#/seller/${p.seller_id}`} className="text-brand underline">{p.seller_name}</a>
              {p.seller_rating_count > 0 ? <Stars value={p.seller_rating} count={p.seller_rating_count} /> : <span className="text-sm font-normal text-ink/60">No ratings yet</span>}
            </p>
            {mine ? (
              <p className="mt-3 rounded-lg bg-brand-tint p-3 text-sm">This is your ad. <a href="#/dashboard" className="font-semibold text-brand underline">See its views on your seller dashboard</a>.</p>
            ) : chat ? (
              <>
                <p className="mt-3 text-sm font-semibold">Chat with {first}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a href={chat} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"><MessageCircle className="size-4" />Chat on WhatsApp</a>
                  <a href={`tel:${p.seller_phone}`} className="inline-flex items-center gap-2 rounded-lg border border-brand px-4 py-2 font-semibold text-brand"><Phone className="size-4" />Call {p.seller_phone}</a>
                </div>
              </>
            ) : (
              <button onClick={() => onAuth('login')} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 font-semibold text-white"><LogIn className="size-4" />Log in to chat or call the seller</button>
            )}
            <p className="mt-3 flex items-start gap-1.5 text-xs text-ink/60"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />Meet on campus in a public place and check the item before paying.</p>
          </div>

          {!mine && <RateSeller sellerId={p.seller_id} sellerName={p.seller_name} user={user} onAuth={onAuth} />}
        </div>
      </div>
    </article>
  );
}
