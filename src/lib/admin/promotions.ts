'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface PromotionInput {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  type: 'hero_banner' | 'category_discount' | 'flash_sale' | 'coupon';
  banner_image?: string | null;
  link_url?: string | null;
  discount_value?: number | null;
  discount_type?: 'percentage' | 'fixed_amount' | null;
  applies_to?: 'all' | 'category' | 'brand' | 'product' | null;
  applies_to_value?: string | null;
  coupon_code?: string | null;
  starts_at?: string;
  ends_at?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export async function getAdminPromotions() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin promotions:', error.message);
    return [];
  }

  return data || [];
}

export async function createPromotion(input: PromotionInput) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('promotions')
    .insert([
      {
        ...input,
        starts_at: input.starts_at || new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/nxd-92f/promociones');
  revalidatePath('/');
  return data;
}

export async function updatePromotion(id: string, input: Partial<PromotionInput>) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('promotions')
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

  revalidatePath('/nxd-92f/promociones');
  revalidatePath('/');
  return data;
}

export async function deletePromotion(id: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/nxd-92f/promociones');
  revalidatePath('/');
  return true;
}
