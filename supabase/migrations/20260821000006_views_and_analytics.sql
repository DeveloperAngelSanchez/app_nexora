-- =====================================================================
-- Migration: 20260821000006_views_and_analytics.sql
-- Description: High-Performance Denormalized Views & Business Analytics
-- Author: Principal Database & Software Architect
-- =====================================================================

-- 1. Full Denormalized Catalog View (Single Query Storefront & App Feed)
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

-- 2. Orders Summary View (Enriched with Item Counts & Line Item Aggregation)
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

-- 3. Executive Store Analytics View (Real-time KPIs for Admin Dashboard)
CREATE OR REPLACE VIEW public.view_store_kpis AS
SELECT
    (SELECT COUNT(*) FROM public.products WHERE is_active = true) AS total_active_products,
    (SELECT COUNT(*) FROM public.products WHERE stock <= 5 AND is_active = true) AS total_low_stock,
    (SELECT COUNT(*) FROM public.categories WHERE is_active = true) AS total_categories,
    (SELECT COUNT(*) FROM public.brands WHERE is_active = true) AS total_brands,
    (SELECT COUNT(*) FROM public.orders) AS total_orders,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pending') AS total_pending_orders,
    (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE status IN ('confirmed', 'dispatched', 'delivered')) AS total_revenue_pen;
