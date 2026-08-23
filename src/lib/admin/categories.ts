'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface CategoryInput {
  id?: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export async function getAdminCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching admin categories:', error.message);
    return [];
  }

  return data || [];
}

export async function createCategory(input: CategoryInput) {
  const supabase = await createSupabaseServerClient();
  
  const id = input.id || input.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
  const { data, error } = await supabase
    .from('categories')
    .insert([
      {
        id,
        name: input.name,
        slug: input.slug,
        icon: input.icon || null,
        description: input.description || null,
        sort_order: input.sort_order || 0,
        is_active: input.is_active ?? true,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/nxd-92f/categorias');
  revalidatePath('/nxd-92f/productos');
  revalidatePath('/catalogo');
  revalidatePath('/');
  return data;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('categories')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/nxd-92f/categorias');
  revalidatePath('/nxd-92f/productos');
  revalidatePath('/catalogo');
  revalidatePath('/');
  return data;
}

export async function deleteCategory(id: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/nxd-92f/categorias');
  revalidatePath('/nxd-92f/productos');
  revalidatePath('/catalogo');
  revalidatePath('/');
  return true;
}
