import { Product, Category } from '@/types';
import { createClient } from '@supabase/supabase-js';

export interface FilterOptions {
  category?: string;
  brand?: string;
  search?: string;
  featured?: boolean;
  bestSeller?: boolean;
  isNew?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price-asc' | 'price-desc' | 'popular' | 'rating' | 'newest';
  limit?: number;
  page?: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getPublicSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Synchronous empty defaults for client components before fetch
 */
export function getLocalProducts(): Product[] {
  return [];
}

export function getLocalCategories(): Category[] {
  return [];
}

export function getLocalBrands(): string[] {
  return [];
}

/**
 * Maps Supabase DB Product row to Application Product interface
 */
function mapDbProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand_name || row.brand || '',
    categoryId: row.category_id || '',
    categoryName: row.categories?.name || row.category_id || '',
    price: Number(row.price),
    regularPrice: row.regular_price ? Number(row.regular_price) : Number(row.price),
    discountPercentage: row.discount_percentage || 0,
    currency: row.currency || 'PEN',
    symbol: row.symbol || 'S/',
    images: Array.isArray(row.images) ? row.images : [],
    rating: Number(row.rating) || 5.0,
    reviewCount: row.review_count || 0,
    inStock: row.in_stock ?? true,
    stock: row.stock ?? 0,
    isFeatured: row.is_featured ?? false,
    isBestSeller: row.is_best_seller ?? false,
    isNew: row.is_new ?? false,
    description: row.description || '',
    features: Array.isArray(row.features) ? row.features : [],
    variants: Array.isArray(row.variants) ? row.variants : [],
    sourceUrl: row.source_url || undefined,
  };
}

/**
 * Async live catalog getters from Supabase (100% Real Database Data)
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const supabase = getPublicSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching live products:', error?.message);
      return [];
    }

    return data.map(mapDbProduct);
  } catch (err) {
    console.error('Error in getAllProducts:', err);
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = getPublicSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: c.product_count || 0,
      icon: c.icon || undefined,
    }));
  } catch {
    return [];
  }
}

export async function getBrands(): Promise<string[]> {
  try {
    const supabase = getPublicSupabaseClient();
    if (!supabase) return [];

    const { data } = await supabase
      .from('brands')
      .select('name')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (data && data.length > 0) {
      return data.map((b) => b.name);
    }

    // Fallback to distinct brand_name from products
    const { data: prodData } = await supabase
      .from('products')
      .select('brand_name')
      .eq('is_active', true);

    if (prodData && prodData.length > 0) {
      return Array.from(new Set(prodData.map((p) => p.brand_name).filter(Boolean)));
    }

    return [];
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = getPublicSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return mapDbProduct(data);
  } catch {
    return null;
  }
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter((p) => p.isFeatured || p.isBestSeller).slice(0, limit);
}

export async function getRelatedProducts(
  currentId: string,
  categoryId: string,
  limit = 4
): Promise<Product[]> {
  const products = await getAllProducts();
  return products
    .filter((p) => p.id !== currentId && p.categoryId === categoryId)
    .slice(0, limit);
}

export function formatCurrency(amount: number, symbol = 'S/'): string {
  return `${symbol} ${amount.toFixed(2)}`;
}
