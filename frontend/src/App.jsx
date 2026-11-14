import { useEffect, useState } from 'react';
import { api, session } from './api.js';
import { ShieldCheck, Zap, GraduationCap, Megaphone, CirclePlus } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import LoginBox from './components/LoginBox.jsx';
import CategoryGrid from './components/CategoryGrid.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import PostAdForm from './components/PostAdForm.jsx';
import ProductPage from './components/ProductPage.jsx';
import ChatPage from './components/ChatPage.jsx';
import SellerDashboard from './components/SellerDashboard.jsx';
import SellerPage from './components/SellerPage.jsx';
import MyAccount from './components/MyAccount.jsx';
import AdminPanel from './components/AdminPanel.jsx';

const values = [[ShieldCheck, 'Safe & Trusted', 'Meet on campus, deal with fellow students.'], [Zap, 'Easy to Use', 'Post an item in a minute, search in seconds.'], [GraduationCap, 'Support Students', 'Every sale keeps money within our campus.']];

export default function App() {
  const [user, setUser] = useState(session.user());
  const [mode, setMode] = useState('login');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', type: '', q: '', sort: 'newest' });
  const [route, setRoute] = useState(location.hash);
  const [postOpen, setPostOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [favList, setFavList] = useState([]);
  const favs = new Set(favList.map((f) => f.id));
  const loadFavs = () => (user ? api.favorites().then(setFavList).catch(() => {}) : setFavList([]));
  useEffect(() => { loadFavs(); }, [user]);
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const productId = route.startsWith('#/product/') ? route.slice(10) : null;
  const inChat = !!user && (route === '#/chat' || route.startsWith('#/chat/'));
  const chatId = inChat ? route.slice(7) : '';
  const [unread, setUnread] = useState(0);
  const sellerId = route.startsWith('#/seller/') ? route.slice(9) : null;
  const dashboard = route === '#/dashboard' && !!user;
  const account = route === '#/account' && !!user;
  const admin = route === '#/admin' && !!user?.is_admin;

  const openAuth = (m) => {
    setMode(m);
    if (sellerId || dashboard || productId || account || admin) location.hash = '#top';
    setTimeout(() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };
  const toggleFav = async (id) => {
    if (!user) return openAuth('login');
    try { favs.has(id) ? await api.removeFav(id) : await api.addFav(id); loadFavs(); } catch {}
  };
  const openPost = () => (user ? setPostOpen(true) : openAuth('register'));
  const pick = (k) => (v) => { set(k)(v); if (sellerId || dashboard || productId || account || admin) location.hash = '#listings'; };

  useEffect(() => { const h = () => setRoute(location.hash); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h); }, []);
  useEffect(() => { api.categories().then(setCategories).catch(() => {}); }, []);
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const load = () => { if (document.visibilityState === 'visible') api.chatUnread().then((r) => setUnread(r.unread)).catch(() => {}); };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [user, route]);
  // heartbeat: tells the server this visitor is still here (every 30 s while the tab is visible)
  useEffect(() => {
    const ping = () => { if (document.visibilityState === 'visible') api.ping().catch(() => {}); };
    ping();
    const t = setInterval(ping, 30000);
    document.addEventListener('visibilitychange', ping);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', ping); };
  }, []);
  useEffect(() => {
    setLoading(true);
    api.products(filters).then(setProducts).catch(() => setProducts([])).finally(() => setLoading(false));
  }, [filters, tick]);

  return (
    <div id="top">
      <Navbar unread={unread} categories={categories} user={user} onSearch={pick('q')} onCategory={pick('category')} onAuth={openAuth} onPost={openPost}
        onLogout={() => { session.clear(); setUser(null); }} />
      <main className="mx-auto max-w-7xl px-3 sm:px-4">
        {sellerId ? <SellerPage id={sellerId} user={user} favs={favs} onFav={toggleFav} onAuth={openAuth} />
          : dashboard ? <SellerDashboard />
          : admin ? <AdminPanel />
          : account ? <MyAccount favList={favList} favs={favs} onFav={toggleFav} onChanged={() => { setTick((t) => t + 1); loadFavs(); }} />
          : inChat ? <ChatPage id={chatId} user={user} />
          : productId ? <ProductPage id={productId} user={user} onAuth={openAuth} /> : <>
          <Hero onPost={openPost}>
            {!user && <LoginBox mode={mode} setMode={setMode} onDone={setUser} />}
          </Hero>
          <CategoryGrid categories={categories} active={filters.category} onSelect={set('category')} />
          <ProductGrid favs={favs} onFav={toggleFav} products={products} loading={loading} type={filters.type} setType={set('type')} sort={filters.sort} setSort={set('sort')} />
          <section className="grid gap-4 py-6 md:grid-cols-3">
            {values.map(([Icon, t, d]) => <div key={t} className="rounded-xl bg-white p-5 border border-brand/15"><span className="mb-3 grid size-10 place-items-center rounded-lg bg-brand/10 text-brand"><Icon className="size-5" /></span><h3 className="font-bold text-brand-dark">{t}</h3><p className="text-sm text-ink/70">{d}</p></div>)}
          </section>
          <section className="my-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-dark p-5 text-white sm:p-8">
            <p className="flex items-center gap-3 text-xl font-bold"><Megaphone className="size-8 shrink-0" />Got something to sell? Post your ad today and reach more buyers!</p>
            <button onClick={openPost} className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-brand-dark hover:bg-brand-tint"><CirclePlus className="size-5" />Post an Ad</button>
          </section>
        </>}
      </main>
      {postOpen && <PostAdForm categories={categories} onClose={() => setPostOpen(false)}
        onCreated={() => { setPostOpen(false); setTick((t) => t + 1); location.hash = '#listings'; }} />}
    </div>
  );
}
