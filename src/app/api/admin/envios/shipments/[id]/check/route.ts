import { NextRequest, NextResponse } from 'next/server';
import { getShalomShipmentById, saveOrUpdateShipment, getShalomConnection } from '@/lib/shalom/storage';
import { getShalomStatusByOseId, normalizeShalomStatus, verifyAndResolveOrderDocuments, getShalomOrderDetails, getShalomVoucher } from '@/lib/shalom/api';
import { KNOWN_SHALOM_ORDERS } from '@/lib/shalom/known-orders';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const shipment = await getShalomShipmentById(id);

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Envío no encontrado' },
        { status: 404 }
      );
    }

    const connection = await getShalomConnection();
    const authToken = connection.is_connected ? connection.auth_token : undefined;

    const known = KNOWN_SHALOM_ORDERS[shipment.numero];
    let targetOseId = shipment.ose_id || known?.ose_id || null;

    let updatedEstado = known?.estado || shipment.estado;
    let updatedSubtitulo = known?.subtitulo || shipment.subtitulo;
    let updatedFecha = known?.fecha_estado || shipment.fecha_estado;
    let updatedCarguero = shipment.carguero;
    let updatedDestinatario = (shipment.destinatario && shipment.destinatario !== 'Cliente Nexora')
      ? shipment.destinatario
      : (known?.destinatario || shipment.destinatario);
    let updatedOrigenNombre = shipment.origen_nombre === 'Agencia Registrada' ? (known?.origen_nombre || shipment.origen_nombre) : shipment.origen_nombre;
    let updatedDestinoNombre = shipment.destino_nombre === 'Agencia de Destino' ? (known?.destino_nombre || shipment.destino_nombre) : shipment.destino_nombre;
    let updatedEstadoPago = known?.estado_pago || shipment.estado_pago;

    // Resolver documentos legítimos y sanear enlaces cruzados
    let docInfo = verifyAndResolveOrderDocuments({
      numero: shipment.numero,
      codigo: shipment.codigo,
      ose_id: targetOseId || undefined,
      tipo_pago: known?.tipo_pago || shipment.tipo_pago,
      estado_pago: updatedEstadoPago,
      comprobante_pdf: known?.comprobante_pdf || shipment.comprobante_pdf,
      grt_url: known?.grt_url || shipment.grt_url,
    });

    if (targetOseId) {
      try {
        const raw = await getShalomStatusByOseId(targetOseId, authToken);
        const norm = normalizeShalomStatus(raw, shipment.numero, shipment.codigo, targetOseId);
        updatedEstado = norm.estado;
        updatedSubtitulo = norm.subtitulo;
        if (norm.fecha_estado) updatedFecha = norm.fecha_estado;
        if (norm.carguero) updatedCarguero = norm.carguero;

        // Si Shalom devuelve el nombre del cliente que recibió el paquete
        if (raw.data?.entregado?.cliente?.nombre) {
          updatedDestinatario = raw.data.entregado.cliente.nombre;
        }

        // Si tenemos sesión activa de Shalom, verificar si ya se emitió el comprobante oficial
        if (authToken) {
          try {
            const details = await getShalomOrderDetails(shipment.numero, shipment.codigo, targetOseId, authToken);
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
    const updated = await saveOrUpdateShipment({
      ...shipment,
      ose_id: targetOseId || undefined,
      estado: updatedEstado,
      subtitulo: updatedSubtitulo,
      fecha_estado: updatedFecha,
      carguero: updatedCarguero,
      destinatario: updatedDestinatario,
      origen_nombre: updatedOrigenNombre,
      destino_nombre: updatedDestinoNombre,
      estado_pago: updatedEstadoPago,
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
