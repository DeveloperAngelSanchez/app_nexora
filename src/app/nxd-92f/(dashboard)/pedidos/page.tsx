import React from 'react';
import { getAdminOrders } from '@/lib/admin/orders';
import { OrdersTableClient } from './OrdersTableClient';

export const revalidate = 0;

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const { status } = await searchParams;
  const orders = await getAdminOrders(status);

  return <OrdersTableClient initialOrders={orders} currentStatus={status || 'all'} />;
}
