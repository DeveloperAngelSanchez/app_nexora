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

/**
 * Host Hook (Desktop): Creates session, listens for incoming scans from paired mobile
 */
export function useRemoteScanHost(onBarcodeReceived?: (data: ScannedBarcodePayload) => void) {
  const [sessionCode, setSessionCode] = useState<string>('');
  const [isMobileConnected, setIsMobileConnected] = useState(false);
  const [recentScans, setRecentScans] = useState<ScannedBarcodePayload[]>([]);
  const supabase = createSupabaseBrowserClient();
  const channelRef = useRef<any>(null);

  const startSession = useCallback(() => {
    const code = generateSessionCode();
    setSessionCode(code);
    return code;
  }, []);

  useEffect(() => {
    if (!sessionCode) return;

    const channelName = `remote_scan_${sessionCode.toLowerCase()}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true, self: false },
        presence: { key: 'host' },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const clients = Object.keys(state);
        // Check if a scanner/mobile client is present
        const hasMobile = Object.values(state).some((presences: any) =>
          presences.some((p: any) => p.role === 'scanner')
        );
        setIsMobileConnected(hasMobile);
      })
      .on('broadcast', { event: 'barcode_scanned' }, ({ payload }) => {
        const scanData: ScannedBarcodePayload = payload;
        setRecentScans((prev) => [scanData, ...prev.slice(0, 19)]);
        if (onBarcodeReceived) {
          onBarcodeReceived(scanData);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ role: 'host', joinedAt: Date.now() });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionCode, onBarcodeReceived, supabase]);

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
  const supabase = createSupabaseBrowserClient();
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
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      const channelName = `remote_scan_${formatted.toLowerCase()}`;
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { ack: true, self: false },
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
        .subscribe(async (status) => {
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
  }, [supabase]);

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
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsConnected(false);
    setSessionCode('');
  }, [supabase]);

  useEffect(() => {
    if (initialCode) {
      connectToSession(initialCode);
    }
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [initialCode, connectToSession, supabase]);

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
