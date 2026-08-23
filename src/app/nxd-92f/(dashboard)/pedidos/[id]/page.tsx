import React from 'react';
import { notFound } from 'next/navigation';
import { getAdminOrderById } from '@/lib/admin/orders';
import { OrderDetailClient } from './OrderDetailClient';

export const revalidate = 0;

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getAdminOrderById(id);

  if (!order) {
    notFound();
  }

  return <OrderDetailClient order={order} />;
}
