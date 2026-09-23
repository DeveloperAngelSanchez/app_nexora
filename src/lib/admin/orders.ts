'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export type OrderStatus = 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';

export async function getAdminOrders(statusFilter?: string) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: orders, error } = await query;

  if (error || !orders) {
    console.error('Error fetching admin orders:', error?.message);
    return [];
  }

  // Enriquecer con envíos asociados si existen en la tabla shipments
  try {
    const { data: shipments } = await supabase
      .from('shipments')
      .select('id, order_id, numero, estado, fecha_estado, carguero');

    if (shipments && shipments.length > 0) {
      const shipmentByOrderId = new Map(shipments.filter(s => s.order_id).map(s => [s.order_id, s]));
      const shipmentByNumero = new Map(shipments.map(s => [s.numero, s]));

      return orders.map(order => {
        const matched = 
          shipmentByOrderId.get(order.id) || 
          (order.tracking_code ? shipmentByNumero.get(order.tracking_code.trim()) : null);
        return {
          ...order,
          shipment: matched || null,
        };
      });
    }
  } catch (err) {
    // Retornar órdenes sin shipment si la consulta secundaria falla
  }

  return orders;
}

export async function getAdminOrderById(id: string) {
  const supabase = await createSupabaseServerClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !order) return null;

  // Buscar si tiene un envío de Shalom vinculado en la tabla shipments
  try {
    let { data: shipments } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', id);

    if ((!shipments || shipments.length === 0) && order.tracking_code) {
      const { data: matched } = await supabase
        .from('shipments')
        .select('*')
        .eq('numero', order.tracking_code.trim());
      if (matched && matched.length > 0) {
        shipments = matched;
      }
    }

    return {
      ...order,
      shipment: shipments && shipments.length > 0 ? shipments[0] : null,
    };
  } catch (err) {
    return { ...order, shipment: null };
  }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  adminNotes?: string,
  trackingCode?: string
) {
  const supabase = await createSupabaseServerClient();

  const updatePayload: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;
  if (trackingCode !== undefined) updatePayload.tracking_code = trackingCode;

  const { data, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/nxd-92f/pedidos');
  revalidatePath(`/nxd-92f/pedidos/${id}`);
  return data;
}

export async function updateOrderTracking(id: string, trackingCode?: string, adminNotes?: string) {
  const supabase = await createSupabaseServerClient();
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (trackingCode !== undefined) updatePayload.tracking_code = trackingCode;
  if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;

  const { data, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/nxd-92f/pedidos');
  revalidatePath(`/nxd-92f/pedidos/${id}`);
  return data;
}

export async function linkOrderShipment(orderId: string, numero: string, codigo: string) {
  const supabase = await createSupabaseServerClient();
  const cleanNum = numero.trim();
  const cleanCod = codigo.trim().toUpperCase();

  // 1. Actualizar orden con el código de seguimiento
  await supabase
    .from('orders')
    .update({ 
      tracking_code: cleanNum,
      status: 'dispatched',
      updated_at: new Date().toISOString() 
    })
    .eq('id', orderId);

  // 2. Asociar el shipment existente en la base de datos si existe
  await supabase
    .from('shipments')
    .update({ 
      order_id: orderId,
      updated_at: new Date().toISOString()
    })
    .eq('numero', cleanNum);

  revalidatePath('/nxd-92f/pedidos');
  revalidatePath(`/nxd-92f/pedidos/${orderId}`);
  revalidatePath('/nxd-92f/envios');
}
