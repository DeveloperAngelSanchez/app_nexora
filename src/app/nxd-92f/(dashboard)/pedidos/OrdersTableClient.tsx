'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Search, 
  MessageCircle, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  ChevronRight,
  User
} from 'lucide-react';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { updateOrderStatus } from '@/lib/admin/orders';

interface OrderItem {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  district: string;
  status: string;
  total: number;
  subtotal: number;
  items: any[];
  tracking_code?: string | null;
  created_at: string;
}

interface OrdersTableClientProps {
  initialOrders: OrderItem[];
  currentStatus?: string;
  currentStatusFilter?: string;
}

export function OrdersTableClient({ initialOrders, currentStatus, currentStatusFilter = 'all' }: OrdersTableClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(currentStatus || currentStatusFilter);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusTab = (status: string) => {
    setStatusFilter(status);
    if (status === 'all') {
      router.push('/nxd-92f/pedidos');
    } else {
      router.push(`/nxd-92f/pedidos?status=${status}`);
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await updateOrderStatus(id, newStatus as any);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert('Error al actualizar estado: ' + (err?.message || 'Error desconocido'));
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCleanWhatsAppUrl = (phone: string, orderNumber: string, customerName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    const text = encodeURIComponent(
      `Hola ${customerName}, te escribimos de NeXora Store con respecto a tu pedido #${orderNumber}.`
    );
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Gestión de Pedidos
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Controla los pedidos recibidos por WhatsApp y actualiza su estado de entrega
        </p>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pending', label: 'Pendientes' },
            { key: 'confirmed', label: 'Confirmados' },
            { key: 'dispatched', label: 'Enviados' },
            { key: 'delivered', label: 'Entregados' },
            { key: 'cancelled', label: 'Cancelados' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente o # orden..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">No hay pedidos</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Los pedidos generados por los clientes en el checkout aparecerán aquí automáticamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4"># Orden</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Destino</th>
                  <th className="py-3.5 px-4">Monto</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4 text-right">Contacto & Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Order Number */}
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/nxd-92f/pedidos/${order.id}`}
                        className="font-mono font-bold text-slate-900 hover:text-emerald-600 hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{order.customer_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{order.customer_phone}</p>
                      </div>
                    </td>

                    {/* City / District */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="text-slate-800 font-medium">{order.city}</p>
                        <p className="text-[11px] text-slate-400">{order.district}</p>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4">
                      <span className="font-black text-slate-900">
                        S/ {Number(order.total).toFixed(2)}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="pending">⏳ Pendiente</option>
                        <option value="confirmed">✅ Confirmado</option>
                        <option value="dispatched">🚚 Enviado</option>
                        <option value="delivered">📦 Entregado</option>
                        <option value="cancelled">❌ Cancelado</option>
                      </select>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(order.created_at).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions: WhatsApp & View */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <a
                          href={getCleanWhatsAppUrl(order.customer_phone, order.order_number, order.customer_name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition-colors border border-emerald-200"
                          title="Abrir chat de WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        <Link
                          href={`/nxd-92f/pedidos/${order.id}`}
                          className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                          title="Ver detalle del pedido"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
