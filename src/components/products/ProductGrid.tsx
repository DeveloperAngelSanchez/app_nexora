'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { ArrowRight, Zap, Package } from 'lucide-react';

interface ProductGridProps {
  initialProducts: Product[];
}

export function ProductGrid({ initialProducts }: ProductGridProps) {
  const [selectedTab, setSelectedTab] = useState<string>('all');

  if (!initialProducts || initialProducts.length === 0) {
    return (
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Catálogo en Preparación</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Estamos actualizando el inventario con nuevos artículos y promociones especiales. Consulta disponibilidad por WhatsApp o visita nuevamente en breve.
            </p>
          </div>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-full text-xs transition-all shadow-sm cursor-pointer"
          >
            <span>Ver Catálogo General</span>
          </Link>
        </div>
      </section>
    );
  }

  const categoriesInProducts = Array.from(
    new Set(initialProducts.map((p) => p.categoryName || p.categoryId).filter(Boolean))
  );

  const filtered = initialProducts.filter((p) => {
    if (selectedTab === 'all') return true;
    return p.categoryName === selectedTab || p.categoryId === selectedTab;
  });

  const displayProducts = filtered.slice(0, 12);

  return (
    <section className="py-12 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4 fill-emerald-600" />
              <span>Catálogo Destacado</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Productos Destacados
            </h2>
          </div>

          {/* Dynamic Tabs based on real categories */}
          {categoriesInProducts.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <button
                onClick={() => setSelectedTab('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all touch-press cursor-pointer ${
                  selectedTab === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
                }`}
              >
                Todos
              </button>
              {categoriesInProducts.map((catName) => (
                <button
                  key={catName}
                  onClick={() => setSelectedTab(catName)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all touch-press cursor-pointer ${
                    selectedTab === catName
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {catName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold px-8 py-3.5 rounded-full text-xs transition-all touch-press shadow-xs hover:border-emerald-500 cursor-pointer"
          >
            <span>Ver los {initialProducts.length} productos en el Catálogo Completo</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
          </Link>
        </div>
      </div>
    </section>
  );
}
