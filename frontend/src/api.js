const BASE = import.meta.env.VITE_API_URL || '';
const token = () => localStorage.getItem('kyu_token');
async function req(path, opts = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token() && { Authorization: `Bearer ${token()}` }) },
    body: opts.body && JSON.stringify(opts.body),
  });
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data;
}
export const api = {
  products: (params = {}) => req(`/products?${new URLSearchParams(Object.entries(params).filter(([, v]) => v))}`),
  product: (id) => req(`/products/${id}`),
  upload: async (files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    const res = await fetch(`${BASE}/api/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'Upload failed');
    return d.urls;
  },
  mine: () => req('/products/mine'),
  favorites: () => req('/products/favorites'),
  addFav: (id) => req(`/products/${id}/favorite`, { method: 'POST' }),
  removeFav: (id) => req(`/products/${id}/favorite`, { method: 'DELETE' }),
  updateProduct: (id, body) => req(`/products/${id}`, { method: 'PUT', body }),
  deleteProduct: (id) => req(`/products/${id}`, { method: 'DELETE' }),
  analytics: () => req('/admin/analytics'),
  adminUsers: () => req('/admin/users'),
  banUser: (id, banned) => req(`/admin/users/${id}/ban`, { method: 'PUT', body: { banned } }),
  adminListings: () => req('/admin/listings'),
  adminDelete: (id) => req(`/admin/listings/${id}`, { method: 'DELETE' }),
  sellerStats: () => req('/sellers/stats'),
  seller: (id) => req(`/sellers/${id}`),
  rateSeller: (id, body) => req(`/sellers/${id}/rating`, { method: 'POST', body }),
  createProduct: (body) => req('/products', { method: 'POST', body }),
  categories: () => req('/products/categories'),
  login: (body) => req('/auth/login', { method: 'POST', body }),
  register: (body) => req('/auth/register', { method: 'POST', body }),
};
export const session = {
  save: ({ user, token }) => { localStorage.setItem('kyu_token', token); localStorage.setItem('kyu_user', JSON.stringify(user)); },
  user: () => JSON.parse(localStorage.getItem('kyu_user') || 'null'),
  clear: () => { localStorage.removeItem('kyu_token'); localStorage.removeItem('kyu_user'); },
};
export const timeAgo = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  for (const [n, u] of [[86400, 'day'], [3600, 'hour'], [60, 'minute']])
    if (s >= n) { const v = Math.floor(s / n); return `${v} ${u}${v > 1 ? 's' : ''} ago`; }
  return 'just now';
};
