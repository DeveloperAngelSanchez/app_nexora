import React, { Suspense } from 'react';
import { ProductForm } from '@/components/admin/ProductForm';
import { getAdminCategories } from '@/lib/admin/categories';

export const revalidate = 0;

export default async function NewProductPage() {
  const categories = await getAdminCategories();

  return (
    <div className="max-w-7xl">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        }
      >
        <ProductForm categories={categories} />
      </Suspense>
    </div>
  );
}
