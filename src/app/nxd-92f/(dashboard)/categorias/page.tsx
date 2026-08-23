import React from 'react';
import { getAdminCategories } from '@/lib/admin/categories';
import { CategoriesClient } from './CategoriesClient';

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return <CategoriesClient initialCategories={categories} />;
}
