'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  X, 
  MessageCircle,
  Truck,
  ShieldCheck,
  Zap,
  Folder
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { searchLiveProducts } from '@/lib/catalog';
import { Product, Category } from '@/types';
import { PublicSiteSettings } from '@/lib/settings';
import { Logo } from './Logo';

interface HeaderProps {
  settings?: PublicSiteSettings;
  categories?: Category[];
}

export function Header({ settings, categories = [] }: HeaderProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { toggleCart, getTotalItems, setShippingConfig } = useCartStore();
  const [totalItems, setTotalItems] = useState(0);

  const cleanPhone = (settings?.whatsapp_number || '51999999999').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    settings?.whatsapp_message || 'Hola, deseo realizar una consulta'
  )}`;

  const freeThreshold = settings?.free_shipping_threshold ?? 150;
  const defaultCost = settings?.default_shipping_cost ?? 10;
  const currencySymbol = settings?.currency_symbol || 'S/';
  const announcementText = settings?.announcement_bar || `⚡ Envío Gratis desde ${currencySymbol} ${freeThreshold}`;

  // Sync live shipping thresholds from Supabase settings to Cart Store
  useEffect(() => {
    if (settings) {
      setShippingConfig({
        freeThreshold: settings.free_shipping_threshold,
        defaultCost: settings.default_shipping_cost,
      });
    }
  }, [settings, setShippingConfig]);

  useEffect(() => {
    setTotalItems(getTotalItems());
  }, [getTotalItems]);

  useEffect(() => {
    const unsub = useCartStore.subscribe((state) => {
      setTotalItems(state.items.reduce((t, i) => t + i.quantity, 0));
    });
    return () => unsub();
  }, []);

  // Debounced live search with real database queries
  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const matches = await searchLiveProducts(term, 6);
        setSearchResults(matches);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      router.push(`/catalogo?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top Banner Notice - Clean Light Style */}
      <div className="bg-slate-100/90 backdrop-blur-xs text-slate-700 text-[11px] py-2 px-4 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Envíos express en Lima y todo el Perú</span>
            </span>
            <span className="hidden md:inline-block text-slate-300">•</span>
            <span className="hidden md:flex items-center gap-1.5 font-medium text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Garantía oficial directa</span>
            </span>
          </div>
          
          <div className="flex items-center gap-3 font-semibold">
            <span className="text-emerald-700 font-bold hidden sm:inline">
              {announcementText}
            </span>
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Asesoría WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3.5 px-4 sm:px-6 lg:px-8 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors cursor-pointer"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-800" />}
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              <Logo variant="dark" />
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:block flex-1 max-w-xl mx-4" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Buscar productos en el catálogo..."
                  className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-full pl-10 pr-10 py-2.5 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400 font-normal"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Live Search Autocomplete Dropdown */}
              {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Productos sugeridos
                    </div>
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/producto/${product.slug}`}
                        onClick={() => {
                          setIsSearchFocused(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          {product.images[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">NX</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                            {product.name}
                          </p>
                          <p className="text-[11px] font-bold text-emerald-600">
                            {product.symbol} {product.price.toFixed(2)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                    <button
                      type="submit"
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      Ver todos los resultados para "{searchQuery}" →
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Desktop Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/catalogo"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ver Catálogo</span>
            </Link>

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-full font-semibold text-xs shadow-xs transition-all touch-press cursor-pointer"
              aria-label="Abrir carrito de compras"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Carrito</span>
              {totalItems > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-bold text-emerald-700 bg-white rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Search Bar Row */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en el catálogo..."
              className="w-full bg-slate-100 text-slate-900 text-xs rounded-full pl-9 pr-8 py-2.5 border border-slate-200 outline-none placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-0.5 text-slate-400 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden flex flex-col justify-end"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl p-6 space-y-6 animate-in slide-in-from-bottom duration-200 shadow-2xl border-t border-slate-200 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <Logo variant="dark" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 font-semibold text-xs text-slate-800">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block p-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Inicio
              </Link>
              <Link
                href="/catalogo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block p-3 rounded-xl hover:bg-slate-50 transition-colors text-emerald-600 font-bold"
              >
                Catálogo Completo
              </Link>

              {/* Dynamic Categories from Supabase */}
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug || cat.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Folder className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cat.name}</span>
                  </span>
                  {cat.productCount !== undefined && cat.productCount > 0 && (
                    <span className="text-[10px] text-slate-400">({cat.productCount})</span>
                  )}
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Asesoría directa por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
