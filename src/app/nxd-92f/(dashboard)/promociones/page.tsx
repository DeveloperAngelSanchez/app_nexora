import React from 'react';
import { getAdminPromotions } from '@/lib/admin/promotions';
import { PromotionsClient } from './PromotionsClient';

export const revalidate = 0;

export default async function AdminPromotionsPage() {
  const promotions = await getAdminPromotions();
  return <PromotionsClient initialPromotions={promotions} />;
}
