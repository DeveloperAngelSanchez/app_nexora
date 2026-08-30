import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { getAllProducts, getCategories, getBrands } from '@/lib/catalog';
import { CatalogClient } from './CatalogClient';

export const metadata: Metadata = {
  title: 'Catálogo de Productos | Tienda Oficial Perú',
  description: 'Explora nuestro catálogo completo de productos con envíos express y garantía oficial directa a todo el Perú.',
};

export const revalidate = 60; // ISR 60 seconds

export default async function CatalogPage() {
  const [products, categories, brands] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getBrands(),
  ]);

  return (
    <div className="bg-[#f8fafc] min-h-screen py-8 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="p-12 text-center text-slate-400">Cargando catálogo...</div>}>
          <CatalogClient 
            initialProducts={products} 
            categories={categories} 
            brands={brands} 
          />
        </Suspense>
      </div>
    </div>
  );
}
