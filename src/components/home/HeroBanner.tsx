'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Truck, Zap, ShoppingBag } from 'lucide-react';
import { HeroBannerItem, PublicSiteSettings } from '@/lib/settings';

interface HeroBannerProps {
  banners?: HeroBannerItem[];
  settings?: PublicSiteSettings;
}

export function HeroBanner({ banners = [], settings }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeBanners = banners.filter((b) => b.is_active);
  const totalSlides = activeBanners.length;

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 7000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  const nextSlide = () => {
    if (totalSlides > 1) {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }
  };

  const prevSlide = () => {
    if (totalSlides > 1) {
      setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    }
  };

  const storeName = settings?.store_name || 'Nexora Store';
  const freeThreshold = settings?.free_shipping_threshold ?? 150;
  const currencySymbol = settings?.currency_symbol || 'S/';

  // 1. Clean Fallback State when 0 banners are created in Supabase (Clean Slate)
  if (totalSlides === 0) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-100/80 to-slate-50 py-6 sm:py-10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-white border border-slate-200 shadow-lg p-6 sm:p-10 lg:p-14 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-8 space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold tracking-wider">
                    <Zap className="w-3.5 h-3.5 fill-emerald-600" />
                    <span>TIENDA OFICIAL</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                    {storeName}
                  </h1>
                </div>

                <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed font-normal">
                  {settings?.meta_description || 'Encuentra tecnología, accesorios de alta fidelidad y las mejores ofertas con garantía oficial y despachos a todo el Perú.'}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href="/catalogo"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 rounded-full text-xs shadow-md shadow-emerald-600/20 transition-all touch-press"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Explorar Catálogo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {settings?.whatsapp_number && (
                    <a
                      href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(settings.whatsapp_message || 'Hola, deseo asesoría')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-6 py-3.5 rounded-full text-xs transition-colors"
                    >
                      <span>Asesoría por WhatsApp</span>
                    </a>
                  )}
                </div>

                {/* Trust Features */}
                <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-100 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Garantía Oficial Directa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Envío Gratis desde {currencySymbol} {freeThreshold}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex justify-center">
                <div className="w-full max-w-sm aspect-square rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 border border-emerald-200/80 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                    <Zap className="w-8 h-8 fill-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Bienvenido a {storeName}</h3>
                    <p className="text-xs text-slate-500 mt-1">Explora productos disponibles y promociones en tiempo real.</p>
                  </div>
                  <Link
                    href="/catalogo"
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                  >
                    Ver Catálogo Completo →
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. Dynamic Real Banners from Database
  const slide = activeBanners[currentSlide] || activeBanners[0];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-100/80 to-slate-50 py-6 sm:py-10 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-white border border-slate-200 shadow-lg p-6 sm:p-10 lg:p-14 overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                {slide.subtitle && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold tracking-wider">
                    <Zap className="w-3.5 h-3.5 fill-emerald-600" />
                    <span>{slide.subtitle}</span>
                  </div>
                )}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  {slide.title}
                </h1>
              </div>

              {slide.description && (
                <p className="text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed font-normal">
                  {slide.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={slide.link_url || '/catalogo'}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 rounded-full text-xs shadow-md shadow-emerald-600/20 transition-all touch-press"
                >
                  <span>Ver Promoción</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-6 py-3.5 rounded-full text-xs transition-colors"
                >
                  <span>Ver Catálogo Completo</span>
                </Link>
              </div>

              {/* Trust Features */}
              <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-100 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Garantía Oficial Directa</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Despacho express Lima & Provincias</span>
                </div>
              </div>
            </div>

            {/* Right Image Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              {slide.banner_image ? (
                <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-md group">
                  <img
                    src={slide.banner_image}
                    alt={slide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {slide.discount_value && (
                    <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        {slide.discount_type === 'percentage'
                          ? `Descuento de ${slide.discount_value}%`
                          : `Ahorro de ${currencySymbol} ${slide.discount_value}`}
                      </span>
                      <span className="text-emerald-700 font-semibold text-[11px]">En Oferta</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-md aspect-square rounded-2xl bg-gradient-to-br from-emerald-50 to-slate-100 border border-slate-200 flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <Zap className="w-12 h-12 text-emerald-600" />
                  <p className="font-bold text-slate-800 text-base">{slide.title}</p>
                  {slide.discount_value && (
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold">
                      {slide.discount_value}% OFF
                    </span>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Navigation Dots & Arrows */}
          {totalSlides > 1 && (
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentSlide === idx ? 'w-8 bg-emerald-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  aria-label="Slide anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  aria-label="Siguiente slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
