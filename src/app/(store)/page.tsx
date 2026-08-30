import React from 'react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryPills } from '@/components/home/CategoryPills';
import { ProductGrid } from '@/components/products/ProductGrid';
import { getAllProducts, getCategories } from '@/lib/catalog';
import { getPublicSiteSettings, getActiveHeroBanners } from '@/lib/settings';
import { MessageCircle, Zap } from 'lucide-react';

export const revalidate = 60;

export default async function HomePage() {
  const [allProducts, categories, settings, heroBanners] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getPublicSiteSettings(),
    getActiveHeroBanners(),
  ]);

  const cleanPhone = (settings.whatsapp_number || '51999999999').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    settings.whatsapp_message || `Hola ${settings.store_name}, deseo asesoría sobre un producto`
  )}`;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* 1. Dynamic Hero Banner (from Supabase promotions or clean dynamic store fallback) */}
      <HeroBanner banners={heroBanners} settings={settings} />

      {/* 2. Category Pills (100% Real from Supabase categories) */}
      <CategoryPills categories={categories} />

      {/* 3. Products Grid (100% Real from Supabase products) */}
      <ProductGrid initialProducts={allProducts} />

      {/* 4. Direct WhatsApp Consultation Banner - 100% Dynamic from site_settings */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-slate-50 rounded-3xl p-6 sm:p-10 border border-emerald-200/80 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 fill-emerald-700" />
                <span>Atención Personalizada 24/7</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                ¿Consultas sobre compatibilidad, stock o envíos?
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Escríbenos directamente a través de WhatsApp. Un asesor de {settings.store_name} te confirmará disponibilidad, fotos reales y costo de envío para tu distrito o provincia.
              </p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-4 rounded-full text-xs shadow-sm transition-all touch-press shrink-0 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contactar por WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
