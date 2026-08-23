'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Check, Star } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const imageSrc = product.images && product.images.length > 0 ? product.images[0] : '/placeholder.png';

  return (
    <div className="group relative bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col justify-between">
      
      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <span className="text-[10px] font-bold text-slate-700 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-200 shadow-xs">
          {product.brand}
        </span>

        {product.discountPercentage > 0 && (
          <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            -{product.discountPercentage}%
          </span>
        )}
      </div>

      {/* Product Image Link */}
      <Link href={`/producto/${product.slug}`} className="block relative aspect-square p-6 bg-slate-50/70 overflow-hidden group-hover:bg-slate-50 transition-colors">
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain object-center group-hover:scale-108 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80';
          }}
        />
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <span className="text-xs font-bold text-slate-800">{product.rating}</span>
            <span className="text-[10px] text-slate-400">({product.reviewCount})</span>
          </div>

          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block mb-1">
            {product.categoryName}
          </span>
          <Link href={`/producto/${product.slug}`} className="block">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price & Action Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            {product.regularPrice > product.price && (
              <span className="text-[11px] text-slate-400 line-through block">
                {product.symbol} {product.regularPrice.toFixed(2)}
              </span>
            )}
            <span className="text-base sm:text-lg font-black text-slate-950">
              {product.symbol} {product.price.toFixed(2)}
            </span>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={handleAddToCart}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center transition-all touch-press ${
              isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 shadow-xs'
            }`}
            title="Añadir al carrito"
            aria-label="Añadir al carrito"
          >
            {isAdded ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
