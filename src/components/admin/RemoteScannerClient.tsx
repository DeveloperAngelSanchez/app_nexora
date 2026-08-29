'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Camera, 
  Check, 
  ArrowLeft, 
  RefreshCw, 
  Layers, 
  Send,
  Sparkles,
  Zap,
  Plus
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import { useRemoteScanClient } from '@/lib/admin/useRemoteScanSession';

export function RemoteScannerClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSession = searchParams.get('session') || '';

  const [inputCode, setInputCode] = useState(initialSession);
  const [lastSentBarcode, setLastSentBarcode] = useState<string | null>(null);

  const {
    sessionCode,
    isConnected,
    isConnecting,
    error,
    scansSent,
    connectToSession,
    sendBarcode,
    disconnect,
  } = useRemoteScanClient(initialSession);

  // Auto connect if query param present
  useEffect(() => {
    if (initialSession && !isConnected && !isConnecting) {
      connectToSession(initialSession);
    }
  }, [initialSession, isConnected, isConnecting, connectToSession]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      connectToSession(inputCode.trim());
    }
  };

  const handleBarcodeScanned = async (barcode: string, format?: string) => {
    const success = await sendBarcode(barcode, format);
    if (success) {
      setLastSentBarcode(barcode);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/nxd-92f/productos"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <span>Escáner Remoto Móvil</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Conecta tu teléfono como pistola de código de barras para la web desktop
            </p>
          </div>
        </div>

        {isConnected && (
          <button
            onClick={disconnect}
            className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
          >
            Desconectar
          </button>
        )}
      </div>

      {/* Screen 1: Pairing Form (if not connected) */}
      {!isConnected ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-xs text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
            <Wifi className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1.5 max-w-sm mx-auto">
            <h2 className="text-base font-bold text-slate-900">Vincular con tu Computadora</h2>
            <p className="text-xs text-slate-500">
              Ingresa el código de 6 dígitos que aparece en la pantalla de tu computadora.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="max-w-xs mx-auto space-y-4">
            <div>
              <input
                type="text"
                required
                maxLength={8}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="ej. NX-4821"
                className="w-full text-center tracking-widest text-2xl font-mono font-black px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={isConnecting || !inputCode.trim()}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-5 rounded-2xl text-xs transition-all shadow-xs cursor-pointer"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Conectar Escáner</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <span>Sincronización en tiempo real vía Supabase WebSockets</span>
          </div>
        </div>
      ) : (
        /* Screen 2: Active Remote Scanner Camera Feed */
        <div className="space-y-6">
          
          {/* Connection Status Banner */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <p className="text-xs font-black text-emerald-900">
                  Conectado a Sesión: <span className="font-mono text-emerald-700">{sessionCode}</span>
                </p>
                <p className="text-[10px] text-emerald-700 font-medium">
                  Los códigos escaneados se transmitirán al instante a tu Desktop
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
              {scansSent.length} enviados
            </span>
          </div>

          {/* Camera Scanner Component */}
          <BarcodeScanner onScan={handleBarcodeScanned} />

          {/* Live Sent Feedback */}
          {lastSentBarcode && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Enviado a tu computadora:</p>
                  <p className="font-mono text-sm font-black text-emerald-400">{lastSentBarcode}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
                Sincronizado
              </span>
            </div>
          )}

          {/* Scanned History List */}
          {scansSent.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Historial de la Sesión</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Total: {scansSent.length}
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {scansSent.map((s, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {scansSent.length - idx}
                      </span>
                      <span className="font-mono font-bold text-slate-800">{s.barcode}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
