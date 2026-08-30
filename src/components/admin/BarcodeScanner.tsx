'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { prepareZXingModule, readBarcodesFromImageData } from 'zxing-wasm/reader';
import { 
  Camera, 
  FlipHorizontal, 
  Zap, 
  ZapOff, 
  X, 
  AlertCircle, 
  RefreshCw,
  Barcode as BarcodeIcon,
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

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
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
      navigator.vibrate([80, 50, 80]);
    }
  } catch {
    // Ignore
  }
}

let wasmModuleInitialized = false;
async function initZXingWasm() {
  if (wasmModuleInitialized) return;
  try {
    await prepareZXingModule({
      overrides: {
        locateFile: (path: string, prefix: string) => {
          if (path.endsWith('.wasm')) {
            return '/wasm/' + path;
          }
          return prefix + path;
        },
      },
    });
    wasmModuleInitialized = true;
  } catch (err) {
    console.warn('Local WASM init fallback to CDN:', err);
    // zxing-wasm will fall back to its internal CDN
  }
}

export function BarcodeScanner({ onScan, onClose, paused = false }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const scanCooldownRef = useRef<boolean>(false);
  const isDecodingRef = useRef<boolean>(false);

  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<{ deviceId: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  // Stop camera media stream safely
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  // Handle successful scan
  const handleScanSuccess = useCallback((decodedText: string, formatName: string) => {
    if (paused || scanCooldownRef.current) return;

    const trimmed = decodedText.trim();
    if (!trimmed) return;

    // Set cooldown to prevent rapid multi-fires
    scanCooldownRef.current = true;
    setTimeout(() => {
      scanCooldownRef.current = false;
    }, 1800);

    setLastScanned(trimmed);
    playSuccessBeep();
    triggerHaptic();

    onScan(trimmed, formatName);
  }, [onScan, paused]);

  // Frame processing loop using WebAssembly ZXing engine
  const startDecodeLoop = useCallback(() => {
    let lastScanTime = 0;
    const SCAN_INTERVAL_MS = 75; // ~13 FPS processing rate (optimal for WASM without overheating mobile)

    const tick = async (timestamp: number) => {
      if (!videoRef.current || !canvasRef.current) {
        animationFrameId.current = requestAnimationFrame(tick);
        return;
      }

      const video = videoRef.current;
      if (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        !video.paused &&
        !scanCooldownRef.current &&
        !isDecodingRef.current &&
        timestamp - lastScanTime >= SCAN_INTERVAL_MS
      ) {
        lastScanTime = timestamp;
        isDecodingRef.current = true;

        try {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (ctx) {
            // Keep resolution balanced for ultra-fast C++ WASM decoding
            const maxDimension = 1080;
            let targetWidth = video.videoWidth;
            let targetHeight = video.videoHeight;

            if (targetWidth > maxDimension || targetHeight > maxDimension) {
              if (targetWidth > targetHeight) {
                targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
                targetWidth = maxDimension;
              } else {
                targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
                targetHeight = maxDimension;
              }
            }

            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
              canvas.width = targetWidth;
              canvas.height = targetHeight;
            }

            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

            // Execute WASM barcode reader with full rotational & adaptive contrast search
            const results = await readBarcodesFromImageData(imageData, {
              formats: [
                'EAN13',
                'EAN8',
                'UPCA',
                'UPCE',
                'Code128',
                'Code39',
                'Code93',
                'ITF',
                'QRCode',
                'DataMatrix',
              ],
              tryHarder: true,
              tryRotate: true,
              tryInvert: true,
              tryDownscale: true,
              binarizer: 'LocalAverage',
            });

            if (results && results.length > 0) {
              const detected = results[0];
              if (detected.text) {
                handleScanSuccess(detected.text, detected.format || 'BARCODE');
              }
            }
          }
        } catch (err) {
          // Frame read errors during motion or blur are normal and ignored
        } finally {
          isDecodingRef.current = false;
        }
      }

      animationFrameId.current = requestAnimationFrame(tick);
    };

    animationFrameId.current = requestAnimationFrame(tick);
  }, [handleScanSuccess]);

  // Start Camera Stream
  const startCamera = useCallback(async (deviceId?: string) => {
    setIsStarting(true);
    setErrorMessage(null);
    stopCamera();

    try {
      await initZXingWasm();

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceId
          ? {
              deviceId: { exact: deviceId },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);

      // Check for torch capability
      try {
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities: any = videoTrack?.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch {
        setHasTorch(false);
      }

      // Populate available camera list
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter((d) => d.kind === 'videoinput')
          .map((d, index) => ({
            deviceId: d.deviceId,
            label: d.label || `Cámara ${index + 1}`,
          }));
        setCameras(videoDevices);
      } catch {
        // Ignore enumerate error
      }

      // Start decoding loop
      startDecodeLoop();
    } catch (err: any) {
      console.error('Error opening camera:', err);
      const msg = err?.message || '';
      if (msg.includes('Permission') || msg.includes('NotAllowedError') || err.name === 'NotAllowedError') {
        setErrorMessage('Permiso de cámara denegado. Por favor, permite el acceso a la cámara en los ajustes de Safari/Chrome.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFoundError') || err.name === 'NotFoundError') {
        setErrorMessage('No se encontró ninguna cámara disponible en este dispositivo.');
      } else {
        setErrorMessage('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
      }
    } finally {
      setIsStarting(false);
    }
  }, [stopCamera, startDecodeLoop]);

  // Initial mount
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const nextTorch = !torchOn;
        await (videoTrack as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setTorchOn(nextTorch);
      }
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Switch camera (front / back / ultra-wide)
  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await startCamera(cameras[nextIndex].deviceId);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      
      {/* Scanner Top Bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wider text-white uppercase drop-shadow-md">
            Escáner HD Activo (WASM)
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
                stopCamera();
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
        
        {/* Direct HTML5 Video Stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover"
        />

        {/* Hidden Processing Canvas for WASM frame extraction */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder Target Graphic Overlay */}
        {isScanning && !errorMessage && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            
            {/* Viewfinder Box */}
            <div className="relative w-[85%] max-w-[360px] h-[150px] sm:h-[160px] rounded-2xl border-2 border-emerald-400/90 shadow-[0_0_30px_rgba(16,185,129,0.35)] backdrop-brightness-110">
              
              {/* Corner accents */}
              <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

              {/* Laser Scanning Animation Line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-[scan_2s_ease-in-out_infinite]" />
            </div>

            <div className="mt-4 flex flex-col items-center gap-1">
              <p className="text-[11px] font-bold text-white/95 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 tracking-wide shadow-md flex items-center gap-1.5">
                <BarcodeIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Apunta al código (Detección en 360°)</span>
              </p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isStarting && !errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs gap-3 z-10">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs font-semibold text-slate-300">Iniciando motor WASM HD...</p>
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
              onClick={() => startCamera()}
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
          <span>EAN-13, UPC, Code 128, QR (WASM)</span>
        </div>
        {lastScanned && (
          <span className="font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/80 text-xs shadow-inner">
            ✓ {lastScanned}
          </span>
        )}
      </div>

      <style jsx global>{`
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
