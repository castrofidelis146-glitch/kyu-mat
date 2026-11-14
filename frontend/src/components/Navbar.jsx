import { useEffect, useRef, useState } from 'react';
import { House, Store, CirclePlus, LayoutGrid, ChevronDown, Search, LogIn, UserPlus, CircleUser, ShieldCheck, LogOut, Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';
import { MessageSquare } from 'lucide-react';

export default function Navbar({ categories, user, onSearch, onCategory, onLogout, onAuth, onPost, unread = 0 }) {
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const [cats, setCats] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setCats(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const go = (fn) => () => { setMenu(false); setCats(false); fn(); };
  const m = 'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-brand-tint';

  const searchForm = (
    <form role="search" onSubmit={(e) => { e.preventDefault(); setMenu(false); onSearch(q); }} className="flex w-full">
      <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search listings"
        placeholder="Search for items, e.g. laptop, phone, books..."
        className="min-w-0 flex-1 rounded-l-lg border border-brand/30 px-3 py-2 text-sm" />
      <button aria-label="Search" className="rounded-r-lg bg-brand px-4 text-white hover:bg-brand-dark"><Search className="size-4" /></button>
    </form>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-brand/15 bg-white">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="flex items-center gap-4 py-2.5 xl:gap-6">
          <a href="#top" className="flex shrink-0 items-center gap-2">
            <Logo className="size-10" />
            <span className="leading-none"><b className="text-lg text-brand-dark">KYU Mart</b><br /><small className="text-xs text-ink/60">Buy • Sell • Connect</small></span>
          </a>

          <nav className="hidden items-center gap-5 text-sm font-semibold xl:flex">
            <a href="#top" className="flex items-center gap-1.5 hover:text-brand"><House className="size-4" />Home</a>
            <a href="#listings" className="flex items-center gap-1.5 hover:text-brand"><Store className="size-4" />Browse</a>
            <button onClick={onPost} className="flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-brand"><CirclePlus className="size-4" />Post Ad</button>
            <div className="relative" ref={box}>
              <button onClick={() => setCats(!cats)} aria-expanded={cats} className="flex items-center gap-1.5 hover:text-brand"><LayoutGrid className="size-4" />Categories<ChevronDown className="size-4" /></button>
              {cats && (
                <ul className="absolute left-0 mt-2 w-56 rounded-lg border border-brand/15 bg-white py-1 shadow-lg">
                  {categories.map((c) => (
                    <li key={c.id}><button className="w-full px-4 py-2 text-left hover:bg-brand-tint" onClick={go(() => onCategory(c.slug))}>{c.name}</button></li>
                  ))}
                </ul>
              )}
            </div>
          </nav>

          <div className="hidden min-w-0 flex-1 xl:flex">{searchForm}</div>

          <div className="hidden items-center gap-3 text-sm font-semibold xl:flex">
            {user ? <>
              <a href="#/chat" className="flex items-center gap-1.5 hover:text-brand"><MessageSquare className="size-4" />Messages{unread > 0 && <span className="rounded-full bg-red-600 px-1.5 text-xs text-white">{unread}</span>}</a>
              <a href="#/account" className="flex items-center gap-1.5 hover:text-brand"><CircleUser className="size-4" />{user.full_name.split(' ')[0]} · My Ads</a>
              {user.is_admin && <a href="#/admin" className="flex items-center gap-1 text-brand"><ShieldCheck className="size-4" />Admin</a>}
              <button onClick={onLogout} className="flex items-center gap-1 text-brand"><LogOut className="size-4" />Log out</button>
            </> : <>
              <button onClick={() => onAuth('login')} className="flex items-center gap-1.5 px-3 py-2 hover:text-brand"><LogIn className="size-4" />Login</button>
              <button onClick={() => onAuth('register')} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-dark"><UserPlus className="size-4" />Create Account</button>
            </>}
          </div>

          <button onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label={menu ? 'Close menu' : 'Open menu'}
            className="ml-auto grid size-11 place-items-center rounded-lg text-brand-dark hover:bg-brand-tint xl:hidden">
            {menu ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        <div className="pb-2.5 xl:hidden">{searchForm}</div>

        {menu && (
          <div className="max-h-[70vh] space-y-1 overflow-y-auto border-t border-brand/10 py-3 font-semibold xl:hidden">
            <a href="#top" onClick={() => setMenu(false)} className={m}><House className="size-5 text-brand" />Home</a>
            <a href="#listings" onClick={() => setMenu(false)} className={m}><Store className="size-5 text-brand" />Browse</a>
            <button onClick={go(onPost)} className={m}><CirclePlus className="size-5 text-brand" />Post Ad</button>
            <button onClick={() => setCats(!cats)} aria-expanded={cats} className={m}><LayoutGrid className="size-5 text-brand" />Categories<ChevronDown className={`ml-auto size-5 transition-transform ${cats ? 'rotate-180' : ''}`} /></button>
            {cats && (
              <div className="grid grid-cols-1 gap-1 pl-4 sm:grid-cols-2">
                {categories.map((c) => <button key={c.id} onClick={go(() => onCategory(c.slug))} className="min-h-11 rounded-lg px-3 text-left text-sm hover:bg-brand-tint">{c.name}</button>)}
              </div>
            )}
            <hr className="my-2 border-brand/10" />
            {user ? <>
              <a href="#/chat" onClick={() => setMenu(false)} className={m}><MessageSquare className="size-5 text-brand" />Messages{unread > 0 && <span className="ml-auto rounded-full bg-red-600 px-2 text-xs font-bold text-white">{unread}</span>}</a>
              <a href="#/account" onClick={() => setMenu(false)} className={m}><CircleUser className="size-5 text-brand" />{user.full_name.split(' ')[0]} · My Ads</a>
              {user.is_admin && <a href="#/admin" onClick={() => setMenu(false)} className={m}><ShieldCheck className="size-5 text-brand" />Admin</a>}
              <button onClick={go(onLogout)} className={m}><LogOut className="size-5 text-brand" />Log out</button>
            </> : <>
              <button onClick={go(() => onAuth('login'))} className={m}><LogIn className="size-5 text-brand" />Login</button>
              <button onClick={go(() => onAuth('register'))} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-3 text-white hover:bg-brand-dark"><UserPlus className="size-5" />Create Account</button>
            </>}
          </div>
        )}
      </div>
    </header>
  );
}
