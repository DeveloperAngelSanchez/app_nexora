import React from 'react';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { getProductById } from '@/lib/admin/products';
import { getAdminCategories } from '@/lib/admin/categories';

export const revalidate = 0;

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    getProductById(id),
    getAdminCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-7xl">
      <ProductForm
        initialData={product}
        categories={categories}
        isEditing={true}
      />
    </div>
  );
}
