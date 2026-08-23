'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageCircle, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface WhatsAppCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppCheckoutModal({ isOpen, onClose }: WhatsAppCheckoutModalProps) {
  const { items, getSubtotal, getShippingCost, getTotal, clearCart } = useCartStore();

  const [storeSettings, setStoreSettings] = useState<{
    whatsapp_number: string;
    store_name: string;
  }>({
    whatsapp_number: '51999999999',
    store_name: 'NeXora Store',
  });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: 'Lima',
    district: '',
    address: '',
    reference: '',
    paymentMethod: 'Yape / Plin',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch live store settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase
          .from('site_settings')
          .select('whatsapp_number, store_name')
          .eq('id', 'main')
          .maybeSingle();

        if (data) {
          setStoreSettings({
            whatsapp_number: data.whatsapp_number || '51999999999',
            store_name: data.store_name || 'NeXora Store',
          });
        }
      } catch (e) {
        // graceful fallback to default
      }
    }

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const shipping = getShippingCost();
  const total = getTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      setErrorMsg('Por favor ingresa un número de teléfono válido (mínimo 9 dígitos).');
      return;
    }

    if (!formData.fullName.trim() || !formData.address.trim() || !formData.district.trim()) {
      setErrorMsg('Por favor completa todos los campos de entrega obligatorios.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      
      const paymentMap: Record<string, string> = {
        'Yape / Plin': 'whatsapp_yape_plin',
        'Contraentrega (Lima)': 'contraentrega',
        'Transferencia BCP/BBVA': 'transferencia',
        'Tarjeta de Débito/Crédito': 'card',
      };

      // 1. Insert order to Supabase
      const { data: orderData } = await supabase
        .from('orders')
        .insert({
          customer_name: formData.fullName.trim(),
          customer_phone: cleanPhone,
          city: formData.city,
          district: formData.district.trim(),
          address: formData.address.trim(),
          reference: formData.reference.trim() || null,
          payment_method: paymentMap[formData.paymentMethod] || 'whatsapp_yape_plin',
          items: items.map((i) => ({
            id: i.product.id,
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
            color: i.selectedColor || null,
            model: i.selectedModel || null,
          })),
          subtotal,
          shipping_cost: shipping,
          total,
          status: 'pending',
          admin_notes: formData.notes.trim() ? `Nota cliente: ${formData.notes.trim()}` : null,
        })
        .select()
        .single();

      const orderNumber = orderData?.order_number || 'NEXORA';

      // 2. Build WhatsApp message
      let message = `*SOLICITUD DE PEDIDO #${orderNumber}*\n`;
      message += `------------------------------------\n\n`;
      
      message += `*DATOS DEL CLIENTE:*\n`;
      message += `👤 Nombre: ${formData.fullName.trim()}\n`;
      message += `📱 Teléfono: ${cleanPhone}\n`;
      message += `📍 Destino: ${formData.city} - ${formData.district.trim()}\n`;
      message += `🏠 Dirección: ${formData.address.trim()}\n`;
      if (formData.reference.trim()) {
        message += `🔎 Referencia: ${formData.reference.trim()}\n`;
      }
      message += `💳 Método de Pago: ${formData.paymentMethod}\n\n`;

      message += `*DETALLE DE PRODUCTOS:*\n`;
      items.forEach((item, index) => {
        const variantStr = [item.selectedModel, item.selectedColor].filter(Boolean).join(' / ');
        message += `${index + 1}. *${item.product.name}*\n`;
        if (variantStr) message += `   Variante: ${variantStr}\n`;
        message += `   Cantidad: ${item.quantity} x S/ ${item.product.price.toFixed(2)} = S/ ${(item.quantity * item.product.price).toFixed(2)}\n`;
      });

      message += `\n------------------------------------\n`;
      message += `Subtotal: S/ ${subtotal.toFixed(2)}\n`;
      message += `Envío: ${shipping === 0 ? '¡Gratis!' : `S/ ${shipping.toFixed(2)}`}\n`;
      message += `*TOTAL A PAGAR: S/ ${total.toFixed(2)}*\n`;
      message += `------------------------------------\n\n`;
      
      if (formData.notes.trim()) {
        message += `📝 Nota adicional: ${formData.notes.trim()}\n\n`;
      }

      message += `Hola ${storeSettings.store_name}, acabo de registrar este pedido en la tienda online. Por favor confirmarme disponibilidad y datos de cuenta / QR para coordinar la entrega. Muchas gracias.`;

      // 3. Build WhatsApp URL
      const targetPhone = storeSettings.whatsapp_number.replace(/[^0-9]/g, '');
      const formattedTargetPhone = targetPhone.startsWith('51') ? targetPhone : `51${targetPhone}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${formattedTargetPhone}?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');

      clearCart();
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.warn('Error saving order, launching WhatsApp anyway:', err);
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Completar Datos de Entrega</h3>
            <p className="text-xs text-slate-500">Un asesor confirmará tu pedido de inmediato por WhatsApp</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200/80 flex items-center justify-between">
            <span className="text-emerald-900 font-semibold">{items.length} productos en orden</span>
            <span className="font-black text-emerald-800 text-sm">Total: S/ {total.toFixed(2)}</span>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nombre y Apellido *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ej: Carlos Mendoza"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Número de Teléfono / WhatsApp *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ej: 999 123 456"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Departamento</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="Lima">Lima</option>
                <option value="Callao">Callao</option>
                <option value="Arequipa">Arequipa</option>
                <option value="Trujillo">Trujillo</option>
                <option value="Cusco">Cusco</option>
                <option value="Chiclayo">Chiclayo</option>
                <option value="Piura">Piura</option>
                <option value="Otras Provincias">Otras Provincias (Olva)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Distrito *</label>
              <input
                type="text"
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Ej: Miraflores / Surco"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Dirección de Entrega Exacta *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ej: Av. Larco 450, Dpto 302"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Referencia (Opcional)</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Ej: Frente al parque / Altura cuadra 4"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Método de Pago Preferido</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                'Yape / Plin',
                'Contraentrega (Lima)',
                'Transferencia BCP/BBVA',
                'Tarjeta de Débito/Crédito'
              ].map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setFormData({ ...formData, paymentMethod: method })}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                    formData.paymentMethod === method
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-full flex items-center justify-center gap-2 transition-all touch-press text-xs mt-4 shadow-xs cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando pedido...</span>
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Pedido a WhatsApp</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-slate-400">
            🔒 Un asesor confirmará stock y número de guía en minutos.
          </p>
        </form>

      </div>
    </div>
  );
}
