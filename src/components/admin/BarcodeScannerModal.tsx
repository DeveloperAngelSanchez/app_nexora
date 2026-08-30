'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Camera, 
  Smartphone, 
  Keyboard, 
  X, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Search, 
  Loader2, 
  Wifi, 
  WifiOff, 
  ArrowRight,
  Plus,
  Monitor,
  Copy
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRemoteScanHost, ScannedBarcodePayload } from '@/lib/admin/useRemoteScanSession';
import { findProductByBarcode } from '@/lib/admin/products';

const BarcodeScanner = dynamic(
  () => import('./BarcodeScanner').then((mod) => mod.BarcodeScanner),
  { ssr: false }
);

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBarcode?: (barcode: string) => void;
  autoRedirect?: boolean;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onSelectBarcode,
  autoRedirect = true,
}: BarcodeScannerModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'camera' | 'remote' | 'manual'>('remote');
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    barcode: string;
    found: boolean;
    product?: any;
  } | null>(null);

  // Detect if user is on mobile/tablet vs desktop
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
        (window.innerWidth < 768 && 'ontouchstart' in window);
      setIsMobileDevice(isMobile);
      // If mobile, default to direct phone camera; if desktop, default to remote phone pairing
      setActiveTab(isMobile ? 'camera' : 'remote');
    }
  }, [isOpen]);

  // Host Remote Pairing Hook
  const { sessionCode, startSession, isMobileConnected, recentScans } = useRemoteScanHost(
    (scanData: ScannedBarcodePayload) => {
      handleBarcodeDetected(scanData.barcode);
    }
  );

  // Auto start remote session when modal is open and on remote tab
  useEffect(() => {
    if (isOpen && activeTab === 'remote' && !sessionCode) {
      startSession();
    }
  }, [isOpen, activeTab, sessionCode, startSession]);

  if (!isOpen) return null;

  // Process barcode (detect if already in DB or new)
  const handleBarcodeDetected = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    if (onSelectBarcode) {
      onSelectBarcode(trimmed);
      onClose();
      return;
    }

    setIsSearching(true);
    try {
      const product = await findProductByBarcode(trimmed);
      if (product) {
        setSearchResult({ barcode: trimmed, found: true, product });
        if (autoRedirect) {
          router.push(`/nxd-92f/productos/${product.id}/editar`);
          onClose();
        }
      } else {
        setSearchResult({ barcode: trimmed, found: false });
        if (autoRedirect) {
          router.push(`/nxd-92f/productos/nuevo?barcode=${encodeURIComponent(trimmed)}`);
          onClose();
        }
      }
    } catch (err) {
      console.error('Error querying barcode:', err);
      if (autoRedirect) {
        router.push(`/nxd-92f/productos/nuevo?barcode=${encodeURIComponent(trimmed)}`);
        onClose();
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleBarcodeDetected(manualCode.trim());
    }
  };

  // Base URL for mobile scanner QR code pairing
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const mobileScannerUrl = sessionCode
    ? `${currentOrigin}/nxd-92f/scanner?session=${sessionCode}`
    : '';

  const copyPairingUrl = () => {
    if (mobileScannerUrl && navigator.clipboard) {
      navigator.clipboard.writeText(mobileScannerUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Escáner de Códigos de Barra</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isMobileDevice 
                  ? 'Usa la cámara de tu smartphone para registrar productos al instante' 
                  : 'Escanea productos usando tu teléfono como lector inalámbrico'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex p-2 bg-slate-100/70 border-b border-slate-200/60 gap-1.5 text-xs font-bold">
          
          {/* Mobile view shows Direct Camera first */}
          {isMobileDevice ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Cámara Móvil</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Keyboard className="w-4 h-4 text-emerald-600" />
                <span>Manual</span>
              </button>
            </>
          ) : (
            /* Desktop view defaults to Remote Smartphone sync & Manual */
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('remote');
                  if (!sessionCode) startSession();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'remote'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>📱 Vincular Celular</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full uppercase font-mono font-bold tracking-tight">
                  Auto
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Keyboard className="w-4 h-4 text-emerald-600" />
                <span>Pistola / Manual</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl transition-all cursor-pointer text-xs ${
                  activeTab === 'camera'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Usar cámara web de la computadora"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="text-[11px]">Webcam PC</span>
              </button>
            </>
          )}

        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center">
          
          {/* TAB 1: Direct Camera (Only mounted when activeTab is camera) */}
          {activeTab === 'camera' && (
            <div className="w-full space-y-4">
              <BarcodeScanner onScan={handleBarcodeDetected} />
              <p className="text-center text-[11px] text-slate-400 font-medium">
                Centra el código de barras en el recuadro horizontal. Se detectará automáticamente en alta definición.
              </p>
            </div>
          )}

          {/* TAB 2: Remote Scanner (Desktop + Phone Cross-Device Sync) */}
          {activeTab === 'remote' && (
            <div className="w-full space-y-6 text-center">
              
              {/* Connection Status Indicator */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors shadow-2xs">
                {isMobileConnected ? (
                  <span className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border-emerald-200">
                    <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>📱 Teléfono Conectado en Tiempo Real</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-amber-700 bg-amber-50 border-amber-200">
                    <WifiOff className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                    <span>Esperando escaneo con la cámara de tu celular...</span>
                  </span>
                )}
              </div>

              {/* QR Code & Code Display Box */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 max-w-sm mx-auto space-y-4 shadow-xs">
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 inline-block shadow-xs">
                  {mobileScannerUrl ? (
                    <QRCodeSVG
                      value={mobileScannerUrl}
                      size={180}
                      level="M"
                      includeMargin={false}
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium">
                    1. Abre la cámara de tu iPhone / Android y apunta al QR
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-xl font-black font-mono tracking-widest text-emerald-600 bg-white px-4 py-1.5 rounded-xl border border-slate-200">
                      {sessionCode || '...'}
                    </p>
                    <button
                      type="button"
                      onClick={copyPairingUrl}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 transition-colors shadow-2xs cursor-pointer text-xs flex items-center gap-1 font-semibold"
                      title="Copiar enlace"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-md mx-auto">
                <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">1. Apunta al QR</span>
                  <p className="text-xs font-semibold text-slate-800">Con tu móvil</p>
                  <p className="text-[10px] text-slate-400">Se abrirá el escáner HD en tu celular</p>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">2. Escanea productos</span>
                  <p className="text-xs font-semibold text-slate-800">Caja / empaque</p>
                  <p className="text-[10px] text-slate-400">Pasa los códigos de barra por el teléfono</p>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">3. En tu PC</span>
                  <p className="text-xs font-semibold text-slate-800">Carga automática</p>
                  <p className="text-[10px] text-slate-400">Aparecerán aquí sin tocar el teclado</p>
                </div>
              </div>

              {/* Realtime Scans Feed */}
              {recentScans.length > 0 && (
                <div className="pt-2 text-left space-y-2 max-w-md mx-auto">
                  <p className="text-xs font-bold text-slate-700">Códigos recibidos desde tu celular:</p>
                  <div className="flex flex-wrap gap-2">
                    {recentScans.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs font-bold animate-in fade-in"
                      >
                        ✓ {s.barcode}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Manual Input */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="w-full max-w-sm space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-700">
                  Código de Barras (EAN, UPC, SKU)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="ej. 6941876235124"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400">
                  Compatible con pistolas lectoras USB / Bluetooth o teclado directo.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSearching || !manualCode.trim()}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-5 rounded-2xl text-xs transition-all shadow-xs cursor-pointer"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Procesar Código</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Result Alert / Feedback when not autoRedirect */}
          {searchResult && !autoRedirect && (
            <div className="mt-6 w-full p-4 rounded-2xl border bg-slate-50 border-slate-200 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">
                  Código: <span className="font-mono text-emerald-600">{searchResult.barcode}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  {searchResult.found
                    ? `Producto existente: ${searchResult.product?.name}`
                    : 'Código nuevo (no registrado aún en el catálogo)'}
                </p>
              </div>

              {searchResult.found ? (
                <button
                  onClick={() => router.push(`/nxd-92f/productos/${searchResult.product?.id}/editar`)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                >
                  Editar
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/nxd-92f/productos/nuevo?barcode=${encodeURIComponent(searchResult.barcode)}`)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear</span>
                </button>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
