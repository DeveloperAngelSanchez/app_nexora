-- =====================================================================
-- Migration: 20260912000002_create_storage_product_images.sql
-- Description: Ensure product-images storage bucket exists with public access and upload policies
-- =====================================================================

-- 1. Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']::text[];

-- 2. Storage RLS Policies for product-images

-- Public view access
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Insert policy (allow admins and users in admin dashboard to upload)
DROP POLICY IF EXISTS "Allow uploads to product images" ON storage.objects;
CREATE POLICY "Allow uploads to product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- Update policy
DROP POLICY IF EXISTS "Allow updates to product images" ON storage.objects;
CREATE POLICY "Allow updates to product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Delete policy
DROP POLICY IF EXISTS "Allow deletes from product images" ON storage.objects;
CREATE POLICY "Allow deletes from product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
