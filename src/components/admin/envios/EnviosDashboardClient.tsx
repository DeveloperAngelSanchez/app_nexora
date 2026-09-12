'use client';

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  RefreshCw, 
  MapPin, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  ExternalLink, 
  Plus, 
  Eye, 
  ChevronUp, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Package, 
  Inbox, 
  Loader2 
} from 'lucide-react';
import { ShalomStatusCard } from './ShalomStatusCard';
import { ShalomStatusCardSkeleton } from './ShalomStatusCardSkeleton';
import { RegisterShipmentDrawer } from './RegisterShipmentDrawer';
import { ShalomConnectionModal } from './ShalomConnectionModal';
import type { ShalomTrackingResult } from '@/lib/shalom/types';
import type { ShalomStoredShipment, ShalomConnectionState } from '@/lib/shalom/storage';

export function EnviosDashboardClient() {
  const [shipments, setShipments] = useState<ShalomStoredShipment[]>([]);
  const [connection, setConnection] = useState<ShalomConnectionState>({
    is_connected: false,
    shalom_email: '',
    auth_token: '',
    terms_accepted: false,
    terms_accepted_at: null,
    status: 'disconnected',
    updated_at: null,
  });

  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Estado para acordeón desplegable en la tabla
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [activeTracking, setActiveTracking] = useState<ShalomTrackingResult | null>(null);

  // Modales
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);

  // Estados de carga individual por fila
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cargar envíos persistidos y conexión
  const loadShipments = async () => {
    try {
      const res = await fetch('/api/admin/envios/shipments');
      const data = await res.json();
      if (data.success) {
        setShipments(data.shipments || []);
        if (data.connection) setConnection(data.connection);
      }
    } catch (err) {
      console.error('Error al cargar envíos:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  // Función para transformar un envío guardado a ShalomTrackingResult
  const mapToTrackingResult = (s: ShalomStoredShipment): ShalomTrackingResult => {
    const isTransito = s.estado.toLowerCase().includes('tránsito') || s.estado.toLowerCase().includes('transito');
    const isDestino = s.estado.toLowerCase().includes('destino');
    const isEntregado = s.estado.toLowerCase().includes('entregado');

    return {
      numero: s.numero,
      codigo: s.codigo,
      ose_id: s.ose_id,
      estado: s.estado,
      subtitulo: s.subtitulo || 'Rumbo a su destino.',
      fecha_estado: s.fecha_estado || (s.fecha_envio ? formatFechaCompacta(s.fecha_envio) : new Date(s.last_checked_at).toLocaleDateString('es-PE')),
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

  // Función para mover la vista fluidamente hacia lo que se acaba de desplegar
  const scrollToExpandedElement = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Offset considerando el AdminTopBar sticky (h-20 = 80px) + 12px de margen superior estético
    const navbarHeight = 92;
    const rect = el.getBoundingClientRect();
    const targetY = window.pageYOffset + rect.top - navbarHeight;
    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: 'smooth',
    });
  };

  // Toggle de visualización: si ya está abierto, se pliega y limpia la memoria.
  const handleToggleExpand = async (item: ShalomStoredShipment) => {
    if (expandedId === item.id) {
      setExpandedId(null);
      setActiveTracking(null);
      return;
    }

    setExpandedId(item.id);
    setLoadingDetailId(item.id);
    setActiveTracking(null); // Limpia estado previo para forzar el shimmer

    // Auto-scroll inmediato en cuanto se monta el contenedor expandido
    setTimeout(() => {
      scrollToExpandedElement(`shipment-expanded-${item.id}`);
    }, 50);

    try {
      const res = await fetch(`/api/admin/envios/shipments/${item.id}/check`, {
        method: 'POST',
      });
      const data = await res.json();
      const targetItem = (data.success && data.shipment) ? data.shipment : item;
      
      if (data.success && data.shipment) {
        setShipments(prev => prev.map(s => s.id === targetItem.id ? targetItem : s));
      }

      setActiveTracking(mapToTrackingResult(targetItem));

      // Re-enfocar vista una vez renderizada la tarjeta Shalom completa
      setTimeout(() => {
        scrollToExpandedElement(`shipment-expanded-${item.id}`);
      }, 100);
    } catch (err) {
      setActiveTracking(mapToTrackingResult(item));
      setTimeout(() => {
        scrollToExpandedElement(`shipment-expanded-${item.id}`);
      }, 100);
    } finally {
      setLoadingDetailId(null);
    }
  };

  // Icono 1: Actualizar estado y fecha en background
  const handleQuickRefresh = async (item: ShalomStoredShipment) => {
    setUpdatingId(item.id);
    try {
      const res = await fetch(`/api/admin/envios/shipments/${item.id}/check`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.shipment) {
        const updated = data.shipment as ShalomStoredShipment;
        setShipments(prev => prev.map(s => s.id === updated.id ? updated : s));
        
        if (expandedId === updated.id) {
          setActiveTracking(mapToTrackingResult(updated));
        }
      } else {
        alert(data.error || 'No se pudo actualizar el estado.');
      }
    } catch (err) {
      console.error('Error al actualizar envío:', err);
      alert('Error de conexión al actualizar el envío.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Icono 3: Eliminar registro de la tabla y del backend
  const handleDeleteShipment = async (id: string, numero: string) => {
    const confirm = window.confirm(`¿Estás seguro de eliminar el registro del envío #${numero}?`);
    if (!confirm) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/envios/shipments/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setShipments(prev => prev.filter(s => s.id !== id));
        if (expandedId === id) {
          setExpandedId(null);
          setActiveTracking(null);
        }
      } else {
        alert(data.error || 'No se pudo eliminar el envío.');
      }
    } catch (err) {
      alert('Error de conexión al intentar eliminar.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleShipmentRegistered = (newShipment: ShalomStoredShipment) => {
    setShipments(prev => [newShipment, ...prev.filter(s => s.id !== newShipment.id)]);
    setExpandedId(newShipment.id);
    setActiveTracking(mapToTrackingResult(newShipment));
    setTimeout(() => {
      scrollToExpandedElement(`shipment-expanded-${newShipment.id}`);
    }, 80);
  };

  // Formateador compacto: "Jue 10 set. 12:57"
  const formatFechaCompacta = (fechaStr?: string) => {
    if (!fechaStr) return '—';
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return fechaStr;

      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const meses = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'set.', 'oct.', 'nov.', 'dic.'];

      const diaSemana = dias[d.getDay()];
      const diaNum = d.getDate();
      const mes = meses[d.getMonth()];
      const horas = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');

      return `${diaSemana} ${diaNum} ${mes} ${horas}:${mins}`;
    } catch {
      return fechaStr;
    }
  };

  // Ordenar los envíos por Fecha de Envío descendente (los de hoy arriba, los anteriores abajo)
  const sortedShipments = [...shipments].sort((a, b) => {
    const parse = (d?: string) => (d ? new Date(d).getTime() : 0);
    const dateA = parse(a.fecha_envio) || parse(a.created_at);
    const dateB = parse(b.fecha_envio) || parse(b.created_at);
    return dateB - dateA;
  });

  // Métricas
  const totalCount = shipments.length;
  const transitoCount = shipments.filter(s => s.estado.toLowerCase().includes('trán') || s.estado.toLowerCase().includes('trans')).length;
  const destinoCount = shipments.filter(s => s.estado.toLowerCase().includes('destin')).length;
  const entregadoCount = shipments.filter(s => s.estado.toLowerCase().includes('entreg')).length;

  return (
    <div className="space-y-8 pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
      
      {/* 1. Header principal con botón "Registrar Pedido" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-red-50 text-red-600 rounded-2xl shadow-2xs">
              <Truck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Envíos & Logística Shalom
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Seguimiento cronológico de pedidos, estados de pago y comprobantes oficiales.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsRegisterOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-2xl text-sm transition-all shadow-md hover:shadow-red-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Pedido</span>
        </button>
      </div>

      {/* 2. Banner de Vinculación de Cuenta Shalom Pro */}
      <div className="rounded-2xl border p-4 sm:p-5 transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            connection.is_connected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {connection.is_connected ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                {connection.is_connected ? 'Cuenta Shalom Pro Vinculada' : 'Cuenta Shalom Pro No Vinculada'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                connection.is_connected 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {connection.is_connected ? 'Modo Enriquecido Activo' : 'Modo Básico'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {connection.is_connected 
                ? `Sesión activa para: ${connection.shalom_email}. Se obtienen comprobantes oficiales y direcciones completas.`
                : 'Vincula tu cuenta para desbloquear direcciones de origen/destino exactas y facturas (Ley N° 29733).'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsConnectionModalOpen(true)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            connection.is_connected
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
          }`}
        >
          {connection.is_connected ? 'Administrar Conexión' : 'Vincular mi cuenta de Shalom'}
        </button>
      </div>

      {/* 3. Las 4 Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Envíos</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
            <span className="text-xs text-slate-500 mt-0.5 inline-block">Registrados en tienda</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full -mr-4 -mt-4 pointer-events-none" />
          <div>
            <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">En Tránsito</span>
            <div className="text-2xl font-black text-red-600 mt-1 flex items-center gap-2">
              {transitoCount}
              {transitoCount > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                </span>
              )}
            </div>
            <span className="text-xs text-red-500/80 mt-0.5 inline-block font-medium">Camiones en ruta</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Truck className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En Destino</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{destinoCount}</div>
            <span className="text-xs text-slate-500 mt-0.5 inline-block">Listos para retiro</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Entregados</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{entregadoCount}</div>
            <span className="text-xs text-emerald-600 mt-0.5 inline-block font-medium">100% completados</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. TABLA DE DESPACHOS RECIENTES ORDENADOS POR FECHA DE ENVÍO */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Despachos Recientes de tienda
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                Ordenados por fecha de envío
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Los envíos de hoy se muestran primero, seguidos de los anteriores en orden cronológico exacto.
            </p>
          </div>

          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full self-start sm:self-auto">
            {sortedShipments.length} {sortedShipments.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>

        {sortedShipments.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              No hay envíos registrados todavía
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Presiona &quot;Registrar Pedido&quot; para agregar y monitorear tu primera guía de Shalom.
            </p>
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Registrar Primer Pedido</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left text-sm border-collapse min-w-[760px]">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 sm:px-3.5 whitespace-nowrap">N° Orden</th>
                  <th className="py-3 px-2 sm:px-2.5 whitespace-nowrap">Código</th>
                  <th className="py-3 px-2.5 sm:px-3 whitespace-nowrap">Estado</th>
                  <th className="py-3 px-2.5 sm:px-3 whitespace-nowrap">Fecha Envío</th>
                  <th className="py-3 px-2.5 sm:px-3 whitespace-nowrap">Pago</th>
                  <th className="py-3 px-2.5 sm:px-3 whitespace-nowrap">Estado Pago</th>
                  <th className="py-3 px-2.5 sm:px-3 whitespace-nowrap">
                    Ruta <span className="hidden xl:inline text-slate-400 font-normal lowercase">(origen ➔ destino)</span>
                  </th>
                  <th className="py-3 px-2.5 sm:px-3 whitespace-nowrap">Últ. Consulta</th>
                  <th className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedShipments.map((item) => {
                  const isExpanded = expandedId === item.id;
                  const isRowUpdating = updatingId === item.id;
                  const isRowDeleting = deletingId === item.id;

                  const isPaid = (item.estado_pago || '').toLowerCase().includes('pagado');

                  // Color tipográfico limpio sin chips para el estado
                  const estadoLower = item.estado.toLowerCase();
                  const estadoColorClass = (estadoLower.includes('trán') || estadoLower.includes('trans'))
                    ? 'text-red-600 font-bold'
                    : estadoLower.includes('destin')
                    ? 'text-amber-600 font-bold'
                    : estadoLower.includes('entreg')
                    ? 'text-emerald-600 font-bold'
                    : 'text-slate-600 font-semibold';

                  return (
                    <React.Fragment key={item.id}>
                      {/* Fila principal del pedido */}
                      <tr 
                        className={`transition-colors ${
                          isExpanded ? 'bg-red-50/25' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* 1. N° de Orden */}
                        <td className="py-3.5 px-3 sm:px-3.5 font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                          {item.numero}
                        </td>

                        {/* 2. Código */}
                        <td className="py-3.5 px-2 sm:px-2.5 font-mono font-bold text-slate-600 text-xs whitespace-nowrap">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">
                            {item.codigo}
                          </span>
                        </td>

                        {/* 3. Estado de Envío (En 1 sola fila sin chips ni badges) */}
                        <td className="py-3.5 px-2.5 sm:px-3 text-xs whitespace-nowrap">
                          <span className={`${estadoColorClass} whitespace-nowrap`}>
                            {item.estado}
                          </span>
                        </td>

                        {/* 4. FECHA DE ENVÍO (Formato: Jue 10 set. 12:57) */}
                        <td className="py-3.5 px-2.5 sm:px-3 text-xs font-medium text-slate-700 whitespace-nowrap">
                          {formatFechaCompacta(item.fecha_envio)}
                        </td>

                        {/* 5. COLUMNA PAGO (Monto completo en 1 fila sin icono) */}
                        <td className="py-3.5 px-2.5 sm:px-3 text-xs font-bold text-slate-900 whitespace-nowrap">
                          S/ {item.monto || '12.00'}
                        </td>

                        {/* 6. COLUMNA ESTADO PAGO (En 1 fila sin chips ni badges) */}
                        <td className="py-3.5 px-2.5 sm:px-3 text-xs font-semibold whitespace-nowrap">
                          {isPaid ? (
                            <span className="text-emerald-600 whitespace-nowrap">Pagado</span>
                          ) : (
                            <span className="text-amber-600 whitespace-nowrap">Por cobrar</span>
                          )}
                        </td>

                        {/* 7. Origen ➔ Destino (Truncado dinámico y fluido que evita el desborde horizontal) */}
                        <td className="py-3.5 px-2.5 sm:px-3 text-xs text-slate-700" title={`${item.origen_nombre || 'Origen'} ➔ ${item.destino_nombre || 'Destino'}`}>
                          <div className="max-w-[130px] md:max-w-[160px] lg:max-w-[200px] xl:max-w-[280px] truncate">
                            <span className="text-slate-900 font-medium">{item.origen_nombre || 'Origen'}</span>
                            <span className="text-slate-400 mx-1">➔</span>
                            <span className="text-slate-600">{item.destino_nombre || 'Destino'}</span>
                          </div>
                        </td>

                        {/* 8. Última Consulta (Formato compacto en 1 fila) */}
                        <td className="py-3.5 px-2.5 sm:px-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                          {formatFechaCompacta(item.last_checked_at)}
                        </td>

                        {/* 9. ACCIONES (Actualizar + Toggle Ver/Plegar + Eliminar) */}
                        <td className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 justify-end">
                            
                            {/* Icono 1: Actualizar */}
                            <button
                              type="button"
                              onClick={() => handleQuickRefresh(item)}
                              disabled={isRowUpdating}
                              className="p-1.5 sm:p-2 rounded-xl border border-slate-200 hover:bg-slate-100 active:scale-95 text-slate-600 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50"
                              title="Actualizar estado ahora"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRowUpdating ? 'animate-spin text-red-600' : ''}`} />
                            </button>

                            {/* Icono 2: Ver (Eye) / Plegar (ChevronUp) */}
                            <button
                              type="button"
                              onClick={() => handleToggleExpand(item)}
                              className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                                isExpanded
                                  ? 'bg-red-600 border-red-600 text-white shadow-xs'
                                  : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                              }`}
                              title={isExpanded ? 'Cerrar visualización' : 'Visualizar rastreo oficial'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              )}
                            </button>

                            {/* Icono 3: Eliminar */}
                            <button
                              type="button"
                              onClick={() => handleDeleteShipment(item.id, item.numero)}
                              disabled={isRowDeleting}
                              className="p-1.5 sm:p-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-400 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                              title="Eliminar este envío"
                            >
                              {isRowDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-red-600" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              )}
                            </button>

                          </div>
                        </td>
                      </tr>

                      {/* FILA EXPANDIDA (colSpan={9} para cubrir todas las columnas) */}
                      {isExpanded && (
                        <tr 
                          id={`shipment-expanded-${item.id}`}
                          className="bg-slate-50/60 border-y border-red-100/60 transition-all"
                        >
                          <td colSpan={9} className="p-2 sm:p-5">
                            {/* Contenedor adaptativo: en móvil usa sticky left-0 y ancho del viewport visible para que NO se desborde con el scroll horizontal de la tabla */}
                            <div className="sticky left-0 w-[calc(100vw-3.25rem)] sm:w-auto max-w-[calc(100vw-3.25rem)] sm:max-w-full overflow-hidden">
                              
                              {loadingDetailId === item.id || !activeTracking ? (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider animate-pulse mb-1">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Consultando información oficial de Shalom...</span>
                                  </div>
                                  <ShalomStatusCardSkeleton />
                                </div>
                              ) : (
                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200 w-full max-w-full overflow-hidden">
                                  
                                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                                        Visualización Oficial Shalom — Orden #{activeTracking.numero}
                                      </h4>
                                    </div>

                                    {/* Botón Plegar: solo icono minimalista sin card, badge ni texto */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleExpand(item)}
                                      className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
                                      title="Plegar visualización"
                                      aria-label="Plegar visualización"
                                    >
                                      <ChevronUp className="w-5 h-5 stroke-[2.5]" />
                                    </button>
                                  </div>

                                  {/* Tarjeta Réplica Imagen 1 */}
                                  <ShalomStatusCard
                                    tracking={activeTracking}
                                    onDownloadGrt={() => {
                                      if (activeTracking.grt_url) {
                                        window.open(activeTracking.grt_url, '_blank');
                                      } else if (activeTracking.ose_id) {
                                        window.open('https://shalom.com.pe/rastrea', '_blank');
                                      } else {
                                        alert(`Consultando Guía de Remisión Transportista (GRT) para orden #${activeTracking.numero}...`);
                                      }
                                    }}
                                  />

                                  {/* Ficha de Ruta Logística Enriquecida */}
                                  {(activeTracking.origen_direccion || activeTracking.destino_direccion) && (
                                    <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs">
                                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-red-600" />
                                        Ruta Logística y Puntos de Entrega
                                      </h4>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                                        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-100">
                                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                                            Punto de Origen
                                          </div>
                                          <div className="text-sm sm:text-base font-bold text-slate-900 mt-1 sm:mt-1.5">
                                            {activeTracking.origen_nombre || 'Agencia Origen'}
                                          </div>
                                          <p className="text-xs text-slate-600 mt-1 font-mono">
                                            {activeTracking.origen_direccion}
                                          </p>
                                        </div>

                                        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-100">
                                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                                            Punto de Destino
                                          </div>
                                          <div className="text-sm sm:text-base font-bold text-slate-900 mt-1 sm:mt-1.5">
                                            {activeTracking.destino_nombre || 'Agencia Destino'}
                                          </div>
                                          <p className="text-xs text-slate-600 mt-1 font-mono">
                                            {activeTracking.destino_direccion}
                                          </p>
                                        </div>
                                      </div>

                                      {activeTracking.comprobante_pdf ? (
                                        <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                                          <span className="text-slate-600">
                                            Comprobante electrónico oficial emitido en <strong>Nubefact</strong>:
                                          </span>
                                          <a
                                            href={activeTracking.comprobante_pdf}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-bold"
                                          >
                                            <FileText className="w-4 h-4" />
                                            <span>Ver Factura/Boleta PDF</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </a>
                                        </div>
                                      ) : (
                                        <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
                                          <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                                            <span>
                                              {activeTracking.estado_pago?.toLowerCase().includes('cobrar')
                                                ? `Comprobante de pago: Se emitirá en agencia de destino (${activeTracking.destino_nombre || 'Agencia Destino'}) al cobrar S/ ${activeTracking.monto || '12.00'} contra entrega.`
                                                : 'Comprobante de pago: No emitido o pendiente de facturación en agencia.'}
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (activeTracking.grt_url) {
                                                window.open(activeTracking.grt_url, '_blank');
                                              } else {
                                                window.open('https://shalom.com.pe/rastrea', '_blank');
                                              }
                                            }}
                                            className="inline-flex items-center gap-1 text-slate-700 hover:text-red-600 font-semibold cursor-pointer transition-colors shrink-0"
                                          >
                                            <span>Consultar GRT Oficial</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                </div>
                              )}

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modales y Slide-Overs */}
      <RegisterShipmentDrawer
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleShipmentRegistered}
      />

      <ShalomConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        connection={connection}
        onUpdated={(newConn) => setConnection(newConn)}
      />

    </div>
  );
}
