'use client';

import React, { useState } from 'react';
import { X, PackagePlus, Loader2, AlertCircle } from 'lucide-react';
import type { ShalomStoredShipment } from '@/lib/shalom/storage';

interface RegisterShipmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (shipment: ShalomStoredShipment) => void;
}

export function RegisterShipmentDrawer({
  isOpen,
  onClose,
  onSuccess,
}: RegisterShipmentDrawerProps) {
  const [numero, setNumero] = useState('');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim() || !codigo.trim()) {
      setErrorMsg('Por favor completa el N° de orden y el código de 4 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/envios/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: numero.trim(),
          codigo: codigo.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al consultar o registrar el pedido.');
      }

      onSuccess(data.shipment);
      setNumero('');
      setCodigo('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión con el servicio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
          
          {/* Header del Drawer */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100/70 text-red-600 flex items-center justify-center">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Registrar Pedido
                </h3>
                <p className="text-xs text-slate-500">
                  Ingresa los datos del comprobante Shalom
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario (Únicamente 2 campos pedidos por el usuario) */}
          <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Campo 1: N° de Orden */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  N° de Orden <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ej: 95379502"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-slate-400"
                />
                <span className="text-xs text-slate-500 mt-1 block">
                  El número de 8 dígitos impreso en tu guía de remisión.
                </span>
              </div>

              {/* Campo 2: Código */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Código de 4 Dígitos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ej: P3PJ"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold uppercase text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-slate-400"
                />
                <span className="text-xs text-slate-500 mt-1 block">
                  Código alfanumérico de seguridad asignado por Shalom.
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <strong className="text-slate-800 block">⚡ Automatización Inmediata:</strong>
                Al registrar, el sistema consultará directamente a la API de Shalom para sincronizar el estado, origen, destino y carguero en tiempo real.
              </div>
            </div>

            {/* Footer con botón de acción */}
            <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Consultando...</span>
                  </>
                ) : (
                  <span>Guardar y Rastrear</span>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
