'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface SiteSettingsInput {
  store_name?: string;
  whatsapp_number?: string;
  whatsapp_message?: string;
  currency?: string;
  currency_symbol?: string;
  free_shipping_threshold?: number;
  default_shipping_cost?: number;
  meta_title?: string;
  meta_description?: string;
  social_instagram?: string | null;
  social_tiktok?: string | null;
  social_facebook?: string | null;
  announcement_bar?: string | null;
  is_maintenance_mode?: boolean;
}

export async function getAdminSiteSettings() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 'main')
    .single();

  if (error) {
    console.error('Error fetching settings:', error.message);
    return null;
  }

  return data;
}

export async function updateSiteSettings(input: SiteSettingsInput) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('site_settings')
    .upsert({
      id: 'main',
      ...input,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/nxd-92f/configuracion');
  revalidatePath('/');
  return data;
}
