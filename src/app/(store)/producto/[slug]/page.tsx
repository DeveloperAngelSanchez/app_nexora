import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  getAllProducts, 
  getProductBySlug, 
  getRelatedProducts,
  getCategories
} from '@/lib/catalog';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductDetailClient } from '@/components/products/ProductDetailClient';
import { ChevronRight } from 'lucide-react';
import { JsonLd, buildProductSchema, buildBreadcrumbSchema } from '@/components/seo/JsonLd';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60; // Revalidate every 60 seconds

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Producto no encontrado | NeXora Store Perú',
    };
  }

  const baseUrl = 'https://www.nexoratechpe.store';
  const canonicalUrl = `${baseUrl}/producto/${product.slug}`;
  const title = `${product.name} | Comprar al Mejor Precio en Perú | NeXora Store`;
  const description = product.description 
    ? `${product.description.slice(0, 150)}... Garantía oficial y envíos express a Lima y provincias.`
    : `Compra ${product.name} al mejor precio en NeXora Store Perú. Stock disponible, garantía y atención por WhatsApp.`;

  const ogImages = product.images && product.images.length > 0 
    ? product.images.map((img) => ({ url: img, alt: product.name }))
    : [{ url: `${baseUrl}/icons/icon-512x512.png`, alt: product.name }];

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.name} - S/ ${product.price.toFixed(2)} | NeXora Store Perú`,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'NeXora Store Perú',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} - S/ ${product.price.toFixed(2)} | NeXora Store`,
      description,
      images: product.images && product.images.length > 0 ? [product.images[0]] : [`${baseUrl}/icons/icon-512x512.png`],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, allCategories] = await Promise.all([
    getProductBySlug(slug),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.id, product.categoryId, 4);
  const category = allCategories.find((c) => c.id === product.categoryId || c.name.toLowerCase() === product.categoryName?.toLowerCase());
  const categoryPath = category ? `/categoria/${category.slug || category.id}` : `/catalogo?category=${product.categoryId}`;

  const breadcrumbs = [
    { name: 'Inicio', url: '/' },
    { name: 'Catálogo', url: '/catalogo' },
    { name: product.categoryName || 'Categoría', url: categoryPath },
    { name: product.name, url: `/producto/${product.slug}` },
  ];

  const productSchema = buildProductSchema(product);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  return (
    <div className="bg-slate-50 min-h-screen py-8 text-slate-900">
      {/* Schema.org Structured Data for Google SERP Rich Snippets */}
      <JsonLd data={[productSchema, breadcrumbSchema]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav 
          aria-label="Migas de pan"
          className="flex items-center gap-2 text-xs text-slate-500 mb-8 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar font-medium"
        >
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link href="/catalogo" className="hover:text-slate-900 transition-colors">
            Catálogo
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link 
            href={categoryPath} 
            className="hover:text-slate-900 transition-colors"
          >
            {product.categoryName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-bold truncate max-w-xs sm:max-w-md">
            {product.name}
          </span>
        </nav>

        {/* Client Product View */}
        <ProductDetailClient product={product} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 mb-6">
              Productos Relacionados que te pueden interesar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
