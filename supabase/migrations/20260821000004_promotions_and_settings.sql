-- =====================================================================
-- Migration: 20260821000004_promotions_and_settings.sql
-- Description: Promotions, Banners, Coupons, and Store Settings with Foreign Key Targets
-- Author: Principal Database & Software Architect
-- =====================================================================

-- 1. Promotions & Marketing Campaigns Table
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

-- 2. Global Site Configuration (Singleton Pattern)
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

-- Insert Default Settings Row
INSERT INTO public.site_settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_promotions_coupon ON public.promotions(coupon_code) WHERE coupon_code IS NOT NULL;
