'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export interface ScannedBarcodePayload {
  barcode: string;
  format?: string;
  timestamp: number;
}

export function generateSessionCode(): string {
  // Generate easily readable 6-character code (e.g. NX-4821)
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

// Crisp host receiver beep
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
    // Ignore audio autoplay limitations
  }
}

/**
 * Host Hook (Desktop): Creates/maintains persistent session, listens for incoming scans from paired mobile
 */
export function useRemoteScanHost(onBarcodeReceived?: (data: ScannedBarcodePayload) => void) {
  const [sessionCode, setSessionCode] = useState<string>('');
  const [isMobileConnected, setIsMobileConnected] = useState(false);
  const [recentScans, setRecentScans] = useState<ScannedBarcodePayload[]>([]);
  const channelRef = useRef<any>(null);
  
  // Keep callback reference updated without triggering channel recreation
  const onBarcodeReceivedRef = useRef(onBarcodeReceived);
  useEffect(() => {
    onBarcodeReceivedRef.current = onBarcodeReceived;
  }, [onBarcodeReceived]);

  const startSession = useCallback(() => {
    const code = getPersistentSessionCode();
    setSessionCode(code);
    return code;
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const code = getPersistentSessionCode();
    setSessionCode(code);
  }, []);

  useEffect(() => {
    if (!sessionCode) return;

    const supabase = createSupabaseBrowserClient();
    const cleanCode = sessionCode.trim().toUpperCase();
    const channelName = `remote_scan_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

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
        setIsMobileConnected(hasMobile);
      })
      .on('broadcast', { event: 'barcode_scanned' }, (e: { payload: any }) => {
        if (!e.payload || !e.payload.barcode) return;
        const scanData: ScannedBarcodePayload = e.payload;
        
        playHostReceivedBeep();
        setRecentScans((prev) => [scanData, ...prev.filter(s => s.barcode !== scanData.barcode).slice(0, 19)]);
        
        if (onBarcodeReceivedRef.current) {
          onBarcodeReceivedRef.current(scanData);
        }
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ role: 'host', joinedAt: Date.now() });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionCode]);

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
        await supabase.removeChannel(channelRef.current);
      }

      const channelName = `remote_scan_${formatted.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
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
      supabase.removeChannel(channelRef.current);
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
        supabase.removeChannel(channelRef.current);
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
