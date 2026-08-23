import React from 'react';
import { getAdminProducts } from '@/lib/admin/products';
import { getAdminCategories } from '@/lib/admin/categories';
import { ProductsTableClient } from './ProductsTableClient';

export const revalidate = 0;

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    stock?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const { search, category, stock } = await searchParams;

  const [products, categories] = await Promise.all([
    getAdminProducts({ search, category, stockFilter: stock }),
    getAdminCategories(),
  ]);

  return (
    <div className="max-w-7xl">
      <ProductsTableClient
        initialProducts={products}
        categories={categories}
        currentCategory={category || 'all'}
        currentStock={stock || 'all'}
        currentSearch={search || ''}
      />
    </div>
  );
}
