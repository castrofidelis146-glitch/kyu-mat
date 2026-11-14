export default function BarChart({ title, data, unit = 'views' }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const w = 600 / data.length;
  const total = data.reduce((a, d) => a + d.count, 0);
  return (
    <div className="rounded-xl border border-brand/15 bg-white p-4">
      <p className="font-bold">{title} <span className="font-normal text-ink/60">· {total} {unit}</span></p>
      <svg viewBox="0 0 600 150" className="mt-2 w-full" role="img" aria-label={title}>
        {data.map((d, i) => {
          const h = (d.count / max) * 120;
          return <rect key={d.label + i} x={i * w + 2} y={130 - h} width={w - 4} height={Math.max(h, 1)} rx="2" className={d.count ? 'fill-brand' : 'fill-brand/20'}><title>{d.label}: {d.count}</title></rect>;
        })}
        <text x="0" y="148" fontSize="10" className="fill-ink/60">{data[0].label}</text>
        <text x="600" y="148" fontSize="10" textAnchor="end" className="fill-ink/60">{data.at(-1).label}</text>
        <text x="600" y="10" fontSize="10" textAnchor="end" className="fill-ink/60">peak {max}</text>
      </svg>
    </div>
  );
}
