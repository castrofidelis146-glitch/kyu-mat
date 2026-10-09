import { useEffect, useState } from 'react';
import { Trash2, CircleCheck } from 'lucide-react';
import { api } from '../api.js';
import ProductCard from './ProductCard.jsx';
const btn = 'rounded-lg border px-3 py-1.5 text-sm font-semibold';
export default function MyAccount({ favList, favs, onFav, onChanged }) {
  const [tab, setTab] = useState('ads');
  const [ads, setAds] = useState(null);
  const [err, setErr] = useState('');
  const load = () => api.mine().then(setAds).catch((e) => { setErr(e.message); setAds([]); });
  useEffect(() => { load(); }, []);
  const act = async (fn) => { setErr(''); try { await fn(); await load(); onChanged(); } catch (e) { setErr(e.message); } };
  const toggleSold = (a) => act(() => api.updateProduct(a.id, { status: a.status === 'SOLD' ? 'AVAILABLE' : 'SOLD' }));
  const del = (a) => confirm(`Delete "${a.title}"? This cannot be undone.`) && act(() => api.deleteProduct(a.id));
  return (
    <section className="py-8">
      <div className="mb-5 flex gap-2" role="tablist">
        {[['ads', `My Ads${ads ? ` (${ads.length})` : ''}`], ['saved', `Saved (${favList.length})`]].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? 'bg-brand text-white' : 'bg-white border border-brand/20'}`}>{l}</button>
        ))}
      </div>
      {err && <p role="alert" className="mb-3 text-sm text-red-700">{err}</p>}
      {tab === 'ads' ? (
        ads === null ? <p>Loading…</p> : ads.length === 0 ? <p className="rounded-xl bg-white p-8 text-center border border-brand/15">You haven't posted anything yet. Use + Post Ad to list your first item.</p> : (
          <ul className="space-y-3">
            {ads.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-brand/15 bg-white p-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-brand/10">{a.image_url && <img src={a.image_url} alt="" className="size-full object-cover" />}</div>
                <div className="min-w-40 flex-1">
                  <a href={`#/product/${a.id}`} className="font-bold hover:text-brand">{a.title}</a>
                  <p className="text-sm text-ink/70">{a.price != null ? `KSh ${Number(a.price).toLocaleString()}` : 'Open to swaps'}</p>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${a.status === 'SOLD' ? 'bg-ink/10 text-ink/70' : 'bg-brand/10 text-brand-dark'}`}>{a.status === 'SOLD' ? 'Sold' : 'Available'}</span>
                <button onClick={() => toggleSold(a)} className={`${btn} border-brand text-brand hover:bg-brand hover:text-white`}><CircleCheck className="mr-1 inline size-4 align-text-bottom" />{a.status === 'SOLD' ? 'Mark available' : 'Mark as sold'}</button>
                <button onClick={() => del(a)} className={`${btn} border-red-700/40 text-red-700 hover:bg-red-700 hover:text-white`}><Trash2 className="mr-1 inline size-4 align-text-bottom" />Delete</button>
              </li>
            ))}
          </ul>
        )
      ) : favList.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center border border-brand/15">Nothing saved yet. Tap the heart on a listing to keep it here.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{favList.map((p) => <ProductCard key={p.id} p={p} liked={favs.has(p.id)} onFav={onFav} />)}</div>
      )}
    </section>
  );
}
