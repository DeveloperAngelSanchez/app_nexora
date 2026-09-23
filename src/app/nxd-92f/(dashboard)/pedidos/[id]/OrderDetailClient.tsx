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
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Plus,
  Loader2
} from 'lucide-react';
import { updateOrderStatus, updateOrderTracking } from '@/lib/admin/orders';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { ShalomStatusCard } from '@/components/admin/envios/ShalomStatusCard';
import type { ShalomTrackingResult } from '@/lib/shalom/types';

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

  // Estado del envío Shalom vinculado
  const [shipment, setShipment] = useState<any>(order.shipment || null);
  const [syncingShalom, setSyncingShalom] = useState(false);
  const [showShalomModal, setShowShalomModal] = useState(false);
  const [shalomNumero, setShalomNumero] = useState('');
  const [shalomCodigo, setShalomCodigo] = useState('');
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [shalomError, setShalomError] = useState<string | null>(null);

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

  const handleLinkShalom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shalomNumero.trim() || !shalomCodigo.trim()) {
      setShalomError('Ingresa el N° de orden (8 dígitos) y el código (4 dígitos)');
      return;
    }

    setLinkingLoading(true);
    setShalomError(null);

    try {
      const res = await fetch('/api/admin/envios/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: shalomNumero.trim(),
          codigo: shalomCodigo.trim().toUpperCase(),
          order_id: order.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al vincular con Shalom');
      }

      setShipment(data.shipment);
      setTrackingCode(data.shipment.numero);
      setStatus('dispatched');
      setShowShalomModal(false);
      setShalomNumero('');
      setShalomCodigo('');
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      router.refresh();
    } catch (err: any) {
      setShalomError(err?.message || 'Error de conexión');
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleSyncShalom = async () => {
    if (!shipment?.id) return;
    setSyncingShalom(true);
    try {
      const res = await fetch(`/api/admin/envios/shipments/${shipment.id}/check`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.shipment) {
        setShipment(data.shipment);
      }
    } catch (err) {
      console.error('Error sincronizando con Shalom:', err);
    } finally {
      setSyncingShalom(false);
    }
  };

  const mapToTrackingResult = (s: any): ShalomTrackingResult => {
    const isTransito = s.estado?.toLowerCase().includes('tránsito') || s.estado?.toLowerCase().includes('transito');
    const isDestino = s.estado?.toLowerCase().includes('destino');
    const isEntregado = s.estado?.toLowerCase().includes('entregado');

    return {
      numero: s.numero,
      codigo: s.codigo,
      ose_id: s.ose_id,
      estado: s.estado,
      subtitulo: s.subtitulo || 'Rumbo a su destino.',
      fecha_estado: s.fecha_estado || '',
      hitos: {
        origen: true,
        transito: isTransito || isDestino || isEntregado,
        destino: isDestino || isEntregado,
        entregado: isEntregado,
      },
      origen_nombre: s.origen_nombre,
      origen_direccion: s.origen_direccion,
      destino_nombre: s.destino_nombre,
      destino_direccion: s.destino_direccion,
      destinatario: s.destinatario,
      comprobante_pdf: s.comprobante_pdf,
      comprobante_pendiente: s.comprobante_pendiente,
      grt_url: s.grt_url,
      tipo_pago: s.tipo_pago,
      monto: s.monto,
      estado_pago: s.estado_pago,
      carguero: s.carguero,
    };
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
          <span>¡Cambios guardados y sincronizados exitosamente!</span>
        </div>
      )}

      {/* Main Grid: Order Details & Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Line Items & Tracking */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card 1: Productos Solicitados */}
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

          {/* Card 2: Envío y Rastreo Shalom */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-red-600" />
                <span>Rastreo y Envío Shalom</span>
              </h2>

              {shipment ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncShalom}
                    disabled={syncingShalom}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    title="Actualizar estado en vivo con Shalom"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingShalom ? 'animate-spin text-red-600' : ''}`} />
                    <span>{syncingShalom ? 'Consultando...' : 'Sincronizar'}</span>
                  </button>
                  <Link
                    href="/nxd-92f/envios"
                    className="inline-flex items-center gap-1 text-xs text-red-600 font-bold hover:underline"
                  >
                    <span>Módulo Envíos</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowShalomModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Vincular Guía Shalom</span>
                </button>
              )}
            </div>

            {shipment ? (
              <div className="pt-2">
                <ShalomStatusCard
                  tracking={mapToTrackingResult(shipment)}
                  onDownloadGrt={() => {
                    if (shipment.grt_url) window.open(shipment.grt_url, '_blank');
                  }}
                />
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                <p className="text-xs font-medium text-slate-600">
                  Este pedido no tiene una guía Shalom vinculada todavía.
                </p>
                <p className="text-[11px] text-slate-400">
                  Al vincularla, podrás consultar el camión en ruta, la agencia de destino y descargar la GRT en tiempo real.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowShalomModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:border-red-500 hover:text-red-600 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <Truck className="w-4 h-4 text-red-600" />
                    <span>Ingresar Número y Código Shalom</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Admin Notes & Tracking Form */}
          <form onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Gestión de Estado NeXora</span>
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
                  <option value="dispatched">🚚 Enviado (En ruta / Shalom / Olva)</option>
                  <option value="delivered">📦 Entregado al cliente</option>
                  <option value="cancelled">❌ Cancelado / Devuelto</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Código de Seguimiento / Guía
                </label>
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="ej. 95379502 o OLVA-12345"
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

      {/* Modal para Vincular Guía Shalom */}
      {showShalomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Vincular Guía Shalom</h3>
                  <p className="text-xs text-slate-500">Asocia el rastreo oficial a este pedido</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShalomModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {shalomError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{shalomError}</span>
              </div>
            )}

            <form onSubmit={handleLinkShalom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  N° de Orden Shalom (8 dígitos) *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={shalomNumero}
                  onChange={(e) => setShalomNumero(e.target.value)}
                  placeholder="Ej: 95379502"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Código de 4 Dígitos *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={shalomCodigo}
                  onChange={(e) => setShalomCodigo(e.target.value.toUpperCase())}
                  placeholder="Ej: P3PJ"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowShalomModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={linkingLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {linkingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{linkingLoading ? 'Consultando...' : 'Vincular y Rastrear'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
