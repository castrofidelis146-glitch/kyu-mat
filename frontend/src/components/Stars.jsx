import { Star } from 'lucide-react';
export function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button type="button" key={i} role="radio" aria-checked={value === i} aria-label={`${i} star${i > 1 ? 's' : ''}`} onClick={() => onChange(i)} className="p-0.5">
          <Star className={`size-8 text-amber-500 ${value >= i ? 'fill-current' : ''}`} />
        </button>
      ))}
    </div>
  );
}
export default function Stars({ value = 0, count, compact = false }) {
  const v = Number(value) || 0;
  if (compact) return <span className="inline-flex items-center gap-0.5 text-amber-600" aria-label={`${v} out of 5 stars`}><Star className="size-3.5 fill-current" />{v.toFixed(1)}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-amber-600" aria-label={`${v} out of 5 stars`}>
      <span className="inline-flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`size-4 ${v >= i - 0.25 ? 'fill-current' : v >= i - 0.75 ? 'fill-current opacity-50' : 'opacity-30'}`} />)}</span>
      <b className="text-ink">{v.toFixed(1)}</b>{count != null && <span className="text-ink/60">({count})</span>}
    </span>
  );
}
