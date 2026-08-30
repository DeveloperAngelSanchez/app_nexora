import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { getAllProducts, getCategories, getBrands } from '@/lib/catalog';
import { CatalogClient } from './CatalogClient';
import { JsonLd, buildBreadcrumbSchema, buildCollectionSchema } from '@/components/seo/JsonLd';

const baseUrl = 'https://www.nexoratechpe.store';

export const metadata: Metadata = {
  title: 'Catálogo de Productos de Tecnología en Perú | NeXora Store',
  description: 'Explora nuestro catálogo completo de audífonos bluetooth, cargadores rápidos, smartwatches y accesorios con despachos express a todo el Perú.',
  alternates: {
    canonical: `${baseUrl}/catalogo`,
  },
  openGraph: {
    title: 'Catálogo Completo de Tecnología | NeXora Store Perú',
    description: 'Encuentra las mejores ofertas en gadgets y accesorios móviles con garantía oficial en Perú.',
    url: `${baseUrl}/catalogo`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo de Tecnología en Perú | NeXora Store',
    description: 'Envíos express en Lima y provincias. Compra con garantía oficial y atención por WhatsApp.',
  },
};

export const revalidate = 60; // ISR 60 seconds

export default async function CatalogPage() {
  const [products, categories, brands] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getBrands(),
  ]);

  const breadcrumbs = [
    { name: 'Inicio', url: '/' },
    { name: 'Catálogo', url: '/catalogo' },
  ];

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs, baseUrl);
  const collectionSchema = buildCollectionSchema('Catálogo General', products, baseUrl);

  return (
    <div className="bg-[#f8fafc] min-h-screen py-8 text-slate-900">
      <JsonLd data={[breadcrumbSchema, collectionSchema]} />
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
