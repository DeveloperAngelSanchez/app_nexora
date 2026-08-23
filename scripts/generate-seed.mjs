#!/usr/bin/env node
/**
 * Nexora Store — Catalog JSON → Supabase Seed SQL Generator
 * 
 * Reads src/data/catalog.json and generates supabase/seed.sql
 * with INSERT statements for categories and products.
 * 
 * Usage: node scripts/generate-seed.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const catalog = JSON.parse(
  readFileSync(resolve(ROOT, 'src/data/catalog.json'), 'utf-8')
);

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function jsonbValue(val) {
  if (!val || (Array.isArray(val) && val.length === 0)) return "'[]'::jsonb";
  return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
}

let sql = `-- =====================================================================
-- Nexora Store — Seed Data (auto-generated from catalog.json)
-- Generated at: ${new Date().toISOString()}
-- Total categories: ${catalog.categories.length}
-- Total products: ${catalog.products.length}
-- =====================================================================

-- Clear existing data (in correct order due to foreign keys)
TRUNCATE public.products CASCADE;
TRUNCATE public.categories CASCADE;

-- =====================================================================
-- CATEGORIES
-- =====================================================================
`;

for (const cat of catalog.categories) {
  sql += `INSERT INTO public.categories (id, name, slug, product_count, is_active) VALUES (
  ${escapeSQL(cat.id)},
  ${escapeSQL(cat.name)},
  ${escapeSQL(cat.slug)},
  ${cat.productCount || 0},
  true
);\n`;
}

sql += `
-- =====================================================================
-- PRODUCTS (${catalog.products.length} total)
-- =====================================================================
`;

for (const p of catalog.products) {
  sql += `INSERT INTO public.products (
  id, slug, name, brand, category_id,
  price, regular_price, discount_percentage,
  currency, symbol, images, rating, review_count,
  in_stock, stock, is_featured, is_best_seller, is_new, is_active,
  description, features, variants, source_url
) VALUES (
  ${escapeSQL(p.id)},
  ${escapeSQL(p.slug)},
  ${escapeSQL(p.name)},
  ${escapeSQL(p.brand)},
  ${escapeSQL(p.categoryId)},
  ${p.price},
  ${p.regularPrice || 'NULL'},
  ${p.discountPercentage || 0},
  ${escapeSQL(p.currency || 'PEN')},
  ${escapeSQL(p.symbol || 'S/')},
  ${jsonbValue(p.images)},
  ${p.rating || 5.0},
  ${p.reviewCount || 0},
  ${p.inStock !== false},
  ${p.stock || 0},
  ${p.isFeatured || false},
  ${p.isBestSeller || false},
  ${p.isNew || false},
  true,
  ${escapeSQL(p.description || '')},
  ${jsonbValue(p.features)},
  ${jsonbValue(p.variants)},
  ${escapeSQL(p.sourceUrl || null)}
);\n\n`;
}

sql += `
-- =====================================================================
-- DEFAULT SITE SETTINGS
-- =====================================================================
INSERT INTO public.site_settings (id, store_name, whatsapp_number, free_shipping_threshold, default_shipping_cost)
VALUES ('main', 'Nexora Tech', '${catalog.whatsappNumber || '51999999999'}', 150.00, 10.00)
ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  whatsapp_number = EXCLUDED.whatsapp_number;

-- =====================================================================
-- DONE! Seed complete.
-- Next: Create admin user in Supabase Dashboard > Authentication > Users
-- Then add that user's UUID to admin_users table:
--   INSERT INTO public.admin_users (id, email, display_name, role)
--   VALUES ('YOUR_AUTH_USER_UUID', 'your@email.com', 'Admin', 'super_admin');
-- =====================================================================
`;

const outputPath = resolve(ROOT, 'supabase/seed.sql');
writeFileSync(outputPath, sql, 'utf-8');

console.log(`✅ Seed SQL generated successfully!`);
console.log(`   📄 Output: ${outputPath}`);
console.log(`   📦 Categories: ${catalog.categories.length}`);
console.log(`   📦 Products: ${catalog.products.length}`);
console.log(`\n   Next steps:`);
console.log(`   1. Create Supabase project at https://supabase.com`);
console.log(`   2. Run supabase/schema.sql in SQL Editor`);
console.log(`   3. Run supabase/seed.sql in SQL Editor`);
console.log(`   4. Create admin user in Auth > Users`);
console.log(`   5. Copy .env.local.example to .env.local and fill in credentials`);
