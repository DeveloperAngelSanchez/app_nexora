import React from 'react';
import { ProductForm } from '@/components/admin/ProductForm';
import { getAdminCategories } from '@/lib/admin/categories';

export const revalidate = 0;

export default async function NewProductPage() {
  const categories = await getAdminCategories();

  return (
    <div className="max-w-7xl">
      <ProductForm categories={categories} />
    </div>
  );
}
