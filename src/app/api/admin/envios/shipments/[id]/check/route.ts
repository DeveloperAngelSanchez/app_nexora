import { NextRequest, NextResponse } from 'next/server';
import { getShalomShipmentById, saveOrUpdateShipment, getShalomConnection } from '@/lib/shalom/storage';
import { getShalomStatusByOseId, normalizeShalomStatus, verifyAndResolveOrderDocuments, getShalomOrderDetails, getShalomVoucher } from '@/lib/shalom/api';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    let recaptchaToken: string | undefined;
    try {
      const body = await req.json();
      recaptchaToken = body?.recaptcha_token;
    } catch {
      // Body vacío si la petición no incluye JSON
    }

    const connection = await getShalomConnection();
    const authToken = connection.is_connected ? connection.auth_token : undefined;

    let targetOseId = shipment.ose_id || null;
    let liveOrderDetails: any = null;

    // 1. Si no tiene ose_id o queremos refrescar datos de cabecera, consultar /rastrea/buscar en Shalom
    try {
      const details = await getShalomOrderDetails(
        shipment.numero,
        shipment.codigo,
        targetOseId || undefined,
        authToken,
        recaptchaToken
      );

      if (details?.data) {
        liveOrderDetails = details.data;
        if (details.data.ose_id) {
          targetOseId = details.data.ose_id;
        }
      }
    } catch (err: any) {
      console.warn(`[Check API] /rastrea/buscar para ${shipment.numero}:`, err?.message);
    }

    // 2. Si está vinculado a una orden de Nexora, cargar información real de cliente
    let linkedOrderCustomerName: string | undefined;
    let linkedOrderAddress: string | undefined;
    if (shipment.order_id) {
      try {
        const adminSb = createSupabaseAdminClient();
        const { data: ord } = await adminSb
          .from('orders')
          .select('customer_name, shipping_address, customer_phone')
          .eq('id', shipment.order_id)
          .maybeSingle();

        if (ord) {
          linkedOrderCustomerName = ord.customer_name;
          linkedOrderAddress = ord.shipping_address;
        }
      } catch (ordErr) {
        console.warn('[Check API] Error leyendo orden asociada:', ordErr);
      }
    }

    // Valores base extraídos de Shalom o del registro actual
    let updatedEstado = shipment.estado;
    let updatedSubtitulo = shipment.subtitulo;
    let updatedFecha = shipment.fecha_estado;
    let updatedCarguero = shipment.carguero;

    // Destinatario: prioridad dato live de Shalom > orden de Nexora > destinatario previo
    let updatedDestinatario = 
      liveOrderDetails?.destinatario?.nombre ||
      liveOrderDetails?.destinatario ||
      liveOrderDetails?.cliente?.nombre ||
      linkedOrderCustomerName ||
      (shipment.destinatario && !shipment.destinatario.includes('Cliente Nexora') ? shipment.destinatario : undefined);

    let updatedOrigenNombre = 
      liveOrderDetails?.origen?.nombre || 
      (shipment.origen_nombre && !shipment.origen_nombre.includes('Agencia Registrada') ? shipment.origen_nombre : 'Agencia de Origen Shalom');

    let updatedOrigenDireccion = 
      liveOrderDetails?.origen?.direccion || 
      (shipment.origen_direccion && !shipment.origen_direccion.includes('Lima Metropolitana') ? shipment.origen_direccion : undefined);

    let updatedDestinoNombre = 
      liveOrderDetails?.destino?.nombre || 
      (shipment.destino_nombre && !shipment.destino_nombre.includes('Agencia de Destino') ? shipment.destino_nombre : 'Agencia de Destino Shalom');

    let updatedDestinoDireccion = 
      liveOrderDetails?.destino?.direccion || 
      linkedOrderAddress || 
      (shipment.destino_direccion && !shipment.destino_direccion.includes('Por confirmar') ? shipment.destino_direccion : undefined);

    let updatedTipoPago = liveOrderDetails?.comprobante?.tipo_pago || shipment.tipo_pago || 'Contra entrega';
    let updatedMonto = liveOrderDetails?.monto || liveOrderDetails?.comprobante?.monto || shipment.monto || '12.00';
    let updatedEstadoPago = liveOrderDetails?.comprobante?.estado_pago || shipment.estado_pago || 'Por cobrar (CR)';
    let updatedFechaEnvio = liveOrderDetails?.fecha_emision || shipment.fecha_envio;

    let docInfo = verifyAndResolveOrderDocuments({
      numero: shipment.numero,
      codigo: shipment.codigo,
      ose_id: targetOseId || undefined,
      tipo_pago: updatedTipoPago,
      estado_pago: updatedEstadoPago,
      comprobante_pdf: shipment.comprobante_pdf,
      grt_url: shipment.grt_url,
    });

    // 3. Consultar estados e hitos en vivo si tenemos targetOseId
    if (targetOseId) {
      try {
        const raw = await getShalomStatusByOseId(targetOseId, authToken);
        const norm = normalizeShalomStatus(raw, shipment.numero, shipment.codigo, targetOseId);

        updatedEstado = norm.estado;
        updatedSubtitulo = norm.subtitulo;
        if (norm.fecha_estado) updatedFecha = norm.fecha_estado;
        if (norm.carguero) updatedCarguero = norm.carguero;

        // Si fue entregado, capturar el nombre exacto de la persona que recibió en ventanilla
        if (raw.data?.entregado?.cliente?.nombre) {
          updatedDestinatario = raw.data.entregado.cliente.nombre;
        }

        if (norm.estado === 'Entregado') {
          updatedEstadoPago = 'Pagado';
          docInfo.comprobante_pendiente = false;
        }

        // Si tenemos sesión activa de Shalom Pro, intentar resolver el comprobante oficial
        if (authToken) {
          try {
            if (liveOrderDetails?.comprobante && !liveOrderDetails.comprobante.pendiente) {
              const comp = liveOrderDetails.comprobante;
              const voucherRes = await getShalomVoucher(
                { serie: comp.serie, numero: comp.numero, cop_id: comp.cop_id },
                authToken
              );
              if (voucherRes.success && voucherRes.data?.pdf) {
                docInfo.comprobante_pdf = voucherRes.data.pdf;
                docInfo.comprobante_pendiente = false;
              }
            }
          } catch (voucherErr) {
            // Silencioso si no está disponible
          }
        }
      } catch (err: any) {
        console.warn(`[Check API] Falló llamada en vivo /rastrea/estados para ${shipment.numero}:`, err?.message);
      }
    }

    // 4. Actualizar SIEMPRE con timestamp de la consulta actual y guardar en Supabase
    const updated = await saveOrUpdateShipment({
      ...shipment,
      ose_id: targetOseId || undefined,
      estado: updatedEstado,
      subtitulo: updatedSubtitulo,
      fecha_estado: updatedFecha,
      carguero: updatedCarguero,
      destinatario: updatedDestinatario || 'Por confirmar en despacho',
      origen_nombre: updatedOrigenNombre,
      origen_direccion: updatedOrigenDireccion,
      destino_nombre: updatedDestinoNombre,
      destino_direccion: updatedDestinoDireccion,
      tipo_pago: updatedTipoPago,
      monto: updatedMonto,
      estado_pago: updatedEstadoPago,
      fecha_envio: updatedFechaEnvio,
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
