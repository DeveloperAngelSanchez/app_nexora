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
    let friendly = error.message;
    if (error.message.includes('categories_pkey') || error.message.includes('duplicate key')) {
      friendly = 'Ya existe una categoría con este nombre o identificador (ID).';
    }
    return { success: false, error: friendly };
  }

  revalidatePath('/nxd-92f/categorias');
  revalidatePath('/nxd-92f/productos');
  revalidatePath('/catalogo');
  revalidatePath('/');
  return { success: true, data };
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const supabase = await createSupabaseServerClient();

  const updatePayload: any = {
    updated_at: new Date().toISOString(),
  };
  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.slug !== undefined) updatePayload.slug = input.slug;
  if (input.icon !== undefined) updatePayload.icon = input.icon || null;
  if (input.description !== undefined) updatePayload.description = input.description || null;
  if (input.sort_order !== undefined) updatePayload.sort_order = input.sort_order;
  if (input.is_active !== undefined) updatePayload.is_active = input.is_active;

  const { data, error } = await supabase
    .from('categories')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    let friendly = error.message;
    if (error.message.includes('duplicate key')) {
      friendly = 'Ya existe una categoría con este slug o nombre.';
    }
    return { success: false, error: friendly };
  }

  revalidatePath('/nxd-92f/categorias');
  revalidatePath('/nxd-92f/productos');
  revalidatePath('/catalogo');
  revalidatePath('/');
  if (data?.slug) {
    revalidatePath(`/categoria/${data.slug}`);
  }
  return { success: true, data };
}

export async function deleteCategory(id: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    let friendly = error.message;
    if (error.message.includes('violates foreign key constraint') || error.message.includes('is still referenced')) {
      friendly = 'No se puede eliminar la categoría porque tiene productos asignados. Reasigna o elimina los productos primero.';
    }
    return { success: false, error: friendly };
  }

  revalidatePath('/nxd-92f/categorias');
  revalidatePath('/nxd-92f/productos');
  revalidatePath('/catalogo');
  revalidatePath('/');
  return { success: true };
}
