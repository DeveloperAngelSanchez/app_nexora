-- =====================================================================
-- Migration: 20260821000005_triggers_and_business_logic.sql
-- Description: Business Rules, Dynamic Trigger Functions, and Inventory Automation
-- Author: Principal Database & Software Architect
-- =====================================================================

-- 1. Universal updated_at Timestamp Trigger Function
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_brands_updated_at ON public.brands;
CREATE TRIGGER trg_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER trg_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_promotions_updated_at ON public.promotions;
CREATE TRIGGER trg_promotions_updated_at
    BEFORE UPDATE ON public.promotions
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 2. Automatic Category and Brand Product Count Synchronizer
CREATE OR REPLACE FUNCTION public.fn_sync_catalog_counts()
RETURNS TRIGGER AS $$
DECLARE
    v_cat_id TEXT;
    v_brand_id TEXT;
BEGIN
    -- Handle Category product counts
    IF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
        IF OLD.category_id IS NOT NULL THEN
            UPDATE public.categories SET product_count = (
                SELECT COUNT(*) FROM public.products WHERE category_id = OLD.category_id AND is_active = true
            ) WHERE id = OLD.category_id;
        END IF;
    END IF;

    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_cat_id := NEW.category_id;
        IF v_cat_id IS NOT NULL THEN
            UPDATE public.categories SET product_count = (
                SELECT COUNT(*) FROM public.products WHERE category_id = v_cat_id AND is_active = true
            ) WHERE id = v_cat_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_cat_id := OLD.category_id;
        IF v_cat_id IS NOT NULL THEN
            UPDATE public.categories SET product_count = (
                SELECT COUNT(*) FROM public.products WHERE category_id = v_cat_id AND is_active = true
            ) WHERE id = v_cat_id;
        END IF;
    END IF;

    -- Handle Brand product counts
    IF TG_OP = 'UPDATE' AND OLD.brand_id IS DISTINCT FROM NEW.brand_id THEN
        IF OLD.brand_id IS NOT NULL THEN
            UPDATE public.brands SET product_count = (
                SELECT COUNT(*) FROM public.products WHERE brand_id = OLD.brand_id AND is_active = true
            ) WHERE id = OLD.brand_id;
        END IF;
    END IF;

    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_brand_id := NEW.brand_id;
        IF v_brand_id IS NOT NULL THEN
            UPDATE public.brands SET product_count = (
                SELECT COUNT(*) FROM public.products WHERE brand_id = v_brand_id AND is_active = true
            ) WHERE id = v_brand_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_brand_id := OLD.brand_id;
        IF v_brand_id IS NOT NULL THEN
            UPDATE public.brands SET product_count = (
                SELECT COUNT(*) FROM public.products WHERE brand_id = v_brand_id AND is_active = true
            ) WHERE id = v_brand_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_catalog_counts ON public.products;
CREATE TRIGGER trg_sync_catalog_counts
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.fn_sync_catalog_counts();

-- 3. Automatic Stock Deduction on Order Item Creation with Audit Trail
CREATE OR REPLACE FUNCTION public.fn_on_order_item_created()
RETURNS TRIGGER AS $$
DECLARE
    v_prev_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Deduct variant stock if variant exists
    IF NEW.variant_id IS NOT NULL THEN
        SELECT stock INTO v_prev_stock FROM public.product_variants WHERE id = NEW.variant_id;
        IF v_prev_stock IS NOT NULL THEN
            v_new_stock := GREATEST(0, v_prev_stock - NEW.quantity);
            UPDATE public.product_variants SET stock = v_new_stock WHERE id = NEW.variant_id;

            INSERT INTO public.inventory_logs (
                product_id, variant_id, change_qty, previous_stock, new_stock, reason, order_id
            ) VALUES (
                NEW.product_id, NEW.variant_id, -NEW.quantity, v_prev_stock, v_new_stock, 'order_placed', NEW.order_id
            );
        END IF;
    END IF;

    -- Deduct main product stock
    IF NEW.product_id IS NOT NULL THEN
        SELECT stock INTO v_prev_stock FROM public.products WHERE id = NEW.product_id;
        IF v_prev_stock IS NOT NULL THEN
            v_new_stock := GREATEST(0, v_prev_stock - NEW.quantity);
            UPDATE public.products 
            SET stock = v_new_stock,
                in_stock = (v_new_stock > 0)
            WHERE id = NEW.product_id;

            INSERT INTO public.inventory_logs (
                product_id, variant_id, change_qty, previous_stock, new_stock, reason, order_id
            ) VALUES (
                NEW.product_id, NEW.variant_id, -NEW.quantity, v_prev_stock, v_new_stock, 'order_placed', NEW.order_id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_item_stock_deduction ON public.order_items;
CREATE TRIGGER trg_order_item_stock_deduction
    AFTER INSERT ON public.order_items
    FOR EACH ROW EXECUTE FUNCTION public.fn_on_order_item_created();
