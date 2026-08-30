'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, Phone, Truck, Megaphone, Globe, Share2 } from 'lucide-react';
import { updateSiteSettings } from '@/lib/admin/settings';
import { useRouter } from 'next/navigation';

interface SettingsClientProps {
  initialSettings: any;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter();
  const [storeName, setStoreName] = useState(initialSettings?.store_name || 'Nexora Store');
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings?.whatsapp_number || '51999999999');
  const [whatsappMessage, setWhatsappMessage] = useState(
    initialSettings?.whatsapp_message || 'Hola, deseo asesoría sobre un producto'
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    initialSettings?.free_shipping_threshold !== undefined ? String(initialSettings.free_shipping_threshold) : '150'
  );
  const [defaultShippingCost, setDefaultShippingCost] = useState(
    initialSettings?.default_shipping_cost !== undefined ? String(initialSettings.default_shipping_cost) : '10'
  );
  const [announcementBar, setAnnouncementBar] = useState(initialSettings?.announcement_bar || '');
  const [metaTitle, setMetaTitle] = useState(initialSettings?.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(initialSettings?.meta_description || '');
  const [socialInstagram, setSocialInstagram] = useState(initialSettings?.social_instagram || '');
  const [socialFacebook, setSocialFacebook] = useState(initialSettings?.social_facebook || '');
  const [socialTiktok, setSocialTiktok] = useState(initialSettings?.social_tiktok || '');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(false);
    setErrorMsg(null);

    const payload = {
      store_name: storeName.trim(),
      whatsapp_number: whatsappNumber.trim(),
      whatsapp_message: whatsappMessage.trim(),
      free_shipping_threshold: parseFloat(freeShippingThreshold) || 150,
      default_shipping_cost: parseFloat(defaultShippingCost) || 10,
      announcement_bar: announcementBar.trim() || null,
      meta_title: metaTitle.trim() || null,
      meta_description: metaDescription.trim() || null,
      social_instagram: socialInstagram.trim() || null,
      social_facebook: socialFacebook.trim() || null,
      social_tiktok: socialTiktok.trim() || null,
    };

    try {
      const res = await updateSiteSettings(payload);
      if (res.success) {
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Error al guardar la configuración.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Configuración General
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Ajusta los canales de venta, textos de cabecera, pie de página y políticas de envío de la tienda
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>¡Configuración guardada y actualizada en toda la tienda con éxito!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* WhatsApp & Identity Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-600" />
          <span>Identidad y WhatsApp Checkout</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Número de WhatsApp (con código de país) *
            </label>
            <input
              type="text"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="51999999999"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400">
              A este número se enviarán los pedidos y consultas desde la web.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Nombre Oficial de la Tienda
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Mensaje Preconfigurado de WhatsApp
          </label>
          <input
            type="text"
            value={whatsappMessage}
            onChange={(e) => setWhatsappMessage(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-normal"
          />
        </div>
      </div>

      {/* Announcement Bar Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-emerald-600" />
          <span>Barra de Anuncios Superior</span>
        </h2>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Texto del Anuncio Superior (Opcional)
          </label>
          <input
            type="text"
            value={announcementBar}
            onChange={(e) => setAnnouncementBar(e.target.value)}
            placeholder="ej. ⚡ Despachos gratis por compras mayores a S/ 150 a todo el Perú"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
          />
          <p className="text-[11px] text-slate-400">
            Si lo dejas en blanco, mostrará automáticamente el aviso de envío gratis según el umbral configurado.
          </p>
        </div>
      </div>

      {/* Shipping & Thresholds Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600" />
          <span>Políticas de Envío</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Umbral para Envío Gratis (S/)
            </label>
            <input
              type="number"
              step="1"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(e.target.value)}
              placeholder="150"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400">
              Los pedidos que superen este monto tendrán costo de envío gratuito en el carrito.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Costo de Envío Estándar (S/)
            </label>
            <input
              type="number"
              step="1"
              value={defaultShippingCost}
              onChange={(e) => setDefaultShippingCost(e.target.value)}
              placeholder="10"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400">
              Costo por defecto aplicado si el pedido no califica para envío gratis.
            </p>
          </div>
        </div>
      </div>

      {/* SEO & Description Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-600" />
          <span>Descripción de la Tienda y SEO</span>
        </h2>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Descripción General (Aparece en el Pie de Página y Meta Tags)
          </label>
          <textarea
            rows={3}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Descripción oficial de la tienda..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-normal resize-none"
          />
        </div>
      </div>

      {/* Social Media Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Share2 className="w-4 h-4 text-emerald-600" />
          <span>Redes Sociales (Opcional)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Instagram</label>
            <input
              type="text"
              value={socialInstagram}
              onChange={(e) => setSocialInstagram(e.target.value)}
              placeholder="nexorastore"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Facebook</label>
            <input
              type="text"
              value={socialFacebook}
              onChange={(e) => setSocialFacebook(e.target.value)}
              placeholder="nexoratechpe"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">TikTok</label>
            <input
              type="text"
              value={socialTiktok}
              onChange={(e) => setSocialTiktok(e.target.value)}
              placeholder="nexora.peru"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

    </form>
  );
}
