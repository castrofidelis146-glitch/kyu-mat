import { useState } from 'react';
import { X, CirclePlus, ImagePlus, Send } from 'lucide-react';
import { api } from '../api.js';
const f = 'w-full rounded-lg border border-brand/30 px-3 py-2';
export default function PostAdForm({ categories, onClose, onCreated }) {
  const [type, setType] = useState('FOR_SALE');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState([]);
  const pick = (e) => {
    const files = [...e.target.files];
    if (files.length > 4) { setErr('You can upload up to 4 photos.'); e.target.value = ''; return setPreviews([]); }
    setErr(''); setPreviews(files.map((f) => URL.createObjectURL(f)));
  };
  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    const d = Object.fromEntries(new FormData(e.target));
    try {
      const files = [...e.target.photos.files];
      const images = files.length ? await api.upload(files) : [];
      await api.createProduct({
        title: d.title.trim(), category_id: +d.category_id, listing_type: type, condition: d.condition,
        description: d.description, price: d.price === '' ? null : +d.price, images,
      });
      onCreated();
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Post an ad">
      <form onSubmit={submit} className="my-auto w-full max-w-lg space-y-3 rounded-2xl bg-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-brand-dark"><CirclePlus className="size-6" />Post an Ad</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-brand-tint"><X className="size-6" /></button>
        </div>
        <input name="title" required maxLength={100} placeholder="What are you selling? e.g. HP Laptop" className={f} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select name="category_id" required defaultValue="" className={f}>
            <option value="" disabled>Category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="condition" className={f}><option>New</option><option>Good Condition</option><option>Refurbished</option></select>
        </div>
        <div className="flex gap-2" role="group" aria-label="Listing type">
          {[['FOR_SALE', 'For Sale'], ['FOR_EXCHANGE', 'For Exchange']].map(([v, l]) => (
            <button type="button" key={v} aria-pressed={type === v} onClick={() => setType(v)}
              className={`flex-1 rounded-lg border py-2 font-semibold ${type === v ? 'bg-brand text-white border-brand' : 'border-brand/30'}`}>{l}</button>
          ))}
        </div>
        <input name="price" type="number" min="0" step="1" required={type === 'FOR_SALE'}
          placeholder={type === 'FOR_SALE' ? 'Price in KSh' : 'Value in KSh (optional)'} className={f} />
        <textarea name="description" rows={3} placeholder="Describe the item and what you'd accept in exchange" className={f} />
        <label className="block text-sm font-semibold"><span className="inline-flex items-center gap-1.5"><ImagePlus className="size-4 text-brand" />Photos (up to 4, max 5 MB each)</span>
          <input name="photos" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={pick} className={`${f} mt-1 font-normal`} />
        </label>
        {previews.length > 0 && <div className="flex gap-2">{previews.map((u) => <img key={u} src={u} alt="" className="size-16 rounded-lg object-cover" />)}</div>}
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"><Send className="mr-2 inline size-4 align-text-bottom" />Publish ad</button>
      </form>
    </div>
  );
}
