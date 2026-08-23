export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          role: 'admin' | 'super_admin';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string;
          role?: 'admin' | 'super_admin';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          role?: 'admin' | 'super_admin';
          is_active?: boolean;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          product_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          product_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string | null;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          product_count?: number;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          brand: string;
          category_id: string | null;
          price: number;
          regular_price: number | null;
          discount_percentage: number;
          currency: string;
          symbol: string;
          images: Json;
          rating: number;
          review_count: number;
          in_stock: boolean;
          stock: number;
          is_featured: boolean;
          is_best_seller: boolean;
          is_new: boolean;
          is_active: boolean;
          description: string;
          features: Json;
          variants: Json;
          source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          brand: string;
          category_id?: string | null;
          price: number;
          regular_price?: number | null;
          discount_percentage?: number;
          currency?: string;
          symbol?: string;
          images?: Json;
          rating?: number;
          review_count?: number;
          in_stock?: boolean;
          stock?: number;
          is_featured?: boolean;
          is_best_seller?: boolean;
          is_new?: boolean;
          is_active?: boolean;
          description?: string;
          features?: Json;
          variants?: Json;
          source_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          brand?: string;
          category_id?: string | null;
          price?: number;
          regular_price?: number | null;
          discount_percentage?: number;
          currency?: string;
          symbol?: string;
          images?: Json;
          rating?: number;
          review_count?: number;
          in_stock?: boolean;
          stock?: number;
          is_featured?: boolean;
          is_best_seller?: boolean;
          is_new?: boolean;
          is_active?: boolean;
          description?: string;
          features?: Json;
          variants?: Json;
          source_url?: string | null;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          city: string;
          district: string;
          address: string;
          reference: string | null;
          payment_method: string;
          items: Json;
          subtotal: number;
          shipping_cost: number;
          total: number;
          status: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
          admin_notes: string | null;
          tracking_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          city: string;
          district: string;
          address: string;
          reference?: string | null;
          payment_method: string;
          items: Json;
          subtotal: number;
          shipping_cost?: number;
          total: number;
          status?: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
          admin_notes?: string | null;
          tracking_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
          admin_notes?: string | null;
          tracking_code?: string | null;
          updated_at?: string;
        };
      };
      promotions: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          description: string | null;
          type: 'hero_banner' | 'category_discount' | 'flash_sale' | 'coupon';
          banner_image: string | null;
          link_url: string | null;
          discount_value: number | null;
          discount_type: 'percentage' | 'fixed_amount' | null;
          applies_to: 'all' | 'category' | 'brand' | 'product' | null;
          applies_to_value: string | null;
          coupon_code: string | null;
          starts_at: string;
          ends_at: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          subtitle?: string | null;
          description?: string | null;
          type?: 'hero_banner' | 'category_discount' | 'flash_sale' | 'coupon';
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
          updated_at?: string;
        };
      };
      site_settings: {
        Row: {
          id: string;
          store_name: string;
          whatsapp_number: string;
          whatsapp_message: string;
          currency: string;
          currency_symbol: string;
          free_shipping_threshold: number;
          default_shipping_cost: number;
          meta_title: string;
          meta_description: string;
          social_instagram: string | null;
          social_tiktok: string | null;
          social_facebook: string | null;
          announcement_bar: string | null;
          is_maintenance_mode: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          updated_at?: string;
        };
        Update: {
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
          updated_at?: string;
        };
      };
    };
  };
}
