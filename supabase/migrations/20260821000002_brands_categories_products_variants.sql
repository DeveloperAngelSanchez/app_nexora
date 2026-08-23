-- =====================================================================
-- Migration: 20260821000002_brands_categories_products_variants.sql
-- Description: Core Catalog Entities (Brands, Categories, Products, Variants, Images)
-- Author: Principal Database & Software Architect
-- =====================================================================

-- 1. Brands Table (Normalized Brand Entity)
CREATE TABLE IF NOT EXISTS public.brands (
    id TEXT PRIMARY KEY,                           -- Slug-like primary key (e.g. 'apple', 'ugreen')
    name TEXT NOT NULL UNIQUE,                     -- Display name (e.g. 'Apple', 'UGREEN')
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    product_count INTEGER NOT NULL DEFAULT 0,      -- Maintained via trigger
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Categories Table (Hierarchical Category Entity)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,                           -- Slug-like primary key (e.g. 'cargadores', 'cases')
    parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL, -- Subcategory support
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    image_url TEXT,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    product_count INTEGER NOT NULL DEFAULT 0,      -- Maintained via trigger
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Products Table (Master Product Entity)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('NX-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand_id TEXT REFERENCES public.brands(id) ON DELETE RESTRICT,
    brand_name TEXT NOT NULL,                      -- Denormalized cache for fast querying
    category_id TEXT REFERENCES public.categories(id) ON DELETE RESTRICT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    regular_price NUMERIC(10, 2) CHECK (regular_price IS NULL OR regular_price >= 0),
    discount_percentage INTEGER NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    currency TEXT NOT NULL DEFAULT 'PEN',
    symbol TEXT NOT NULL DEFAULT 'S/',
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5.0),
    review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    in_stock BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_best_seller BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT NOT NULL DEFAULT '',
    short_description TEXT,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,   -- Array of bullet-point strings
    images JSONB NOT NULL DEFAULT '[]'::jsonb,     -- Fast JSON array of image URLs
    source_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Product Variants Table (Normalized SKUs & Specific Stock Levels)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    title TEXT NOT NULL,                           -- e.g. "Negro Espacial / 20W"
    sku TEXT UNIQUE,                               -- e.g. "NX-APL-C2C-BLK"
    price_override NUMERIC(10, 2) CHECK (price_override IS NULL OR price_override >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    color TEXT,
    color_hex TEXT,
    model_name TEXT,
    storage_capacity TEXT,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb, -- Key-value map of arbitrary specs
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Product Images Table (Normalized Media Assets with Ordering & Storage Metadata)
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    storage_path TEXT,                             -- Path inside Supabase Storage bucket
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Strategic Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
