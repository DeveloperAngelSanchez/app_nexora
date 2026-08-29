-- =====================================================================
-- Migration: 20260829000001_add_barcode_to_products.sql
-- Description: Add barcode support to products for camera & remote scanning
-- =====================================================================

-- 1. Add barcode column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE;

-- 2. Create index on barcode for fast lookup during scanning
CREATE INDEX IF NOT EXISTS idx_products_barcode 
ON public.products(barcode) 
WHERE barcode IS NOT NULL;

-- 3. Update view_catalog_products to include barcode
CREATE OR REPLACE VIEW public.view_catalog_products AS
SELECT
    p.id,
    p.slug,
    p.name,
    p.barcode,
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
