'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Camera, 
  FlipHorizontal, 
  Zap, 
  ZapOff, 
  X, 
  AlertCircle, 
  RefreshCw,
  Barcode as BarcodeIcon,
  Maximize2
} from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string, format?: string) => void;
  onClose?: () => void;
  paused?: boolean;
}

// Crisp beep audio feedback using Web Audio API
function playSuccessBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1900, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

function triggerHaptic() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([60, 40, 60]);
    }
  } catch {
    // Ignore
  }
}

export function BarcodeScanner({ onScan, onClose, paused = false }: BarcodeScannerProps) {
  const scannerContainerId = useRef(`qr-reader-${Math.random().toString(36).substring(2, 9)}`);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scanCooldownRef = useRef<boolean>(false);

  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  // Stop scanner safely
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn('Failed to stop scanner:', err);
      }
    }
  }, []);

  // Handle successful scan
  const handleScanSuccess = useCallback((decodedText: string, result: any) => {
    if (paused || scanCooldownRef.current) return;

    const trimmed = decodedText.trim();
    if (!trimmed) return;

    // Set cooldown to prevent rapid multi-fires
    scanCooldownRef.current = true;
    setTimeout(() => {
      scanCooldownRef.current = false;
    }, 1500);

    setLastScanned(trimmed);
    playSuccessBeep();
    triggerHaptic();

    const formatName = result?.result?.format?.formatName || 'BARCODE';
    onScan(trimmed, formatName);
  }, [onScan, paused]);

  // Start scanner
  const startScanner = useCallback(async (cameraIdOrConfig: string | { facingMode: string | { ideal: string } }) => {
    setIsStarting(true);
    setErrorMessage(null);

    try {
      await stopScanner();

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId.current, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          }
        });
      }

      const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
        handleScanSuccess(decodedText, decodedResult);
      };

      const qrCodeErrorCallback = () => {
        // Continuous decoding frame errors are expected and ignored
      };

      // High-performance barcode configuration
      const config: any = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          // Optimized rectangular scanning zone for 1D barcodes (EAN-13, UPC, Code 128)
          const width = Math.min(Math.floor(viewfinderWidth * 0.88), 380);
          const height = Math.min(Math.floor(viewfinderHeight * 0.45), 180);
          return {
            width: Math.max(width, 240),
            height: Math.max(height, 120),
          };
        },
        videoConstraints: {
          facingMode: { ideal: 'environment' },
          width: { min: 640, ideal: 1920, max: 2560 },
          height: { min: 480, ideal: 1080, max: 1440 },
          focusMode: 'continuous',
          advanced: [{ focusMode: 'continuous' }]
        }
      };

      await html5QrCodeRef.current.start(
        cameraIdOrConfig,
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      );

      setIsScanning(true);

      // Check if torch/flashlight is supported
      try {
        const capabilities = html5QrCodeRef.current.getRunningTrackCapabilities();
        if ((capabilities as any)?.torch) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Error starting barcode scanner:', err);
      const msg = err?.message || '';
      if (msg.includes('Permission') || msg.includes('NotAllowedError')) {
        setErrorMessage('Permiso de cámara denegado. Por favor, permite el acceso a la cámara en los ajustes de tu navegador.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFoundError')) {
        setErrorMessage('No se encontró ninguna cámara disponible en este dispositivo.');
      } else {
        setErrorMessage('No se pudo acceder a la cámara. Verifica los permisos de tu navegador o asegúrate de usar HTTPS.');
      }
    } finally {
      setIsStarting(false);
    }
  }, [stopScanner, handleScanSuccess]);

  // Initial mount: list cameras & start with environment back camera
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (mounted && devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/rear camera on smartphones
          const backCamIndex = devices.findIndex((d) => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('trasera') ||
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('0, facing back')
          );
          const chosenIndex = backCamIndex >= 0 ? backCamIndex : 0;
          setCurrentCameraIndex(chosenIndex);
          await startScanner(devices[chosenIndex].id);
        } else if (mounted) {
          // Fallback to generic environment camera
          await startScanner({ facingMode: { ideal: 'environment' } });
        }
      } catch {
        if (mounted) {
          await startScanner({ facingMode: { ideal: 'environment' } });
        }
      }
    }

    init();

    return () => {
      mounted = false;
      if (html5QrCodeRef.current) {
        stopScanner().then(() => {
          try {
            html5QrCodeRef.current?.clear();
          } catch {
            // Ignore
          }
        });
      }
    };
  }, [startScanner, stopScanner]);

  // Toggle Torch/Flash
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      const nextTorch = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Switch camera (front / back)
  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await startScanner(cameras[nextIndex].id);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      
      {/* Scanner Top Bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wider text-white uppercase drop-shadow-md">
            Escáner Activo
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                torchOn 
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title="Linterna"
            >
              {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          {cameras.length > 1 && (
            <button
              type="button"
              onClick={switchCamera}
              className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all cursor-pointer"
              title="Cambiar Cámara"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="p-2.5 rounded-full bg-white/10 text-white hover:bg-rose-600 backdrop-blur-md transition-all cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Video Viewport Container */}
      <div className="relative w-full h-[320px] sm:h-[360px] bg-slate-950 flex items-center justify-center overflow-hidden">
        
        {/* html5-qrcode mounts here */}
        <div 
          id={scannerContainerId.current} 
          className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
        />

        {/* Viewfinder Target Graphic Overlay (Aligned to rectangular barcode shape) */}
        {isScanning && !errorMessage && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            
            {/* Viewfinder Box */}
            <div className="relative w-[85%] max-w-[360px] h-[150px] sm:h-[160px] rounded-2xl border-2 border-emerald-400/90 shadow-[0_0_30px_rgba(16,185,129,0.35)] backdrop-brightness-110">
              
              {/* Corner accents */}
              <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

              {/* Center guide mark */}
              <div className="absolute top-1/2 left-2 right-2 h-[1px] bg-emerald-400/30 -translate-y-1/2" />

              {/* Laser Scanning Animation Line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-[scan_2s_ease-in-out_infinite]" />
            </div>

            <p className="mt-4 text-[11px] font-bold text-white/95 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 tracking-wide shadow-md flex items-center gap-1.5">
              <BarcodeIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Coloca el código de barras horizontalmente</span>
            </p>
          </div>
        )}

        {/* Loading Spinner */}
        {isStarting && !errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs gap-3 z-10">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs font-semibold text-slate-300">Iniciando cámara HD...</p>
          </div>
        )}

        {/* Error Fallback Box */}
        {errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/95 text-center gap-4 z-20">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <h4 className="text-sm font-bold text-white">Acceso a Cámara Requerido</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => startScanner({ facingMode: { ideal: 'environment' } })}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info / Last Scanned Display */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>EAN-13, UPC, Code 128, QR</span>
        </div>
        {lastScanned && (
          <span className="font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/80 text-xs shadow-inner">
            ✓ {lastScanned}
          </span>
        )}
      </div>

      <style jsx global>{`
        #qr-shaded-region {
          display: none !important;
        }
        @keyframes scan {
          0%, 100% {
            top: 8%;
            opacity: 0.7;
          }
          50% {
            top: 88%;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
