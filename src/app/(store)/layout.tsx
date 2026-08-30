import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MobileNav } from '@/components/layout/MobileNav';
import { SalesToast } from '@/components/ui/SalesToast';
import { getPublicSiteSettings } from '@/lib/settings';
import { getCategories } from '@/lib/catalog';

export const revalidate = 60;

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories] = await Promise.all([
    getPublicSiteSettings(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans pb-16 md:pb-0">
      <Header settings={settings} categories={categories} />
      <main className="flex-1">
        {children}
      </main>
      <Footer settings={settings} categories={categories} />
      <MobileNav settings={settings} />
      <CartDrawer settings={settings} />
      <SalesToast />
    </div>
  );
}
