'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Package, 
  Smartphone, 
  Zap, 
  Headphones, 
  Watch, 
  Cable, 
  ShieldCheck,
  Layers,
  Folder
} from 'lucide-react';
import { Category } from '@/types';

const iconMap: Record<string, React.ReactNode> = {
  'packs': <Package className="w-4 h-4 text-emerald-600" />,
  'apple': <Layers className="w-4 h-4 text-slate-700" />,
  'cargadores': <Zap className="w-4 h-4 text-amber-500" />,
  'cases': <Smartphone className="w-4 h-4 text-indigo-600" />,
  'cases-16': <Smartphone className="w-4 h-4 text-blue-600" />,
  'cases-15': <Smartphone className="w-4 h-4 text-purple-600" />,
  'audifonos': <Headphones className="w-4 h-4 text-rose-500" />,
  'smartwatch': <Watch className="w-4 h-4 text-teal-600" />,
  'cables': <Cable className="w-4 h-4 text-cyan-600" />,
  'micas': <ShieldCheck className="w-4 h-4 text-emerald-600" />,
};

interface CategoryPillsProps {
  categories?: Category[];
}

export function CategoryPills({ categories = [] }: CategoryPillsProps) {
  if (!categories || categories.length === 0) {
    return null; // Do not display if 0 categories in database
  }

  return (
    <section className="bg-white border-b border-slate-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Categorías Principales
          </h2>
          <Link
            href="/catalogo"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Ver todo el catálogo →
          </Link>
        </div>

        {/* Scrollable Pills Row */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalogo?category=${category.id}`}
              className="flex items-center gap-2.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xs px-4 py-2.5 rounded-full shrink-0 transition-all touch-press"
            >
              {iconMap[category.id] || <Folder className="w-4 h-4 text-slate-400" />}
              <span className="text-xs font-semibold text-slate-800">
                {category.name}
              </span>
              {category.productCount !== undefined && category.productCount > 0 && (
                <span className="text-[10px] text-slate-500 font-medium">
                  ({category.productCount})
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
