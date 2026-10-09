# KYU Mart — Buy • Sell • Connect

## Run it
```bash
createdb kyu_mart
cd backend && cp .env.example .env     # set DATABASE_URL and JWT_SECRET
npm install && npm run migrate && npm run dev        # http://localhost:5000
cd ../frontend && npm install && npm run dev         # http://localhost:5173 (proxies /api)
```

## API
| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | /api/auth/register | – | full_name, email, phone_number, password |
| POST | /api/auth/login | – | identifier (email or phone), password |
| GET | /api/products | – | `category` (slug), `type` (FOR_SALE/FOR_EXCHANGE), `q`, `sort` (newest/price_asc/price_desc), `limit`, `offset` |
| GET | /api/products/categories | – | |
| GET | /api/products/:id | – | includes all images |
| POST | /api/products | JWT | title, category_id, price, listing_type, condition, images[] |
| PUT / DELETE | /api/products/:id | JWT (owner) | |

Not built yet: post-ad form, product detail page, OAuth (Google/Microsoft buttons are placeholders), image upload (listings take image URLs).
