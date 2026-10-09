import { Laptop, BookOpen, Shirt, Armchair, Smartphone, House, Dumbbell, Package } from 'lucide-react';
const icons = { laptop: Laptop, book: BookOpen, shirt: Shirt, armchair: Armchair, smartphone: Smartphone, home: House, dumbbell: Dumbbell, package: Package };
export default function CategoryGrid({ categories, active, onSelect }) {
  return (
    <section aria-label="Categories" className="py-6">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 xl:grid-cols-8">
        {categories.map((c) => {
          const Icon = icons[c.icon_name] || Package;
          const on = active === c.slug;
          return (
            <li key={c.id}>
              <button onClick={() => onSelect(on ? '' : c.slug)} aria-pressed={on}
                className={`flex h-full w-full flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center text-xs font-semibold sm:px-3 sm:py-4 sm:text-sm transition-colors ${on ? 'border-brand bg-brand text-white' : 'border-brand/20 bg-white hover:border-brand'}`}>
                <Icon className={`size-7 ${on ? 'text-white' : 'text-brand'}`} />{c.name}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
