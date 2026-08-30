'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Truck, 
  Zap, 
  ShoppingBag,
  Sparkles,
  Star,
  Check
} from 'lucide-react';
import { HeroBannerItem, PublicSiteSettings } from '@/lib/settings';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';

interface HeroBannerProps {
  banners?: HeroBannerItem[];
  settings?: PublicSiteSettings;
  featuredProducts?: Product[];
}

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f1f5f9'/%3E%3Cpath d='M160 180 L240 180 L240 240 L160 240 Z' fill='%23cbd5e1'/%3E%3Ctext x='50%25' y='52%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='14'%3ESin Imagen%3C/text%3E%3C/svg%3E";

/**
 * Dynamic Interactive Featured Products Carousel inside the Hero Section
 */
function HeroFeaturedShowcase({ 
  products = [], 
  storeName,
  currencySymbol 
}: { 
  products: Product[]; 
  storeName: string;
  currencySymbol: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { addItem } = useCartStore();

  const total = products.length;

  const nextProduct = useCallback(() => {
    if (total > 1) {
      setCurrentIndex((prev) => (prev + 1) % total);
    }
  }, [total]);

  const prevProduct = useCallback(() => {
    if (total > 1) {
      setCurrentIndex((prev) => (prev - 1 + total) % total);
    }
  }, [total]);

  // Auto-play interval
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      nextProduct();
    }, 4500);
    return () => clearInterval(timer);
  }, [total, isPaused, nextProduct]);

  // Fallback if no products exist
  if (total === 0) {
    return (
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
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
        >
          <span>Ver Catálogo Completo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const currentProduct = products[currentIndex];
  const imageSrc = currentProduct.images && currentProduct.images.length > 0
    ? currentProduct.images[0]
    : PLACEHOLDER_IMG;
  const hasDiscount = currentProduct.regularPrice > currentProduct.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(currentProduct, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  };

  return (
    <div 
      className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 shadow-md hover:shadow-xl hover:border-emerald-400 transition-all duration-300 overflow-hidden flex flex-col justify-between group/card"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Bar: Badge & Navigation Controls */}
      <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3 h-3 fill-white" />
            <span>Destacado</span>
          </span>
          {currentProduct.discountPercentage > 0 && (
            <span className="inline-flex items-center text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              -{currentProduct.discountPercentage}%
            </span>
          )}
        </div>

        {/* Counter and Mini Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-400">
            {currentIndex + 1} / {total}
          </span>
          {total > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={prevProduct}
                className="p-1 rounded-lg bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 shadow-xs transition-colors cursor-pointer"
                aria-label="Producto anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={nextProduct}
                className="p-1 rounded-lg bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 shadow-xs transition-colors cursor-pointer"
                aria-label="Siguiente producto"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Image Container */}
      <Link 
        href={`/producto/${currentProduct.slug}`}
        className="relative block aspect-square sm:aspect-[4/3] p-5 bg-gradient-to-b from-white to-slate-50/60 overflow-hidden cursor-pointer"
      >
        <img
          key={currentProduct.id}
          src={imageSrc}
          alt={currentProduct.name}
          className="w-full h-full object-contain object-center group-hover/card:scale-108 transition-all duration-500 animate-fadeIn"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
          }}
        />
      </Link>

      {/* Product Information */}
      <div className="p-4 pt-2 flex flex-col gap-2.5 bg-white">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            {currentProduct.brand ? (
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {currentProduct.brand}
              </span>
            ) : <span />}

            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-slate-800">{currentProduct.rating}</span>
            </div>
          </div>

          <Link href={`/producto/${currentProduct.slug}`} className="block">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover/card:text-emerald-600 transition-colors line-clamp-2 leading-snug">
              {currentProduct.name}
            </h3>
          </Link>
        </div>

        {/* Price & Action Button */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            {hasDiscount && (
              <span className="text-[10px] text-slate-400 line-through block leading-none">
                {currentProduct.symbol || currencySymbol} {currentProduct.regularPrice.toFixed(2)}
              </span>
            )}
            <span className="text-base font-black text-slate-950">
              {currentProduct.symbol || currencySymbol} {currentProduct.price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all touch-press cursor-pointer ${
              isAdded
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 shadow-xs'
            }`}
            title="Añadir al carrito"
            aria-label="Añadir al carrito"
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Agregado</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Comprar</span>
              </>
            )}
          </button>
        </div>

        {/* Interactive Dots */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {products.slice(0, 6).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'w-5 bg-emerald-600'
                    : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Ver producto ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function HeroBanner({ 
  banners = [], 
  settings,
  featuredProducts = [] 
}: HeroBannerProps) {
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
              
              {/* Left Column: Store Branding and Value Proposition */}
              <div className="lg:col-span-7 space-y-6">
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

              {/* Right Column: Dynamic Featured Products Showcase */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <HeroFeaturedShowcase 
                  products={featuredProducts} 
                  storeName={storeName}
                  currencySymbol={currencySymbol}
                />
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
                  <span>Despacho express Lima y Provincias</span>
                </div>
              </div>
            </div>

            {/* Right Image / Featured Showcase */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
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
                <HeroFeaturedShowcase 
                  products={featuredProducts} 
                  storeName={storeName}
                  currencySymbol={currencySymbol}
                />
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
