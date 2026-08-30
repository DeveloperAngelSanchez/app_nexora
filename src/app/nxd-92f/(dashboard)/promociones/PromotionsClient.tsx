'use client';

import React, { useState } from 'react';
import { Tag, Plus, Trash2, CheckCircle2, AlertCircle, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { createPromotion, deletePromotion } from '@/lib/admin/promotions';
import { useRouter } from 'next/navigation';

interface PromotionItem {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  type: string;
  discount_value?: number | null;
  discount_type?: string | null;
  coupon_code?: string | null;
  banner_image?: string | null;
  link_url?: string | null;
  sort_order?: number;
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
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'hero_banner' | 'category_discount' | 'flash_sale' | 'coupon'>('hero_banner');
  const [discountValue, setDiscountValue] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      description: description.trim() || null,
      type,
      discount_value: discountValue ? parseFloat(discountValue) : null,
      coupon_code: couponCode.trim() ? couponCode.trim().toUpperCase() : null,
      banner_image: bannerImage.trim() || null,
      link_url: linkUrl.trim() || null,
      sort_order: parseInt(sortOrder) || 0,
      is_active: true,
    };

    try {
      await createPromotion(payload);
      setIsCreating(false);
      setTitle('');
      setSubtitle('');
      setDescription('');
      setDiscountValue('');
      setCouponCode('');
      setBannerImage('');
      setLinkUrl('');
      setSortOrder('0');
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
    <div className="space-y-6 max-w-5xl pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Promociones y Banners de Portada
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gestiona banners principales (Hero), cupones de descuento y campañas especiales
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Cerrar Formulario' : 'Nueva Promoción / Banner'}</span>
        </button>
      </div>

      {/* Create Promotion Form Drawer / Card */}
      {isCreating && (
        <form onSubmit={handleCreate} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm animate-in fade-in">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Crear Promoción o Banner de Portada</span>
          </h2>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Tipo de Promoción *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="hero_banner">Banner Principal de Portada (Hero)</option>
                <option value="coupon">Cupón de Descuento</option>
                <option value="flash_sale">Oferta Flash / Descuento</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Título Principal *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej. Grandes Ofertas de Inauguración"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Insignia / Subtítulo (Opcional)</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="ej. NUEVA COLECCIÓN o EXCLUSIVO"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Orden de Aparición (0, 1, 2...)</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Descripción o Detalle (Opcional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve texto descriptivo que aparecerá en el banner..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 resize-none font-normal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">URL de Imagen del Banner (Opcional)</label>
              <input
                type="url"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Enlace de Destino (Opcional)</label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/catalogo o enlace completo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Código de Cupón (opcional)</label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="ej. BIENVENIDO10"
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

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
              <h3 className="text-base font-bold text-slate-800">No hay banners ni promociones activas</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Crea banners de portada para la página principal o cupones de descuento desde el botón "Nueva Promoción / Banner".
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {promotions.map((p) => (
              <div key={p.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  {p.banner_image ? (
                    <img
                      src={p.banner_image}
                      alt={p.title}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm truncate">{p.title}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                        {p.type === 'hero_banner' ? 'Banner Portada' : p.type}
                      </span>
                      {p.coupon_code && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-xs font-bold">
                          {p.coupon_code}
                        </span>
                      )}
                    </div>
                    {p.subtitle && (
                      <p className="text-xs text-emerald-700 font-semibold">{p.subtitle}</p>
                    )}
                    {p.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(p.id, p.title)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Eliminar promoción"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
