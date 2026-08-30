'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, Check, Star, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';

interface FeaturedCarouselProps {
  products: Product[];
}

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='52%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='14'%3ESin Imagen%3C/text%3E%3C/svg%3E";

function FeaturedCard({ product }: { product: Product }) {
  const { addItem } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const imageSrc = product.images?.length > 0 ? product.images[0] : PLACEHOLDER_IMG;
  const hasDiscount = product.regularPrice > product.price;

  return (
    <div className="group relative bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-600/5 flex-shrink-0 snap-start w-[260px] sm:w-[280px] md:w-[300px] flex flex-col">
      {/* Badges */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5">
          {product.isFeatured && (
            <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 fill-amber-500" />
              Destacado
            </span>
          )}
          {product.isBestSeller && (
            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Top Ventas
            </span>
          )}
        </div>
        {product.discountPercentage > 0 && (
          <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            -{product.discountPercentage}%
          </span>
        )}
      </div>

      {/* Image */}
      <Link
        href={`/producto/${product.slug}`}
        className="block relative aspect-square p-5 bg-gradient-to-b from-slate-50/80 to-white overflow-hidden"
      >
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain object-center group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
          }}
        />
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-bold text-slate-800">{product.rating}</span>
            <span className="text-[10px] text-slate-400">({product.reviewCount})</span>
          </div>

          {product.brand && (
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-0.5">
              {product.brand}
            </span>
          )}

          <Link href={`/producto/${product.slug}`} className="block">
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price & Add */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            {hasDiscount && (
              <span className="text-[10px] text-slate-400 line-through block leading-none">
                {product.symbol} {product.regularPrice.toFixed(2)}
              </span>
            )}
            <span className="text-base font-black text-slate-950">
              {product.symbol} {product.price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center transition-all touch-press cursor-pointer ${
              isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 shadow-xs'
            }`}
            title="Añadir al carrito"
            aria-label="Añadir al carrito"
          >
            {isAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeaturedCarousel({ products }: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);

    // Calculate active dot index
    const cardWidth = el.querySelector<HTMLElement>(':scope > div')?.offsetWidth || 280;
    const gap = 16;
    const idx = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(idx, products.length - 1));
  }, [products.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScrollability();
    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);
    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [checkScrollability]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(':scope > div')?.offsetWidth || 280;
    const gap = 16;
    const amount = (cardWidth + gap) * 2;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (products.length === 0) return null;

  const dotCount = Math.min(products.length, 8);

  return (
    <section className="relative py-8 sm:py-12 bg-gradient-to-b from-[#f8fafc] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 fill-amber-500" />
              <span>Selección Destacada</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Productos Destacados
            </h2>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Los favoritos de nuestros clientes, seleccionados para ti.
            </p>
          </div>

          {/* Desktop Arrows */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                canScrollLeft
                  ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs'
                  : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                canScrollRight
                  ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs'
                  : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Track */}
        <div className="relative">
          {/* Left Fade */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#f8fafc] to-transparent z-10 pointer-events-none hidden sm:block" />
          )}

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-2"
            style={{ scrollPaddingLeft: '0px' }}
          >
            {products.map((product) => (
              <FeaturedCard key={product.id} product={product} />
            ))}
          </div>

          {/* Right Fade */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#f8fafc] to-transparent z-10 pointer-events-none hidden sm:block" />
          )}
        </div>

        {/* Dots - Mobile & Desktop */}
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {Array.from({ length: dotCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                const cardWidth = el.querySelector<HTMLElement>(':scope > div')?.offsetWidth || 280;
                const gap = 16;
                el.scrollTo({
                  left: i * (cardWidth + gap),
                  behavior: 'smooth',
                });
              }}
              className={`rounded-full transition-all cursor-pointer ${
                activeIndex === i
                  ? 'w-6 h-2 bg-emerald-500'
                  : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Producto ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
