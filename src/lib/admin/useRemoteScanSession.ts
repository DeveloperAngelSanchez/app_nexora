'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export interface ScannedBarcodePayload {
  barcode: string;
  format?: string;
  timestamp: number;
}

export function generateSessionCode(): string {
  const numbers = Math.floor(1000 + Math.random() * 9000);
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const prefix = letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)];
  return `${prefix}-${numbers}`;
}

export function getPersistentSessionCode(): string {
  if (typeof window === 'undefined') return 'NX-8888';
  const STORAGE_KEY = 'nexora_remote_scanner_session_code';
  try {
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || saved.length < 5) {
      saved = generateSessionCode();
      localStorage.setItem(STORAGE_KEY, saved);
    }
    return saved;
  } catch {
    return 'NX-8888';
  }
}

// Audio chime on desktop receipt
function playHostReceivedBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch {
    // Ignore audio restrictions
  }
}

// =========================================================================
// SINGLETON HOST CHANNEL MANAGER
// Prevents "cannot add callbacks after subscribe()" when multiple components mount
// =========================================================================
let singletonHostChannel: any = null;
let currentHostSessionCode = '';
const barcodeListeners = new Set<(data: ScannedBarcodePayload) => void>();
const presenceListeners = new Set<(connected: boolean) => void>();
let globalRecentScans: ScannedBarcodePayload[] = [];

function ensureHostChannel(sessionCode: string) {
  if (typeof window === 'undefined') return;
  const cleanCode = sessionCode.trim().toUpperCase();
  if (!cleanCode) return;

  // If already subscribed to this exact session code, reuse it
  if (singletonHostChannel && currentHostSessionCode === cleanCode) {
    return;
  }

  const supabase = createSupabaseBrowserClient();

  // Clean up previous channel if session code changed
  if (singletonHostChannel) {
    try {
      supabase.removeChannel(singletonHostChannel);
    } catch {}
    singletonHostChannel = null;
  }

  const channelName = `remote_scan_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  // Also clean up any lingering channel with this name in Supabase client
  try {
    const existing = supabase.getChannels().find(
      (c: any) => c.topic === `realtime:${channelName}`
    );
    if (existing) {
      supabase.removeChannel(existing);
    }
  } catch {}

  currentHostSessionCode = cleanCode;

  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { ack: true, self: true },
      presence: { key: 'host' },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const hasMobile = Object.values(state).some((presences: any) =>
        presences.some((p: any) => p.role === 'scanner')
      );
      presenceListeners.forEach((fn) => fn(hasMobile));
    })
    .on('broadcast', { event: 'barcode_scanned' }, (e: { payload: any }) => {
      if (!e.payload || !e.payload.barcode) return;
      const scanData: ScannedBarcodePayload = e.payload;

      playHostReceivedBeep();
      globalRecentScans = [scanData, ...globalRecentScans.filter((s) => s.barcode !== scanData.barcode).slice(0, 19)];

      barcodeListeners.forEach((fn) => fn(scanData));
    });

  channel.subscribe((status: string) => {
    if (status === 'SUBSCRIBED') {
      channel.track({ role: 'host', joinedAt: Date.now() }).catch(() => {});
    }
  });

  singletonHostChannel = channel;
}

/**
 * Host Hook (Desktop): Listens for incoming scans from paired mobile
 */
export function useRemoteScanHost(onBarcodeReceived?: (data: ScannedBarcodePayload) => void) {
  const [sessionCode, setSessionCode] = useState<string>('');
  const [isMobileConnected, setIsMobileConnected] = useState(false);
  const [recentScans, setRecentScans] = useState<ScannedBarcodePayload[]>(globalRecentScans);

  const callbackRef = useRef(onBarcodeReceived);
  useEffect(() => {
    callbackRef.current = onBarcodeReceived;
  }, [onBarcodeReceived]);

  const startSession = useCallback(() => {
    const code = getPersistentSessionCode();
    setSessionCode(code);
    ensureHostChannel(code);
    return code;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const code = getPersistentSessionCode();
    setSessionCode(code);
    ensureHostChannel(code);

    const barcodeHandler = (data: ScannedBarcodePayload) => {
      setRecentScans([...globalRecentScans]);
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    const presenceHandler = (connected: boolean) => {
      setIsMobileConnected(connected);
    };

    barcodeListeners.add(barcodeHandler);
    presenceListeners.add(presenceHandler);

    return () => {
      barcodeListeners.delete(barcodeHandler);
      presenceListeners.delete(presenceHandler);
    };
  }, []);

  return {
    sessionCode,
    startSession,
    isMobileConnected,
    recentScans,
  };
}

/**
 * Client Hook (Mobile Scanner): Connects to desktop session and broadcasts scans
 */
export function useRemoteScanClient(initialCode?: string) {
  const [sessionCode, setSessionCode] = useState<string>(initialCode || '');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scansSent, setScansSent] = useState<ScannedBarcodePayload[]>([]);
  const channelRef = useRef<any>(null);

  const connectToSession = useCallback(async (code: string) => {
    const formatted = code.trim().toUpperCase();
    if (!formatted) {
      setError('Por favor ingresa un código de sesión válido.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();

      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch {}
        channelRef.current = null;
      }

      const channelName = `remote_scan_${formatted.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      // Clean up any lingering channel with this name
      try {
        const existing = supabase.getChannels().find((c: any) => c.topic === `realtime:${channelName}`);
        if (existing) {
          supabase.removeChannel(existing);
        }
      } catch {}

      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { ack: true, self: true },
          presence: { key: 'scanner' },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const hasHost = Object.values(state).some((presences: any) =>
            presences.some((p: any) => p.role === 'host')
          );
          setIsConnected(hasHost || true);
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ role: 'scanner', joinedAt: Date.now() });
            setIsConnected(true);
            setIsConnecting(false);
            setSessionCode(formatted);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setError('No se pudo conectar a la sesión. Verifica el código.');
            setIsConnecting(false);
            setIsConnected(false);
          }
        });

      channelRef.current = channel;
    } catch (err: any) {
      setError(err?.message || 'Error al conectar con la sesión.');
      setIsConnecting(false);
    }
  }, []);

  const sendBarcode = useCallback(async (barcode: string, format?: string) => {
    if (!channelRef.current || !barcode) return false;

    const payload: ScannedBarcodePayload = {
      barcode: barcode.trim(),
      format: format || 'BARCODE',
      timestamp: Date.now(),
    };

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'barcode_scanned',
        payload,
      });

      setScansSent((prev) => [payload, ...prev.slice(0, 19)]);
      return true;
    } catch (err) {
      console.error('Failed to send barcode broadcast:', err);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      const supabase = createSupabaseBrowserClient();
      try {
        supabase.removeChannel(channelRef.current);
      } catch {}
      channelRef.current = null;
    }
    setIsConnected(false);
    setSessionCode('');
  }, []);

  useEffect(() => {
    if (initialCode) {
      connectToSession(initialCode);
    }
    return () => {
      if (channelRef.current) {
        const supabase = createSupabaseBrowserClient();
        try {
          supabase.removeChannel(channelRef.current);
        } catch {}
        channelRef.current = null;
      }
    };
  }, [initialCode, connectToSession]);

  return {
    sessionCode,
    isConnected,
    isConnecting,
    error,
    scansSent,
    connectToSession,
    sendBarcode,
    disconnect,
  };
}
