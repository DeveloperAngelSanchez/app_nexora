import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Layers, Package, Sparkles } from 'lucide-react';
import { 
  getCategories, 
  getCategoryBySlug, 
  getAllProducts 
} from '@/lib/catalog';
import { ProductCard } from '@/components/products/ProductCard';
import { 
  JsonLd, 
  buildBreadcrumbSchema, 
  buildCollectionSchema 
} from '@/components/seo/JsonLd';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60; // ISR 60 seconds

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((cat) => ({
    slug: cat.slug || cat.id,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => (c.slug && c.slug === slug) || c.id === slug) || await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Categoría no encontrada | NeXora Store Perú',
    };
  }

  const title = `${category.name} en Perú | Ofertas, Garantía y Envío Rápido | NeXora Store`;
  const description = `Compra ${category.name} al mejor precio en Perú. Envíos express a Lima y todo el país, productos con garantía directa y atención personalizada por WhatsApp.`;
  const canonicalUrl = `https://www.nexoratechpe.store/categoria/${category.slug || category.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${category.name} | Catálogo Oficial NeXora Store Perú`,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'NeXora Store Perú',
      images: [
        {
          url: 'https://www.nexoratechpe.store/icons/icon-512x512.png',
          width: 512,
          height: 512,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [allCategories, allProducts] = await Promise.all([
    getCategories(),
    getAllProducts(),
  ]);

  const category = allCategories.find((c) => (c.slug && c.slug === slug) || c.id === slug) || await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  // Filter products by this category
  const categoryProducts = allProducts.filter(
    (p) => p.categoryId === category.id || (category.name && p.categoryName?.toLowerCase() === category.name.toLowerCase())
  );

  const breadcrumbs = [
    { name: 'Inicio', url: '/' },
    { name: 'Catálogo', url: '/catalogo' },
    { name: category.name, url: `/categoria/${category.slug || category.id}` },
  ];

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);
  const collectionSchema = buildCollectionSchema(category.name, categoryProducts);

  const otherCategories = allCategories.filter((c) => c.id !== category.id).slice(0, 8);

  return (
    <div className="bg-[#f8fafc] min-h-screen py-8 text-slate-900">
      {/* Google Rich Snippets Schemas */}
      <JsonLd data={[breadcrumbSchema, collectionSchema]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav 
          aria-label="Migas de pan"
          className="flex items-center gap-2 text-xs text-slate-500 mb-6 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar font-medium"
        >
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link href="/catalogo" className="hover:text-slate-900 transition-colors">
            Catálogo
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-bold">
            {category.name}
          </span>
        </nav>

        {/* Category Header Banner */}
        <header className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider border border-emerald-200/80">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Colección Oficial en Perú</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                {category.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Encuentra las mejores ofertas y novedades en {category.name.toLowerCase()} con stock disponible en Perú, garantía de fábrica y despachos express en Lima y provincias.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 px-5 py-3.5 rounded-2xl border border-slate-200 shrink-0 self-start md:self-auto">
              <Package className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">{categoryProducts.length} Productos</p>
                <p className="text-[10px] text-slate-500 font-medium">Disponibles para entrega</p>
              </div>
            </div>
          </div>
        </header>

        {/* Product Grid or Empty State */}
        {categoryProducts.length > 0 ? (
          <section aria-label={`Lista de productos de ${category.name}`}>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Próximamente nuevos ingresos en {category.name}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              Estamos actualizando el inventario de esta categoría. Puedes consultar stock por WhatsApp o explorar nuestro catálogo completo.
            </p>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              Ver Catálogo Completo
            </Link>
          </div>
        )}

        {/* Other Categories Links for Internal SEO Link Building */}
        {otherCategories.length > 0 && (
          <section className="mt-16 pt-12 border-t border-slate-200">
            <h2 className="text-lg font-black text-slate-900 mb-4">
              Explora otras categorías de tecnología
            </h2>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {otherCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug || cat.id}`}
                  className="bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 px-4 py-2 rounded-full text-xs font-semibold text-slate-700 transition-all shrink-0 shadow-xs"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
