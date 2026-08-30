'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product, Category } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';
import { 
  Search, 
  X, 
  SlidersHorizontal 
} from 'lucide-react';

interface CatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
  brands: string[];
}

export function CatalogClient({ initialProducts, categories, brands }: CatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCat = searchParams.get('category') || 'all';
  const initialBrand = searchParams.get('brand') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating'>('popular');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('category')) setSelectedCategory(searchParams.get('category') || 'all');
    if (searchParams.get('brand')) setSelectedBrand(searchParams.get('brand') || 'all');
    if (searchParams.get('search')) setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    if (selectedCategory && selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase();
      result = result.filter(p => 
        (p.categoryId && p.categoryId.toLowerCase() === catLower) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(catLower))
      );
    }

    if (selectedBrand && selectedBrand !== 'all') {
      const brandLower = selectedBrand.toLowerCase();
      result = result.filter(p => 
        p.brand && p.brand.toLowerCase() === brandLower
      );
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      result.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return result;
  }, [initialProducts, selectedCategory, selectedBrand, searchQuery, sortBy]);

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSearchQuery('');
    setSortBy('popular');
    router.push('/catalogo');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedBrand !== 'all' || searchQuery !== '';

  return (
    <div className="space-y-6">
      
      {/* Header and Live Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Catálogo de Productos
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Explora {initialProducts.length} accesorios de alta tecnología, cargadores GaN y bundles con despacho express.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar catálogo..."
              className="w-full bg-white border border-slate-200 rounded-full pl-9 pr-8 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-slate-200 text-slate-700 rounded-full px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 shadow-2xs"
          >
            <option value="popular">Más Populares</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
            <option value="rating">Mejor Calificados</option>
          </select>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="md:hidden p-2.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
            aria-label="Filtrar"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block md:col-span-3 space-y-6">
          
          {hasActiveFilters && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Filtros Activos</span>
                <button
                  onClick={clearFilters}
                  className="text-emerald-600 hover:text-emerald-700 text-[11px] font-semibold underline"
                >
                  Restablecer
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                    {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                    <button onClick={() => setSelectedCategory('all')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedBrand !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                    {selectedBrand}
                    <button onClick={() => setSelectedBrand('all')}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-2xs">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Categorías
            </h3>
            <div className="space-y-0.5 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <span>Todas las categorías</span>
                <span className="text-[11px] opacity-75">{initialProducts.length}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[11px] opacity-75">{cat.productCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-2xs">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Marcas
            </h3>
            <div className="space-y-0.5 text-xs">
              <button
                onClick={() => setSelectedBrand('all')}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                  selectedBrand === 'all'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <span>Todas las marcas</span>
              </button>
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                    selectedBrand === b
                      ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span>{b}</span>
                </button>
              ))}
            </div>
          </div>

        </aside>

        {/* Products Grid */}
        <main className="md:col-span-9 space-y-6">
          
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Mostrando <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> productos
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-emerald-600 hover:underline md:hidden font-semibold"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900">No se encontraron productos</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Prueba cambiando los términos de búsqueda o restableciendo los filtros de marca y categoría.
                </p>
              </div>
              <button
                onClick={clearFilters}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-full transition-colors shadow-xs"
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Mobile Filters Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs md:hidden flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right pb-[env(safe-area-inset-bottom,20px)] shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-base">Filtros</h2>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700"
                aria-label="Cerrar filtros"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase">Categorías</h3>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => { setSelectedCategory('all'); setIsMobileFiltersOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-xl font-medium ${selectedCategory === 'all' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  Todas ({initialProducts.length})
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCategory(c.id); setIsMobileFiltersOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-xl font-medium ${selectedCategory === c.id ? 'bg-emerald-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {c.name} ({c.productCount})
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase">Marcas</h3>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => { setSelectedBrand('all'); setIsMobileFiltersOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-xl font-medium ${selectedBrand === 'all' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  Todas
                </button>
                {brands.map(b => (
                  <button
                    key={b}
                    onClick={() => { setSelectedBrand(b); setIsMobileFiltersOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-xl font-medium ${selectedBrand === b ? 'bg-emerald-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-full text-xs shadow-xs"
            >
              Aplicar ({filteredProducts.length} productos)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
