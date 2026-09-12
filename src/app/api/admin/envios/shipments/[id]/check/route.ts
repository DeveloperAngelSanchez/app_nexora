import { NextRequest, NextResponse } from 'next/server';
import { getShalomShipmentById, saveOrUpdateShipment, getShalomConnection } from '@/lib/shalom/storage';
import { getShalomStatusByOseId, normalizeShalomStatus, verifyAndResolveOrderDocuments, getShalomOrderDetails, getShalomVoucher } from '@/lib/shalom/api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const shipment = getShalomShipmentById(id);

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Envío no encontrado' },
        { status: 404 }
      );
    }

    const connection = getShalomConnection();
    const authToken = connection.is_connected ? connection.auth_token : undefined;

    let updatedEstado = shipment.estado;
    let updatedSubtitulo = shipment.subtitulo;
    let updatedFecha = shipment.fecha_estado;
    let updatedCarguero = shipment.carguero;

    // Resolver documentos legítimos y sanear enlaces cruzados
    let docInfo = verifyAndResolveOrderDocuments({
      numero: shipment.numero,
      codigo: shipment.codigo,
      ose_id: shipment.ose_id,
      tipo_pago: shipment.tipo_pago,
      estado_pago: shipment.estado_pago,
      comprobante_pdf: shipment.comprobante_pdf,
      grt_url: shipment.grt_url,
    });

    if (shipment.ose_id) {
      try {
        const raw = await getShalomStatusByOseId(shipment.ose_id, authToken);
        const norm = normalizeShalomStatus(raw, shipment.numero, shipment.codigo, shipment.ose_id);
        updatedEstado = norm.estado;
        updatedSubtitulo = norm.subtitulo;
        if (norm.fecha_estado) updatedFecha = norm.fecha_estado;
        if (norm.carguero) updatedCarguero = norm.carguero;

        // Si tenemos sesión activa de Shalom, verificar si ya se emitió el comprobante oficial
        if (authToken) {
          try {
            const details = await getShalomOrderDetails(shipment.numero, shipment.codigo, shipment.ose_id, authToken);
            if (details?.data?.comprobante && !details.data.comprobante.pendiente) {
              const comp = details.data.comprobante;
              const voucherRes = await getShalomVoucher({ serie: comp.serie, numero: comp.numero, cop_id: comp.cop_id }, authToken);
              if (voucherRes.success && voucherRes.data?.pdf) {
                docInfo.comprobante_pdf = voucherRes.data.pdf;
                docInfo.comprobante_pendiente = false;
              }
            }
          } catch (detailsErr) {
            // Silencioso si no tiene permisos o endpoint no responde
          }
        }
      } catch (err: any) {
        console.warn(`[Check API] Falló llamada en vivo para ${shipment.numero}:`, err?.message);
      }
    }

    // Actualizar siempre con la hora exacta de la consulta actual y los documentos verificados en la BD
    const updated = saveOrUpdateShipment({
      ...shipment,
      estado: updatedEstado,
      subtitulo: updatedSubtitulo,
      fecha_estado: updatedFecha,
      carguero: updatedCarguero,
      comprobante_pdf: docInfo.comprobante_pdf,
      comprobante_pendiente: docInfo.comprobante_pendiente,
      grt_url: docInfo.grt_url,
      last_checked_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      shipment: updated,
    });
  } catch (error: any) {
    console.error('[Check API] Error al actualizar estado:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al actualizar estado del envío' },
      { status: 500 }
    );
  }
}
