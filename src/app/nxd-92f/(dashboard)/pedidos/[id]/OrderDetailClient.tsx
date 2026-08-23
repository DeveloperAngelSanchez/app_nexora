'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  MessageCircle, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  Truck, 
  DollarSign,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { updateOrderStatus, updateOrderTracking } from '@/lib/admin/orders';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';

interface OrderDetailProps {
  order: any;
}

export function OrderDetailClient({ order }: OrderDetailProps) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status || 'pending');
  const [trackingCode, setTrackingCode] = useState(order.tracking_code || '');
  const [adminNotes, setAdminNotes] = useState(order.admin_notes || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const cleanPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hola ${order.customer_name}, te escribimos de NeXora Store sobre tu pedido #${order.order_number}.`
  )}`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(false);

    try {
      await updateOrderStatus(order.id, status);
      await updateOrderTracking(order.id, trackingCode, adminNotes);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/nxd-92f/pedidos"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-900 tracking-tight font-mono">
                {order.order_number}
              </h1>
              <OrderStatusBadge status={status} />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Pedido registrado el {new Date(order.created_at).toLocaleString('es-PE')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Chatear con Cliente</span>
          </a>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>¡Cambios guardados y actualizados exitosamente!</span>
        </div>
      )}

      {/* Main Grid: Order Details & Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Line Items & Totals */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Items Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Productos Solicitados ({items.length})</span>
            </h2>

            <div className="divide-y divide-slate-100">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">NX</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      {item.variant && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Variante: {item.variant.name || item.variant.title || JSON.stringify(item.variant)}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Cantidad: <span className="font-bold text-slate-700">{item.quantity}</span> x S/ {Number(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-900">
                      S/ {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotals & Total */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-800">S/ {Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Costo de Envío:</span>
                <span className="font-medium text-slate-800">
                  {Number(order.shipping_cost) === 0 ? (
                    <span className="text-emerald-700 font-bold">¡Gratis!</span>
                  ) : (
                    `S/ ${Number(order.shipping_cost).toFixed(2)}`
                  )}
                </span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Descuento aplicado:</span>
                  <span className="font-bold">- S/ {Number(order.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-900">Total a Cobrar:</span>
                <span className="font-black text-emerald-700 text-base">
                  S/ {Number(order.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Notes & Tracking Form */}
          <form onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Gestión de Estado y Seguimiento</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Estado del Pedido
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="pending">⏳ Pendiente (Por atender)</option>
                  <option value="confirmed">✅ Confirmado (Pago verificado)</option>
                  <option value="dispatched">🚚 Enviado (En ruta / Olva)</option>
                  <option value="delivered">📦 Entregado al cliente</option>
                  <option value="cancelled">❌ Cancelado / Devuelto</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Código de Seguimiento / Guía Olva
                </label>
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="ej. OLVA-78945612"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Notas Internas del Administrador
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notas de coordinación, comprobante de pago verificado, etc..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Guardando...' : 'Actualizar Pedido'}</span>
              </button>
            </div>
          </form>

        </div>

        {/* Right Column (4 cols): Customer & Shipping Address */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Customer Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Datos del Comprador</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Nombre Completo</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{order.customer_name}</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Teléfono / WhatsApp</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-slate-800">{order.customer_phone}</span>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline text-[11px] font-bold"
                  >
                    Chatear →
                  </a>
                </div>
              </div>

              {order.customer_email && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Correo Electrónico</p>
                  <p className="font-medium text-slate-800 mt-0.5">{order.customer_email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Dirección de Despacho</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Ciudad / Provincia</p>
                <p className="font-bold text-slate-900 mt-0.5">{order.city}</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Distrito</p>
                <p className="font-bold text-slate-900 mt-0.5">{order.district}</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Dirección Exacta</p>
                <p className="font-medium text-slate-800 mt-0.5 leading-relaxed">{order.address}</p>
              </div>

              {order.reference && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Referencia</p>
                  <p className="font-medium text-slate-600 mt-0.5 italic">{order.reference}</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
