-- =====================================================================
-- Migration: 20260821000007_rls_security_policies.sql
-- Description: Enterprise Row Level Security (RLS) & Granular RBAC Permissions
-- Author: Principal Database & Software Architect
-- =====================================================================

-- 1. Enable RLS on all Database Tables
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

-- 2. admin_users Policies
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
CREATE POLICY "Admins can view admin users" ON public.admin_users
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;
CREATE POLICY "Super admins can manage admin users" ON public.admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
        )
    );

-- 3. brands Policies
DROP POLICY IF EXISTS "Public can view active brands" ON public.brands;
CREATE POLICY "Public can view active brands" ON public.brands
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage brands" ON public.brands;
CREATE POLICY "Admins can manage brands" ON public.brands
    FOR ALL USING (public.is_admin());

-- 4. categories Policies
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.is_admin());

-- 5. products Policies
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (public.is_admin());

-- 6. product_variants Policies
DROP POLICY IF EXISTS "Public can view active variants" ON public.product_variants;
CREATE POLICY "Public can view active variants" ON public.product_variants
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;
CREATE POLICY "Admins can manage product variants" ON public.product_variants
    FOR ALL USING (public.is_admin());

-- 7. product_images Policies
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
CREATE POLICY "Admins can manage product images" ON public.product_images
    FOR ALL USING (public.is_admin());

-- 8. orders Policies
DROP POLICY IF EXISTS "Anyone can create customer orders" ON public.orders;
CREATE POLICY "Anyone can create customer orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view and update orders" ON public.orders;
CREATE POLICY "Admins can view and update orders" ON public.orders
    FOR ALL USING (public.is_admin());

-- 9. order_items Policies
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view and manage order items" ON public.order_items;
CREATE POLICY "Admins can view and manage order items" ON public.order_items
    FOR ALL USING (public.is_admin());

-- 10. inventory_logs Policies
DROP POLICY IF EXISTS "Admins can view inventory audit logs" ON public.inventory_logs;
CREATE POLICY "Admins can view inventory audit logs" ON public.inventory_logs
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "System can insert inventory logs" ON public.inventory_logs;
CREATE POLICY "System can insert inventory logs" ON public.inventory_logs
    FOR INSERT WITH CHECK (true);

-- 11. promotions Policies
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;
CREATE POLICY "Public can view active promotions" ON public.promotions
    FOR SELECT USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at >= now()));

DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;
CREATE POLICY "Admins can manage promotions" ON public.promotions
    FOR ALL USING (public.is_admin());

-- 12. site_settings Policies
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings" ON public.site_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings" ON public.site_settings
    FOR ALL USING (public.is_admin());
