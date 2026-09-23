import { NextRequest, NextResponse } from 'next/server';
import { deleteShipment, getShalomShipmentById } from '@/lib/shalom/storage';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await getShalomShipmentById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Envío no encontrado' },
        { status: 404 }
      );
    }

    const success = await deleteShipment(id);

    return NextResponse.json({
      success,
      message: 'Envío eliminado correctamente de los registros.',
    });
  } catch (error: any) {
    console.error('[Delete Shipment API] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al eliminar el envío' },
      { status: 500 }
    );
  }
}
