import { Heart, MapPin, Clock, Tag, Repeat, ArrowRight } from 'lucide-react';
import { timeAgo } from '../api.js';
export default function ProductCard({ p, liked = false, onFav = () => {} }) {
  const sale = p.listing_type === 'FOR_SALE';
  const Badge = sale ? Tag : Repeat;
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-brand/15 bg-white">
      <div className="relative aspect-[4/3] bg-brand/10">
        {p.image_url && <img src={p.image_url} alt={p.title} loading="lazy" className="size-full object-cover" />}
        <span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold text-white ${sale ? 'bg-brand' : 'bg-amber-600'}`}><Badge className="size-3" />{sale ? 'For Sale' : 'For Exchange'}</span>
        <button onClick={() => onFav(p.id)} aria-pressed={liked} aria-label="Save to wishlist"
          className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/90"><Heart className={`size-4 ${liked ? 'fill-red-500 text-red-500' : 'text-ink'}`} /></button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-bold leading-snug">{p.title}</h3>
        <p className="text-lg font-extrabold text-brand-dark">{p.price != null ? `KSh ${Number(p.price).toLocaleString()}` : 'Open to swaps'}</p>
        <p className="flex items-center gap-1 text-sm text-ink/70"><MapPin className="size-4 text-brand" />{p.location}</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-ink/70">
          <span className="grid size-6 place-items-center rounded-full bg-brand text-xs font-bold text-white">{p.seller_name[0]}</span>
          <span className="font-semibold">{p.seller_name}</span>
          <span className="ml-auto inline-flex items-center gap-1"><Clock className="size-3.5" />{timeAgo(p.created_at)}</span>
        </div>
        <a href={`#/product/${p.id}`} className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-brand py-2 text-sm font-semibold text-brand hover:bg-brand hover:text-white">View Details<ArrowRight className="size-4" /></a>
      </div>
    </article>
  );
}
