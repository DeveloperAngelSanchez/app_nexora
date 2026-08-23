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

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching admin orders:', error.message);
    return [];
  }

  return data || [];
}

export async function getAdminOrderById(id: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
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
