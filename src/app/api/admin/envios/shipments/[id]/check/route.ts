import { NextRequest, NextResponse } from 'next/server';
import { getShalomShipmentById, saveOrUpdateShipment, getShalomConnection } from '@/lib/shalom/storage';
import { getShalomStatusByOseId, normalizeShalomStatus } from '@/lib/shalom/api';

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

    if (shipment.ose_id) {
      try {
        const raw = await getShalomStatusByOseId(shipment.ose_id, authToken);
        const norm = normalizeShalomStatus(raw, shipment.numero, shipment.codigo, shipment.ose_id);
        updatedEstado = norm.estado;
        updatedSubtitulo = norm.subtitulo;
        if (norm.fecha_estado) updatedFecha = norm.fecha_estado;
        if (norm.carguero) updatedCarguero = norm.carguero;
      } catch (err: any) {
        console.warn(`[Check API] Falló llamada en vivo para ${shipment.numero}:`, err?.message);
      }
    }

    // Actualizar siempre con la hora exacta de la consulta actual
    const updated = saveOrUpdateShipment({
      ...shipment,
      estado: updatedEstado,
      subtitulo: updatedSubtitulo,
      fecha_estado: updatedFecha,
      carguero: updatedCarguero,
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
