'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, ShoppingBag, MessageCircle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export function MobileNav() {
  const pathname = usePathname();
  const { toggleCart, getTotalItems } = useCartStore();
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setTotalItems(getTotalItems());
  }, [getTotalItems]);

  useEffect(() => {
    const unsub = useCartStore.subscribe((state) => {
      setTotalItems(state.items.reduce((t, i) => t + i.quantity, 0));
    });
    return () => unsub();
  }, []);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 pb-[env(safe-area-inset-bottom,8px)] pt-2 px-6 shadow-lg">
      <div className="flex items-center justify-around">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            pathname === '/' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Inicio</span>
        </Link>

        {/* Catalog */}
        <Link
          href="/catalogo"
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            pathname.startsWith('/catalogo') ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span>Catálogo</span>
        </Link>

        {/* Cart */}
        <button
          onClick={toggleCart}
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 relative"
          aria-label="Carrito"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <span>Carrito</span>
        </button>

        {/* WhatsApp */}
        <a
          href="https://wa.me/51999999999?text=Hola%20Nexora%20Tech,%20deseo%20hacer%20una%20consulta"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-emerald-600"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Asesor</span>
        </a>
      </div>
    </nav>
  );
}
