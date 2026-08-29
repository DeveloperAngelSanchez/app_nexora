'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Package,
  Camera,
  QrCode,
  ScanLine
} from 'lucide-react';
import { toggleProductActive, deleteProduct } from '@/lib/admin/products';
import { BarcodeScannerModal } from '@/components/admin/BarcodeScannerModal';

interface ProductItem {
  id: string;
  slug: string;
  name: string;
  barcode?: string | null;
  brand_name: string;
  category_id: string | null;
  price: number;
  regular_price: number | null;
  stock: number;
  in_stock: boolean;
  is_active: boolean;
  is_featured: boolean;
  images: string[];
  categories?: { name: string } | null;
}

interface CategoryItem {
  id: string;
  name: string;
}

interface ProductsTableClientProps {
  initialProducts: ProductItem[];
  categories: CategoryItem[];
  currentCategory?: string;
  currentStock?: string;
  currentSearch?: string;
}

export function ProductsTableClient({ initialProducts, categories }: ProductsTableClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const filtered = products.filter((p) => {
    if (selectedCategory !== 'all' && p.category_id !== selectedCategory) return false;
    if (stockFilter === 'low' && p.stock > 5) return false;
    if (stockFilter === 'out' && p.stock > 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand_name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleToggleActive = async (id: string, current: boolean) => {
    setLoadingId(id);
    try {
      const res = await toggleProductActive(id, !current);
      if (res.success) {
        setProducts((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_active: !current } : item))
        );
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el producto "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await deleteProduct(id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert('Error al eliminar producto: ' + (res.error || 'Error desconocido'));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o marca..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todo el Stock</option>
            <option value="low">Stock Bajo (≤ 5)</option>
            <option value="out">Sin Stock (0)</option>
          </select>

          {/* Scanner Button */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs shrink-0 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Escanear</span>
          </button>

          <Link
            href="/nxd-92f/productos/nuevo"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs shrink-0 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Producto</span>
          </Link>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">No se encontraron productos</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {products.length === 0
                  ? 'Aún no has creado productos. Haz clic en "Nuevo Producto" o escanea un código para publicar el primero.'
                  : 'No hay productos que coincidan con los filtros seleccionados.'}
              </p>
            </div>
            {products.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Escanear Código de Barras</span>
                </button>
                <Link
                  href="/nxd-92f/productos/nuevo"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Manualmente</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Precio</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Product Name & Image */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">NX</span>
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs space-y-0.5">
                          <p className="font-bold text-slate-900 truncate">{p.name}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-slate-400">{p.brand_name}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[11px] text-slate-400 font-mono">ID: {p.id}</span>
                            {p.barcode && (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                                <ScanLine className="w-2.5 h-2.5" />
                                {p.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
                        {p.categories?.name || p.category_id || 'Sin categoría'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900">
                          S/ {Number(p.price).toFixed(2)}
                        </span>
                        {p.regular_price && p.regular_price > p.price && (
                          <span className="block text-[11px] text-slate-400 line-through">
                            S/ {Number(p.regular_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold ${
                            p.stock === 0
                              ? 'text-rose-600'
                              : p.stock <= 5
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {p.stock}
                        </span>
                        {p.stock <= 5 && (
                          <span className="inline-block" title="Stock bajo">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Active Status Switch */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(p.id, p.is_active)}
                        disabled={loadingId === p.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {p.is_active ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Visible</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            <span>Oculto</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/producto/${p.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Ver en la tienda"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/nxd-92f/productos/${p.id}/editar`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                          title="Editar producto"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deletingId === p.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

    </div>
  );
}
