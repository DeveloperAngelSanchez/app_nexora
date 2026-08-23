'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface ProductInput {
  id?: string;
  name: string;
  slug: string;
  brand: string;
  category_id: string;
  price: number;
  regular_price?: number | null;
  discount_percentage?: number;
  currency?: string;
  symbol?: string;
  images: string[];
  stock: number;
  in_stock?: boolean;
  is_featured?: boolean;
  is_best_seller?: boolean;
  is_new?: boolean;
  is_active?: boolean;
  description: string;
  features: string[];
  variants?: { name: string; options: string[] }[];
  source_url?: string | null;
}

export async function getAdminProducts(filters: { search?: string; category?: string; stockFilter?: string } = {}) {
  const supabase = await createSupabaseServerClient();
  
  let query = supabase
    .from('products')
    .select(`
      *,
      categories:category_id (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,brand_name.ilike.%${filters.search}%`);
  }

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category_id', filters.category);
  }

  if (filters.stockFilter === 'low') {
    query = query.lte('stock', 5);
  } else if (filters.stockFilter === 'out') {
    query = query.eq('stock', 0);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching admin products:', error.message);
    return [];
  }

  return data || [];
}

export async function getAdminProductById(id: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories:category_id (
        id,
        name
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product by id:', error.message);
    return null;
  }

  return data;
}

export const getProductById = getAdminProductById;

export async function createProduct(input: ProductInput) {
  const supabase = await createSupabaseServerClient();

  let discount_percentage = input.discount_percentage || 0;
  if (input.regular_price && input.regular_price > input.price) {
    discount_percentage = Math.round(((input.regular_price - input.price) / input.regular_price) * 100);
  }

  const newId = input.id || `NX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        id: newId,
        slug: input.slug,
        name: input.name,
        brand_name: input.brand || 'Genérico',
        category_id: input.category_id || null,
        price: input.price,
        regular_price: input.regular_price || null,
        discount_percentage,
        currency: input.currency || 'PEN',
        symbol: input.symbol || 'S/',
        images: input.images || [],
        stock: input.stock,
        in_stock: input.stock > 0,
        is_featured: input.is_featured ?? false,
        is_best_seller: input.is_best_seller ?? false,
        is_new: input.is_new ?? false,
        is_active: input.is_active ?? true,
        description: input.description || '',
        features: input.features || [],
        variants: input.variants || [],
        source_url: input.source_url || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error.message);
    return { success: false, error: error.message };
  }

  revalidatePath('/nxd-92f/productos');
  revalidatePath('/catalogo');
  revalidatePath('/');
  return { success: true, data };
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const supabase = await createSupabaseServerClient();

  let discount_percentage = input.discount_percentage;
  if (input.regular_price !== undefined && input.price !== undefined) {
    if (input.regular_price && input.regular_price > input.price) {
      discount_percentage = Math.round(((input.regular_price - input.price) / input.regular_price) * 100);
    } else {
      discount_percentage = 0;
    }
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.slug !== undefined) updateData.slug = input.slug;
  if (input.brand !== undefined) updateData.brand_name = input.brand;
  if (input.category_id !== undefined) updateData.category_id = input.category_id;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.regular_price !== undefined) updateData.regular_price = input.regular_price;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.symbol !== undefined) updateData.symbol = input.symbol;
  if (input.images !== undefined) updateData.images = input.images;
  if (input.stock !== undefined) updateData.stock = input.stock;
  if (input.is_featured !== undefined) updateData.is_featured = input.is_featured;
  if (input.is_best_seller !== undefined) updateData.is_best_seller = input.is_best_seller;
  if (input.is_new !== undefined) updateData.is_new = input.is_new;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.features !== undefined) updateData.features = input.features;
  if (input.variants !== undefined) updateData.variants = input.variants;
  if (input.source_url !== undefined) updateData.source_url = input.source_url;

  if (discount_percentage !== undefined) {
    updateData.discount_percentage = discount_percentage;
  }

  if (input.stock !== undefined) {
    updateData.in_stock = input.stock > 0;
  }

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/nxd-92f/productos');
  revalidatePath(`/producto/${data.slug}`);
  revalidatePath('/catalogo');
  revalidatePath('/');
  return { success: true, data };
}

export async function toggleProductActive(id: string, is_active: boolean) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('products')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/nxd-92f/productos');
  revalidatePath('/catalogo');
  revalidatePath('/');
  return { success: true };
}

export async function deleteProduct(id: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/nxd-92f/productos');
  revalidatePath('/catalogo');
  revalidatePath('/');
  return { success: true };
}

export async function uploadImageAction(formData: FormData): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('No se ha proporcionado ningún archivo');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError.message);
    throw new Error(`Error al subir imagen: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return publicUrl;
}
