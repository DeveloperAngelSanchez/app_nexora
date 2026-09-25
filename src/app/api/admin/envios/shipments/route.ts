import { NextRequest, NextResponse } from 'next/server';
import { getShalomShipments, saveOrUpdateShipment, getShalomConnection } from '@/lib/shalom/storage';
import { 
  getShalomStatusByOseId, 
  normalizeShalomStatus, 
  verifyAndResolveOrderDocuments,
  getShalomOrderDetails 
} from '@/lib/shalom/api';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    let shipments = await getShalomShipments();
    const connection = await getShalomConnection();
    const authToken = connection.is_connected ? connection.auth_token : undefined;

    // Sincronización proactiva en vivo para envíos activos
    const now = Date.now();
    const activeShipments = shipments.filter((s) => s.estado !== 'Entregado' && s.ose_id);

    if (activeShipments.length > 0) {
      const syncTasks = activeShipments.map(async (s) => {
        const lastChecked = s.last_checked_at ? new Date(s.last_checked_at).getTime() : 0;
        if (now - lastChecked > 30000 || !s.last_checked_at) {
          try {
            const raw = await getShalomStatusByOseId(s.ose_id!, authToken);
            const norm = normalizeShalomStatus(raw, s.numero, s.codigo, s.ose_id);
            const docInfo = verifyAndResolveOrderDocuments({
              numero: s.numero,
              codigo: s.codigo,
              ose_id: s.ose_id,
              tipo_pago: s.tipo_pago,
              estado_pago: s.estado_pago,
              comprobante_pdf: s.comprobante_pdf,
              grt_url: s.grt_url,
            });

            let liveDest = s.destinatario;
            if (raw.data?.entregado?.cliente?.nombre) {
              liveDest = raw.data.entregado.cliente.nombre;
            }

            await saveOrUpdateShipment({
              ...s,
              estado: norm.estado,
              subtitulo: norm.subtitulo,
              fecha_estado: norm.fecha_estado || s.fecha_estado,
              carguero: norm.carguero || s.carguero,
              destinatario: liveDest,
              comprobante_pdf: docInfo.comprobante_pdf,
              comprobante_pendiente: norm.estado === 'Entregado' ? false : docInfo.comprobante_pendiente,
              grt_url: docInfo.grt_url,
              last_checked_at: new Date().toISOString(),
            });
          } catch {
            // Si la llamada externa falla temporalmente, se mantiene el estado persistido
          }
        }
      });

      await Promise.allSettled(syncTasks);
      shipments = await getShalomShipments();
    }

    return NextResponse.json(
      { success: true, shipments, connection },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al obtener envíos' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { numero, codigo, order_id, order_number, recaptcha_token } = body;

    if (!numero || !codigo) {
      return NextResponse.json(
        { success: false, error: 'Número de orden y código son obligatorios' },
        { status: 400 }
      );
    }

    const cleanNumero = String(numero).trim();
    const cleanCodigo = String(codigo).trim().toUpperCase();

    // 1. Resolver orden asociada en Nexora si existe
    let resolvedOrderId = order_id || null;
    let linkedOrderCustomerName: string | undefined;
    let linkedOrderAddress: string | undefined;
    const adminSb = createSupabaseAdminClient();

    if (!resolvedOrderId && order_number) {
      try {
        const cleanOrdNum = String(order_number).trim().toUpperCase();
        const { data: matchedOrder } = await adminSb
          .from('orders')
          .select('id, customer_name, shipping_address')
          .eq('order_number', cleanOrdNum)
          .maybeSingle();

        if (matchedOrder?.id) {
          resolvedOrderId = matchedOrder.id;
          linkedOrderCustomerName = matchedOrder.customer_name;
          linkedOrderAddress = matchedOrder.shipping_address;
        }
      } catch (ordLookupErr) {
        console.warn('Error resolviendo order_number:', ordLookupErr);
      }
    } else if (resolvedOrderId) {
      try {
        const { data: ord } = await adminSb
          .from('orders')
          .select('customer_name, shipping_address')
          .eq('id', resolvedOrderId)
          .maybeSingle();

        if (ord) {
          linkedOrderCustomerName = ord.customer_name;
          linkedOrderAddress = ord.shipping_address;
        }
      } catch (ordErr) {
        console.warn('Error obteniendo datos de orden:', ordErr);
      }
    }

    const connection = await getShalomConnection();
    const authToken = connection.is_connected ? connection.auth_token : undefined;

    let targetOseId: string | number | null = null;
    let liveOrderDetails: any = null;

    // 2. Consultar detalles de la orden en vivo con Shalom API
    try {
      const details = await getShalomOrderDetails(
        cleanNumero,
        cleanCodigo,
        undefined,
        authToken,
        recaptcha_token
      );

      if (details?.data) {
        liveOrderDetails = details.data;
        if (details.data.ose_id) {
          targetOseId = details.data.ose_id;
        }
      }
    } catch (err: any) {
      console.warn('[Register Shipment] Consulta inicial a Shalom API:', err?.message);
    }

    let shipmentData: any;

    if (targetOseId) {
      try {
        const raw = await getShalomStatusByOseId(targetOseId, authToken);
        const norm = normalizeShalomStatus(raw, cleanNumero, cleanCodigo, targetOseId);

        const liveDestinatario = 
          raw.data?.entregado?.cliente?.nombre || 
          liveOrderDetails?.destinatario?.nombre || 
          liveOrderDetails?.destinatario || 
          liveOrderDetails?.cliente?.nombre || 
          linkedOrderCustomerName || 
          'Por confirmar en despacho';

        const liveOrigenNombre = liveOrderDetails?.origen?.nombre || 'Agencia de Origen Shalom';
        const liveOrigenDireccion = liveOrderDetails?.origen?.direccion || undefined;
        const liveDestinoNombre = liveOrderDetails?.destino?.nombre || 'Agencia de Destino';
        const liveDestinoDireccion = liveOrderDetails?.destino?.direccion || linkedOrderAddress || undefined;

        const liveTipoPago = liveOrderDetails?.comprobante?.tipo_pago || 'Contra entrega';
        const liveEstadoPago = liveOrderDetails?.comprobante?.estado_pago || (norm.estado === 'Entregado' ? 'Pagado' : 'Por cobrar (CR)');
        const liveMonto = liveOrderDetails?.monto || liveOrderDetails?.comprobante?.monto || '12.00';

        const docInfo = verifyAndResolveOrderDocuments({
          numero: cleanNumero,
          codigo: cleanCodigo,
          ose_id: targetOseId,
          tipo_pago: liveTipoPago,
          estado_pago: liveEstadoPago,
          grt_url: liveOrderDetails?.grt_url,
        });

        shipmentData = {
          order_id: resolvedOrderId,
          numero: cleanNumero,
          codigo: cleanCodigo,
          ose_id: targetOseId,
          estado: norm.estado,
          subtitulo: norm.subtitulo,
          fecha_estado: norm.fecha_estado || new Date().toLocaleString('es-PE'),
          origen_nombre: liveOrigenNombre,
          origen_direccion: liveOrigenDireccion,
          destino_nombre: liveDestinoNombre,
          destino_direccion: liveDestinoDireccion,
          destinatario: liveDestinatario,
          comprobante_pdf: docInfo.comprobante_pdf,
          comprobante_pendiente: norm.estado === 'Entregado' ? false : docInfo.comprobante_pendiente,
          grt_url: docInfo.grt_url,
          carguero: norm.carguero,
          fecha_envio: liveOrderDetails?.fecha_emision || new Date().toISOString(),
          tipo_pago: liveTipoPago,
          monto: liveMonto,
          estado_pago: liveEstadoPago,
          last_checked_at: new Date().toISOString(),
        };
      } catch (err: any) {
        console.warn('[Register Shipment] Error al consultar estados con ose_id:', err?.message);
        shipmentData = {
          order_id: resolvedOrderId,
          numero: cleanNumero,
          codigo: cleanCodigo,
          ose_id: targetOseId,
          estado: 'En origen',
          subtitulo: 'Recepción en agencia de origen lista para despacho.',
          fecha_estado: new Date().toLocaleString('es-PE'),
          origen_nombre: liveOrderDetails?.origen?.nombre || 'Agencia de Origen Shalom',
          origen_direccion: liveOrderDetails?.origen?.direccion,
          destino_nombre: liveOrderDetails?.destino?.nombre || 'Agencia de Destino',
          destino_direccion: liveOrderDetails?.destino?.direccion || linkedOrderAddress,
          destinatario: liveOrderDetails?.destinatario?.nombre || linkedOrderCustomerName || 'Por confirmar en despacho',
          fecha_envio: liveOrderDetails?.fecha_emision || new Date().toISOString(),
          tipo_pago: liveOrderDetails?.comprobante?.tipo_pago || 'Contra entrega',
          monto: liveOrderDetails?.monto || '12.00',
          estado_pago: liveOrderDetails?.comprobante?.estado_pago || 'Por cobrar (CR)',
          last_checked_at: new Date().toISOString(),
        };
      }
    } else {
      // Registro inicial cuando Shalom está procesando o no se indexó aún
      shipmentData = {
        order_id: resolvedOrderId,
        numero: cleanNumero,
        codigo: cleanCodigo,
        estado: 'En origen',
        subtitulo: 'Recepción en agencia de origen lista para despacho.',
        fecha_estado: new Date().toLocaleString('es-PE'),
        origen_nombre: 'Agencia de Origen Shalom',
        destino_nombre: 'Agencia de Destino',
        destino_direccion: linkedOrderAddress || undefined,
        destinatario: linkedOrderCustomerName || 'Por confirmar en despacho',
        fecha_envio: new Date().toISOString(),
        tipo_pago: 'Contra entrega',
        monto: '12.00',
        estado_pago: 'Por cobrar (CR)',
        last_checked_at: new Date().toISOString(),
      };
    }

    const saved = await saveOrUpdateShipment(shipmentData);

    // Si tiene un order_id asociado, sincronizar el tracking_code en la tabla orders
    if (resolvedOrderId) {
      try {
        await adminSb
          .from('orders')
          .update({
            tracking_code: cleanNumero,
            status: 'dispatched',
            updated_at: new Date().toISOString(),
          })
          .eq('id', resolvedOrderId);
      } catch (syncOrdErr) {
        console.warn('Error sincronizando tracking_code en orders:', syncOrdErr);
      }
    }

    return NextResponse.json({
      success: true,
      shipment: saved,
    });
  } catch (error: any) {
    console.error('[Register Shipment] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al registrar envío' },
      { status: 500 }
    );
  }
}
