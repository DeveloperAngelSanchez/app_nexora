import { createClient } from '@supabase/supabase-js';

export interface PublicSiteSettings {
  store_name: string;
  whatsapp_number: string;
  whatsapp_message: string;
  currency: string;
  currency_symbol: string;
  free_shipping_threshold: number;
  default_shipping_cost: number;
  meta_title: string;
  meta_description: string;
  store_description?: string;
  social_instagram: string | null;
  social_tiktok: string | null;
  social_facebook: string | null;
  announcement_bar: string | null;
  is_maintenance_mode: boolean;
}

export interface HeroBannerItem {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  banner_image: string | null;
  link_url: string | null;
  discount_value: number | null;
  discount_type: 'percentage' | 'fixed_amount' | null;
  sort_order: number;
  is_active: boolean;
}

const DEFAULT_SETTINGS: PublicSiteSettings = {
  store_name: 'Nexora Store',
  whatsapp_number: '51999999999',
  whatsapp_message: 'Hola Nexora Store, deseo consultar sobre un producto',
  currency: 'PEN',
  currency_symbol: 'S/',
  free_shipping_threshold: 150,
  default_shipping_cost: 10,
  meta_title: 'Nexora Store Perú | Tienda Online Oficial',
  meta_description: 'Tienda online tecnológica con despachos a todo el Perú y garantía directa.',
  social_instagram: null,
  social_tiktok: null,
  social_facebook: null,
  announcement_bar: null,
  is_maintenance_mode: false,
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Fetch live public store configuration from Supabase 'site_settings' table
 */
export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return DEFAULT_SETTINGS;

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'main')
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_SETTINGS;
    }

    return {
      store_name: data.store_name || DEFAULT_SETTINGS.store_name,
      whatsapp_number: data.whatsapp_number || DEFAULT_SETTINGS.whatsapp_number,
      whatsapp_message: data.whatsapp_message || DEFAULT_SETTINGS.whatsapp_message,
      currency: data.currency || DEFAULT_SETTINGS.currency,
      currency_symbol: data.currency_symbol || DEFAULT_SETTINGS.currency_symbol,
      free_shipping_threshold: data.free_shipping_threshold !== undefined ? Number(data.free_shipping_threshold) : DEFAULT_SETTINGS.free_shipping_threshold,
      default_shipping_cost: data.default_shipping_cost !== undefined ? Number(data.default_shipping_cost) : DEFAULT_SETTINGS.default_shipping_cost,
      meta_title: data.meta_title || DEFAULT_SETTINGS.meta_title,
      meta_description: data.meta_description || DEFAULT_SETTINGS.meta_description,
      social_instagram: data.social_instagram || null,
      social_tiktok: data.social_tiktok || null,
      social_facebook: data.social_facebook || null,
      announcement_bar: data.announcement_bar || null,
      is_maintenance_mode: data.is_maintenance_mode ?? false,
    };
  } catch (err) {
    console.error('Error fetching site_settings:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Fetch active hero banners from Supabase 'promotions' table
 */
export async function getActiveHeroBanners(): Promise<HeroBannerItem[]> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('type', 'hero_banner')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle || null,
      description: item.description || null,
      banner_image: item.banner_image || null,
      link_url: item.link_url || null,
      discount_value: item.discount_value ? Number(item.discount_value) : null,
      discount_type: item.discount_type || 'percentage',
      sort_order: item.sort_order || 0,
      is_active: item.is_active ?? true,
    }));
  } catch (err) {
    console.error('Error fetching hero banners:', err);
    return [];
  }
}
