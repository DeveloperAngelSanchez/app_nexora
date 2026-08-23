-- =====================================================================
-- NEXORA STORE — ENTERPRISE DATABASE ARCHITECTURE (MASTER SCHEMA)
-- Platform: Supabase / PostgreSQL
-- Architecture: 3NF Relational Model + Denormalized High-Performance Views
-- Version: 2.0.0
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EXTENSIONS & ENUMS
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE public.user_role_enum AS ENUM ('admin', 'super_admin', 'staff');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status_enum AS ENUM ('pending', 'confirmed', 'dispatched', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_method_enum AS ENUM ('whatsapp_yape_plin', 'contraentrega', 'transferencia', 'card');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status_enum AS ENUM ('pending', 'paid', 'refunded', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.promo_type_enum AS ENUM ('hero_banner', 'category_discount', 'flash_sale', 'coupon');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.discount_type_enum AS ENUM ('percentage', 'fixed_amount');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.promo_target_enum AS ENUM ('all', 'category', 'brand', 'product');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------------------------------------------------------------------
-- 2. ADMIN USERS & RBAC
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL DEFAULT 'Administrador',
    role public.user_role_enum NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE id = auth.uid()
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------
-- 3. BRANDS & CATEGORIES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    product_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    image_url TEXT,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    product_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 4. PRODUCTS, VARIANTS & IMAGES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('NX-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand_id TEXT REFERENCES public.brands(id) ON DELETE SET NULL,
    brand_name TEXT NOT NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
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
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sku TEXT UNIQUE,
    price_override NUMERIC(10, 2) CHECK (price_override IS NULL OR price_override >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    color TEXT,
    color_hex TEXT,
    model_name TEXT,
    storage_capacity TEXT,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    storage_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 5. ORDERS, ORDER ITEMS & INVENTORY LOGS
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1001;

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE DEFAULT ('NX-' || LPAD(nextval('public.order_number_seq')::text, 6, '0')),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    address TEXT NOT NULL,
    reference TEXT,
    payment_method public.payment_method_enum NOT NULL DEFAULT 'whatsapp_yape_plin',
    payment_status public.payment_status_enum NOT NULL DEFAULT 'pending',
    status public.order_status_enum NOT NULL DEFAULT 'pending',
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    admin_notes TEXT,
    tracking_code TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT,
    variant_title TEXT,
    image_url TEXT,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    change_qty INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 6. PROMOTIONS & SITE SETTINGS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    type public.promo_type_enum NOT NULL DEFAULT 'hero_banner',
    banner_image TEXT,
    link_url TEXT,
    discount_value NUMERIC(10, 2) CHECK (discount_value IS NULL OR discount_value >= 0),
    discount_type public.discount_type_enum DEFAULT 'percentage',
    applies_to public.promo_target_enum DEFAULT 'all',
    target_category_id TEXT REFERENCES public.categories(id) ON DELETE CASCADE,
    target_brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
    target_product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    coupon_code TEXT UNIQUE,
    min_order_amount NUMERIC(10, 2) DEFAULT 0 CHECK (min_order_amount >= 0),
    max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
    times_used INTEGER NOT NULL DEFAULT 0 CHECK (times_used >= 0),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_promo_dates CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    store_name TEXT NOT NULL DEFAULT 'Nexora Tech',
    whatsapp_number TEXT NOT NULL DEFAULT '51999999999',
    whatsapp_message TEXT NOT NULL DEFAULT 'Hola Nexora Tech, deseo asesoría sobre un producto',
    currency TEXT NOT NULL DEFAULT 'PEN',
    currency_symbol TEXT NOT NULL DEFAULT 'S/',
    free_shipping_threshold NUMERIC(10, 2) NOT NULL DEFAULT 150.00 CHECK (free_shipping_threshold >= 0),
    default_shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 10.00 CHECK (default_shipping_cost >= 0),
    meta_title TEXT NOT NULL DEFAULT 'Nexora Tech | Accesorios Apple, UGREEN y Tecnología en Perú',
    meta_description TEXT NOT NULL DEFAULT 'Tienda online tecnológica en Perú.',
    social_instagram TEXT,
    social_tiktok TEXT,
    social_facebook TEXT,
    announcement_bar TEXT,
    is_maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 7. PERFORMANCE INDEXES
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON public.inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active, starts_at, ends_at);

-- ---------------------------------------------------------------------
-- 8. BUSINESS LOGIC TRIGGERS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_brands_updated_at ON public.brands;
CREATE TRIGGER trg_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER trg_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_promotions_updated_at ON public.promotions;
CREATE TRIGGER trg_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- Synchronize Category & Brand product counts automatically
CREATE OR REPLACE FUNCTION public.fn_sync_catalog_counts()
RETURNS TRIGGER AS $$
DECLARE
    v_cat_id TEXT;
    v_brand_id TEXT;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
        IF OLD.category_id IS NOT NULL THEN
            UPDATE public.categories SET product_count = (SELECT COUNT(*) FROM public.products WHERE category_id = OLD.category_id AND is_active = true) WHERE id = OLD.category_id;
        END IF;
    END IF;

    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_cat_id := NEW.category_id;
        IF v_cat_id IS NOT NULL THEN
            UPDATE public.categories SET product_count = (SELECT COUNT(*) FROM public.products WHERE category_id = v_cat_id AND is_active = true) WHERE id = v_cat_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_cat_id := OLD.category_id;
        IF v_cat_id IS NOT NULL THEN
            UPDATE public.categories SET product_count = (SELECT COUNT(*) FROM public.products WHERE category_id = v_cat_id AND is_active = true) WHERE id = v_cat_id;
        END IF;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.brand_id IS DISTINCT FROM NEW.brand_id THEN
        IF OLD.brand_id IS NOT NULL THEN
            UPDATE public.brands SET product_count = (SELECT COUNT(*) FROM public.products WHERE brand_id = OLD.brand_id AND is_active = true) WHERE id = OLD.brand_id;
        END IF;
    END IF;

    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_brand_id := NEW.brand_id;
        IF v_brand_id IS NOT NULL THEN
            UPDATE public.brands SET product_count = (SELECT COUNT(*) FROM public.products WHERE brand_id = v_brand_id AND is_active = true) WHERE id = v_brand_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_brand_id := OLD.brand_id;
        IF v_brand_id IS NOT NULL THEN
            UPDATE public.brands SET product_count = (SELECT COUNT(*) FROM public.products WHERE brand_id = v_brand_id AND is_active = true) WHERE id = v_brand_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_catalog_counts ON public.products;
CREATE TRIGGER trg_sync_catalog_counts AFTER INSERT OR UPDATE OR DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.fn_sync_catalog_counts();

-- Stock deduction and audit on order items
CREATE OR REPLACE FUNCTION public.fn_on_order_item_created()
RETURNS TRIGGER AS $$
DECLARE
    v_prev_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    IF NEW.variant_id IS NOT NULL THEN
        SELECT stock INTO v_prev_stock FROM public.product_variants WHERE id = NEW.variant_id;
        IF v_prev_stock IS NOT NULL THEN
            v_new_stock := GREATEST(0, v_prev_stock - NEW.quantity);
            UPDATE public.product_variants SET stock = v_new_stock WHERE id = NEW.variant_id;
            INSERT INTO public.inventory_logs (product_id, variant_id, change_qty, previous_stock, new_stock, reason, order_id)
            VALUES (NEW.product_id, NEW.variant_id, -NEW.quantity, v_prev_stock, v_new_stock, 'order_placed', NEW.order_id);
        END IF;
    END IF;

    IF NEW.product_id IS NOT NULL THEN
        SELECT stock INTO v_prev_stock FROM public.products WHERE id = NEW.product_id;
        IF v_prev_stock IS NOT NULL THEN
            v_new_stock := GREATEST(0, v_prev_stock - NEW.quantity);
            UPDATE public.products SET stock = v_new_stock, in_stock = (v_new_stock > 0) WHERE id = NEW.product_id;
            INSERT INTO public.inventory_logs (product_id, variant_id, change_qty, previous_stock, new_stock, reason, order_id)
            VALUES (NEW.product_id, NEW.variant_id, -NEW.quantity, v_prev_stock, v_new_stock, 'order_placed', NEW.order_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_item_stock_deduction ON public.order_items;
CREATE TRIGGER trg_order_item_stock_deduction AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.fn_on_order_item_created();

-- ---------------------------------------------------------------------
-- 9. DENORMALIZED VIEWS & ANALYTICS
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_catalog_products AS
SELECT
    p.id,
    p.slug,
    p.name,
    p.brand_id,
    p.brand_name,
    b.slug AS brand_slug,
    b.logo_url AS brand_logo,
    p.category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    c.icon AS category_icon,
    p.price,
    p.regular_price,
    p.discount_percentage,
    p.currency,
    p.symbol,
    p.rating,
    p.review_count,
    p.stock,
    p.in_stock,
    p.is_featured,
    p.is_best_seller,
    p.is_new,
    p.is_active,
    p.description,
    p.short_description,
    p.features,
    p.images,
    p.source_url,
    p.created_at,
    p.updated_at,
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', pv.id,
                    'title', pv.title,
                    'sku', pv.sku,
                    'price_override', pv.price_override,
                    'stock', pv.stock,
                    'color', pv.color,
                    'color_hex', pv.color_hex,
                    'model_name', pv.model_name,
                    'storage_capacity', pv.storage_capacity,
                    'attributes', pv.attributes,
                    'image_url', pv.image_url
                ) ORDER BY pv.sort_order ASC
            )
            FROM public.product_variants pv
            WHERE pv.product_id = p.id AND pv.is_active = true
        ),
        '[]'::jsonb
    ) AS variants
FROM public.products p
LEFT JOIN public.brands b ON b.id = p.brand_id
LEFT JOIN public.categories c ON c.id = p.category_id;

CREATE OR REPLACE VIEW public.view_orders_summary AS
SELECT
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_phone,
    o.customer_email,
    o.city,
    o.district,
    o.address,
    o.reference,
    o.payment_method,
    o.payment_status,
    o.status,
    o.subtotal,
    o.discount_amount,
    o.shipping_cost,
    o.total,
    o.items,
    o.admin_notes,
    o.tracking_code,
    o.created_at,
    o.updated_at,
    COUNT(oi.id) AS total_line_items,
    COALESCE(SUM(oi.quantity), 0) AS total_units_ordered
FROM public.orders o
LEFT JOIN public.order_items oi ON oi.order_id = o.id
GROUP BY o.id;

CREATE OR REPLACE VIEW public.view_store_kpis AS
SELECT
    (SELECT COUNT(*) FROM public.products WHERE is_active = true) AS total_active_products,
    (SELECT COUNT(*) FROM public.products WHERE stock <= 5 AND is_active = true) AS total_low_stock,
    (SELECT COUNT(*) FROM public.categories WHERE is_active = true) AS total_categories,
    (SELECT COUNT(*) FROM public.brands WHERE is_active = true) AS total_brands,
    (SELECT COUNT(*) FROM public.orders) AS total_orders,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pending') AS total_pending_orders,
    (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE status IN ('confirmed', 'dispatched', 'delivered')) AS total_revenue_pen;

-- ---------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------------------
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin users" ON public.admin_users FOR SELECT USING (public.is_admin());
CREATE POLICY "Public can view active brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Admins can manage brands" ON public.brands FOR ALL USING (public.is_admin());
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Public can view active variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage product variants" ON public.product_variants FOR ALL USING (public.is_admin());
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage product images" ON public.product_images FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can create customer orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view and update orders" ON public.orders FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view and manage order items" ON public.order_items FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view inventory audit logs" ON public.inventory_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "System can insert inventory logs" ON public.inventory_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view active promotions" ON public.promotions FOR SELECT USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at >= now()));
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL USING (public.is_admin());
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR ALL USING (public.is_admin());
