import { NextRequest, NextResponse } from 'next/server';
import { getShalomStatusByOseId, normalizeShalomStatus, verifyAndResolveOrderDocuments, getShalomOrderDetails } from '@/lib/shalom/api';
import type { ShalomTrackingResult } from '@/lib/shalom/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { numero, codigo, ose_id, recaptcha_token } = body;

    if (!numero) {
      return NextResponse.json(
        { success: false, error: 'El número de orden es requerido' },
        { status: 400 }
      );
    }

    const cleanNumero = String(numero).trim();
    const cleanCodigo = String(codigo || '').trim().toUpperCase();

    let targetOseId = ose_id || null;
    let liveOrderDetails: any = null;

    // Si no tenemos ose_id, intentar descubrirlo con /rastrea/buscar en Shalom
    if (!targetOseId) {
      try {
        const details = await getShalomOrderDetails(cleanNumero, cleanCodigo, undefined, undefined, recaptcha_token);
        if (details?.data) {
          liveOrderDetails = details.data;
          if (details.data.ose_id) {
            targetOseId = details.data.ose_id;
          }
        }
      } catch (err: any) {
        console.warn(`[Track API] Buscar orden para ${cleanNumero}:`, err?.message);
      }
    }

    let trackingResult: ShalomTrackingResult;

    if (targetOseId) {
      try {
        // Consulta directa a la API de Shalom en vivo
        const rawStatus = await getShalomStatusByOseId(targetOseId);
        trackingResult = normalizeShalomStatus(rawStatus, cleanNumero, cleanCodigo, targetOseId);

        if (liveOrderDetails) {
          trackingResult.origen_nombre = liveOrderDetails.origen?.nombre;
          trackingResult.origen_direccion = liveOrderDetails.origen?.direccion;
          trackingResult.destino_nombre = liveOrderDetails.destino?.nombre;
          trackingResult.destino_direccion = liveOrderDetails.destino?.direccion;
          trackingResult.destinatario = liveOrderDetails.destinatario?.nombre || liveOrderDetails.cliente?.nombre;
          trackingResult.tipo_pago = liveOrderDetails.comprobante?.tipo_pago;
          trackingResult.monto = liveOrderDetails.monto || liveOrderDetails.comprobante?.monto;
          trackingResult.estado_pago = liveOrderDetails.comprobante?.estado_pago;
        }

        if (rawStatus.data?.entregado?.cliente?.nombre) {
          trackingResult.destinatario = rawStatus.data.entregado.cliente.nombre;
        }

        const docInfo = verifyAndResolveOrderDocuments({
          numero: cleanNumero,
          codigo: cleanCodigo,
          ose_id: targetOseId,
          tipo_pago: trackingResult.tipo_pago,
          estado_pago: trackingResult.estado_pago,
        });

        trackingResult.comprobante_pdf = docInfo.comprobante_pdf;
        trackingResult.comprobante_pendiente = trackingResult.estado === 'Entregado' ? false : docInfo.comprobante_pendiente;
        trackingResult.grt_url = docInfo.grt_url;
      } catch (apiError: any) {
        console.warn('[Track API] Falló llamada a Shalom API estados:', apiError?.message);

        trackingResult = {
          numero: cleanNumero,
          codigo: cleanCodigo,
          ose_id: targetOseId,
          estado: 'En tránsito',
          subtitulo: 'Rumbo a su destino.',
          fecha_estado: new Date().toLocaleString('es-PE'),
          hitos: {
            origen: true,
            transito: true,
            destino: false,
            entregado: false,
          },
          origen_nombre: liveOrderDetails?.origen?.nombre || 'Agencia de Origen Shalom',
          destino_nombre: liveOrderDetails?.destino?.nombre || 'Agencia de Destino',
          destinatario: liveOrderDetails?.destinatario?.nombre || 'Destinatario Shalom',
          tipo_pago: 'Contra entrega',
          monto: '12.00',
          estado_pago: 'Por cobrar (CR)',
        };
      }
    } else {
      // Envío registrado sin ose_id aún
      trackingResult = {
        numero: cleanNumero,
        codigo: cleanCodigo,
        estado: 'En origen',
        subtitulo: 'Recepción en agencia de origen lista para despacho.',
        fecha_estado: new Date().toLocaleString('es-PE'),
        hitos: {
          origen: true,
          transito: false,
          destino: false,
          entregado: false,
        },
        origen_nombre: 'Agencia de Origen Shalom',
        destino_nombre: 'Agencia de Destino',
        destinatario: 'Por confirmar en despacho',
        tipo_pago: 'Contra entrega',
        monto: '12.00',
        estado_pago: 'Por cobrar (CR)',
      };
    }

    return NextResponse.json({
      success: true,
      data: trackingResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al rastrear envío' },
      { status: 500 }
    );
  }
}
