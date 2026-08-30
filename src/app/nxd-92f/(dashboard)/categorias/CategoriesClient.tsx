'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Layers, Search } from 'lucide-react';
import { CategoryModal } from '@/components/admin/CategoryModal';
import { deleteCategory } from '@/lib/admin/categories';
import { useRouter } from 'next/navigation';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  sort_order?: number;
  product_count?: number;
  is_active?: boolean;
}

interface CategoriesClientProps {
  initialCategories: CategoryItem[];
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync state if server component re-renders
  React.useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CategoryItem) => {
    setEditingCategory(c);
    setIsModalOpen(true);
  };

  // Instant optimistic update on create and edit
  const handleSaveSuccess = (saved: CategoryItem, isEdit: boolean) => {
    setCategories((prev) => {
      let updatedList: CategoryItem[];
      if (isEdit) {
        updatedList = prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c));
      } else {
        updatedList = [...prev.filter((c) => c.id !== saved.id), saved];
      }
      return updatedList.sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name)
      );
    });
    router.refresh();
  };

  // Instant optimistic removal on delete
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await deleteCategory(id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      } else {
        alert(res.error || 'Error al eliminar la categoría.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar categoría.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Categorías del Catálogo
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Organiza tus productos por departamentos y secciones navegables
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar categoría por nombre..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Layers className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">No hay categorías</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Crea tu primera categoría para organizar los productos en la tienda.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Categoría</span>
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Nombre</th>
                <th className="py-3.5 px-4">Identificador (ID)</th>
                <th className="py-3.5 px-4">Orden</th>
                <th className="py-3.5 px-4">Productos</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900">{c.name}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-slate-500">{c.id}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px]">
                      {c.sort_order ?? 0}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-emerald-700 font-bold">
                      {c.product_count ?? 0} productos
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar categoría"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={deletingId === c.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar categoría"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Category Create/Edit Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingCategory}
        onSuccess={handleSaveSuccess}
      />

    </div>
  );
}
