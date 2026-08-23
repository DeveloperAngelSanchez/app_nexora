import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MobileNav } from '@/components/layout/MobileNav';
import { SalesToast } from '@/components/ui/SalesToast';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans pb-16 md:pb-0">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <MobileNav />
      <CartDrawer />
      <SalesToast />
    </div>
  );
}
