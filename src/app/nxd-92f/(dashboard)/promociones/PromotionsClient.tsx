'use client';

import React, { useState } from 'react';
import { Tag, Plus, Trash2, CheckCircle2, Calendar, AlertCircle } from 'lucide-react';
import { createPromotion, deletePromotion } from '@/lib/admin/promotions';
import { useRouter } from 'next/navigation';

interface PromotionItem {
  id: string;
  title: string;
  subtitle?: string | null;
  type: string;
  discount_value?: number | null;
  discount_type?: string | null;
  coupon_code?: string | null;
  banner_image?: string | null;
  starts_at: string;
  ends_at?: string | null;
  is_active: boolean;
}

interface PromotionsClientProps {
  initialPromotions: PromotionItem[];
}

export function PromotionsClient({ initialPromotions }: PromotionsClientProps) {
  const router = useRouter();
  const [promotions, setPromotions] = useState(initialPromotions);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState<'hero_banner' | 'category_discount' | 'flash_sale' | 'coupon'>('hero_banner');
  const [discountValue, setDiscountValue] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [bannerImage, setBannerImage] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      type,
      discount_value: discountValue ? parseFloat(discountValue) : null,
      coupon_code: couponCode.trim() ? couponCode.trim().toUpperCase() : null,
      banner_image: bannerImage.trim() || null,
      is_active: true,
    };

    try {
      await createPromotion(payload);
      setIsCreating(false);
      setTitle('');
      setSubtitle('');
      setDiscountValue('');
      setCouponCode('');
      setBannerImage('');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al crear la promoción.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar la campaña "${name}"?`)) return;
    try {
      await deletePromotion(id);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch (err: any) {
      alert('Error al eliminar: ' + err?.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Promociones y Cupones
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gestiona banners destacados en portada, descuentos y códigos promocionales
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Cerrar Formulario' : 'Nueva Promoción'}</span>
        </button>
      </div>

      {/* Create Promotion Form Drawer / Card */}
      {isCreating && (
        <form onSubmit={handleCreate} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm animate-in fade-in">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Crear Campaña o Cupón</span>
          </h2>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Título de la Campaña *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej. Ofertas Relámpago de Fin de Mes"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Tipo de Promoción</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="hero_banner">Banner Principal (Hero)</option>
                <option value="coupon">Cupón de Descuento</option>
                <option value="flash_sale">Oferta Flash</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Código de Cupón (opcional)</label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="ej. NEXORA10"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Valor de Descuento (S/ o %)</label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="ej. 15"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">URL de Imagen del Banner (opcional)</label>
            <input
              type="url"
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs"
            >
              {loading ? 'Creando...' : 'Crear Promoción'}
            </button>
          </div>
        </form>
      )}

      {/* Promotions List */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {promotions.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Tag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">No hay promociones activas</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Crea cupones de descuento o banners especiales para incentivar las ventas en la tienda.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {promotions.map((p) => (
              <div key={p.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{p.title}</span>
                    {p.coupon_code && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-xs font-bold">
                        {p.coupon_code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Tipo: <span className="font-semibold text-slate-700">{p.type}</span>
                    {p.discount_value && (
                      <> • Descuento: <span className="font-bold text-emerald-700">{p.discount_value}%</span></>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(p.id, p.title)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Eliminar promoción"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
