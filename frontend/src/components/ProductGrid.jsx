import { ArrowUpDown, Sparkles, PackageOpen } from 'lucide-react';
import ProductCard from './ProductCard.jsx';
const tabs = [['', 'All'], ['FOR_SALE', 'For Sale'], ['FOR_EXCHANGE', 'For Exchange']];
export default function ProductGrid({ products, loading, type, setType, sort, setSort, favs, onFav }) {
  return (
    <section id="listings" className="py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-brand-dark"><Sparkles className="size-6" />Latest Listings</h2>
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map(([v, l]) => (
            <button key={l} onClick={() => setType(v)} aria-pressed={type === v}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${type === v ? 'bg-brand text-white' : 'bg-white border border-brand/20'}`}>{l}</button>
          ))}
          <ArrowUpDown className="size-4 text-brand" aria-hidden="true" /><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort listings" className="rounded-lg border border-brand/30 bg-white px-3 py-1.5 text-sm">
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>
      {loading ? <p>Loading listings…</p> : products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-brand/15 bg-white p-8 text-center"><PackageOpen className="size-10 text-brand" /><p>No listings match yet. Be the first to post one.</p></div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((p) => <ProductCard key={p.id} p={p} liked={favs.has(p.id)} onFav={onFav} />)}</div>
      )}
    </section>
  );
}
