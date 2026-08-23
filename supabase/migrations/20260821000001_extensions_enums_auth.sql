-- =====================================================================
-- Migration: 20260821000001_extensions_enums_auth.sql
-- Description: Core Extensions, Custom PostgreSQL Types (Enums), and Admin Auth Mapping
-- Author: Principal Database & Software Architect
-- =====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Domain Enums
DO $$ BEGIN
    CREATE TYPE public.user_role_enum AS ENUM ('admin', 'super_admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status_enum AS ENUM (
        'pending',       -- Waiting for payment / initial customer confirmation
        'confirmed',     -- Payment verified / order in preparation
        'dispatched',    -- Handed to courier (Olva Courier / motorizado)
        'delivered',     -- Delivered successfully to customer
        'cancelled'      -- Cancelled / refunded
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_method_enum AS ENUM (
        'whatsapp_yape_plin',
        'contraentrega',
        'transferencia',
        'card'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status_enum AS ENUM (
        'pending',
        'paid',
        'refunded',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.promo_type_enum AS ENUM (
        'hero_banner',
        'category_discount',
        'flash_sale',
        'coupon'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.discount_type_enum AS ENUM (
        'percentage',
        'fixed_amount'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.promo_target_enum AS ENUM (
        'all',
        'category',
        'brand',
        'product'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Admin Users (Maps Supabase Auth Users to RBAC Roles)
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

-- 4. Helper Function: Is Current Caller an Active Admin?
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
