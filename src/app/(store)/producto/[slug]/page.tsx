import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  getAllProducts, 
  getProductBySlug, 
  getRelatedProducts 
} from '@/lib/catalog';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductDetailClient } from '@/components/products/ProductDetailClient';
import { ChevronRight } from 'lucide-react';

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
      title: 'Producto no encontrado | Nexora Tech',
    };
  }

  return {
    title: `${product.name} | Nexora Tech Perú`,
    description: product.description,
    openGraph: {
      title: `${product.name} - S/ ${product.price.toFixed(2)} | Nexora Tech`,
      description: product.description,
      images: product.images,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.id, product.categoryId, 4);

  return (
    <div className="bg-slate-50 min-h-screen py-8 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar font-medium">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/catalogo" className="hover:text-slate-900 transition-colors">
            Catálogo
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link 
            href={`/catalogo?category=${product.categoryId}`} 
            className="hover:text-slate-900 transition-colors"
          >
            {product.categoryName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
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
