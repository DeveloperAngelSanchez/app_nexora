'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Layers } from 'lucide-react';
import { createCategory, updateCategory } from '@/lib/admin/categories';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: CategoryItem | null;
  onSuccess: (savedCategory: CategoryItem, isEdit: boolean) => void;
}

export function CategoryModal({ isOpen, onClose, initialData, onSuccess }: CategoryModalProps) {
  const isEditing = Boolean(initialData);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setId(initialData.id || '');
      setName(initialData.name || '');
      setSlug(initialData.slug || '');
      setIcon(initialData.icon || '');
      setSortOrder(String(initialData.sort_order ?? 0));
    } else {
      setId('');
      setName('');
      setSlug('');
      setIcon('');
      setSortOrder('0');
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated);
      setId(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      id: id.trim(),
      name: name.trim(),
      slug: slug.trim() || id.trim(),
      icon: icon.trim() || null,
      sort_order: parseInt(sortOrder, 10) || 0,
      is_active: true,
    };

    try {
      let res;
      if (isEditing && initialData?.id) {
        res = await updateCategory(initialData.id, payload);
      } else {
        res = await createCategory(payload);
      }

      if (res.success && res.data) {
        onSuccess(res.data, isEditing);
        onClose();
      } else {
        setErrorMsg(res.error || 'Error al guardar categoría.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar categoría.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="ej. Cargadores GaN"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Identificador (ID / Slug) *
            </label>
            <input
              type="text"
              required
              disabled={isEditing}
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="cargadores"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Orden de Visualización
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 font-bold"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
