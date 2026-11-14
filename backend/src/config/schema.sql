CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN CREATE TYPE listing_type AS ENUM ('FOR_SALE','FOR_EXCHANGE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE product_status AS ENUM ('AVAILABLE','SOLD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  campus_location TEXT NOT NULL DEFAULT 'KYU Main Campus',
  profile_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, icon_name TEXT
);
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES categories(id),
  title TEXT NOT NULL, description TEXT,
  price NUMERIC(12,2) CHECK (price >= 0),
  listing_type listing_type NOT NULL DEFAULT 'FOR_SALE',
  condition TEXT NOT NULL DEFAULT 'Good Condition',
  location TEXT NOT NULL DEFAULT 'KYU Main Campus',
  status product_status NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL, is_primary BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_type_status ON products(listing_type, status);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);

INSERT INTO categories (name, slug, icon_name) VALUES
 ('Electronics','electronics','laptop'),('Books & Notes','books-notes','book'),
 ('Clothing & Fashion','clothing-fashion','shirt'),('Furniture','furniture','armchair'),
 ('Phones & Accessories','phones-accessories','smartphone'),('Home & Living','home-living','home'),
 ('Sports & Hobbies','sports-hobbies','dumbbell'),('Others','others','package')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS product_views (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewer_key TEXT NOT NULL,
  view_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, viewer_key, view_date)
);
CREATE INDEX IF NOT EXISTS idx_views_product_created ON product_views(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS seller_ratings (
  id SERIAL PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (seller_id, rater_id),
  CHECK (seller_id <> rater_id)
);
CREATE INDEX IF NOT EXISTS idx_ratings_seller ON seller_ratings(seller_id);
