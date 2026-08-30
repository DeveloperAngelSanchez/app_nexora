'use client';

import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  MessageCircle 
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { WhatsAppCheckoutModal } from './WhatsAppCheckoutModal';
import { PublicSiteSettings } from '@/lib/settings';

interface CartDrawerProps {
  settings?: PublicSiteSettings;
}

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='52%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='10'%3ENX%3C/text%3E%3C/svg%3E";

export function CartDrawer({ settings }: CartDrawerProps) {
  const { 
    items, 
    isOpen, 
    freeShippingThreshold: storeThreshold,
    closeCart, 
    updateQuantity, 
    removeItem, 
    getSubtotal, 
    getShippingCost, 
    getTotal 
  } = useCartStore();

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const shipping = getShippingCost();
  const total = getTotal();
  const freeShippingThreshold = settings?.free_shipping_threshold ?? storeThreshold ?? 150;
  const currencySymbol = settings?.currency_symbol || 'S/';
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={closeCart}
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-[60] w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-transform">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-base">Tu Carrito</h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {items.reduce((t, i) => t + i.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping progress */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-5 py-3">
          <div className="flex items-center justify-between text-xs mb-2 text-slate-800 font-medium">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              {amountToFreeShipping === 0 ? (
                <span className="text-emerald-700 font-bold">¡Tienes Envío GRATIS!</span>
              ) : (
                <span>Agrega <strong className="text-emerald-700">{currencySymbol} {amountToFreeShipping.toFixed(2)}</strong> para <strong>Envío Gratis</strong></span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Tu carrito está vacío</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Explora nuestro catálogo para agregar productos y completar tu pedido por WhatsApp.
                </p>
              </div>
              <button
                onClick={closeCart}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-3 rounded-full transition-colors shadow-sm cursor-pointer"
              >
                <span>Ver Catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={`${item.product.id}-${item.selectedColor}-${item.selectedModel}-${idx}`} className="pt-4 first:pt-0 flex gap-3.5">
                <img
                  src={item.product?.images?.[0] || PLACEHOLDER_IMG}
                  alt={item.product?.name || 'Producto'}
                  className="w-16 h-16 object-contain bg-slate-50 rounded-xl p-1.5 border border-slate-100 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
                  }}
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {item.product.name}
                    </h4>
                    {(item.selectedModel || item.selectedColor) && (
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        {[item.selectedModel, item.selectedColor].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden shadow-2xs">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedColor, item.selectedModel)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedColor, item.selectedModel)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price and delete */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900">
                        {item.product.symbol} {(item.product.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.product.id, item.selectedColor, item.selectedModel)}
                        className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Eliminar"
                        aria-label="Eliminar item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Totals and WhatsApp Checkout */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/80 space-y-4 pb-[env(safe-area-inset-bottom,20px)]">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal</span>
                <span>{currencySymbol} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Envío</span>
                <span>{shipping === 0 ? <strong className="text-emerald-700 font-bold">GRATIS</strong> : `${currencySymbol} ${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-emerald-700">{currencySymbol} {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutModalOpen(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-full flex items-center justify-center gap-2 text-xs shadow-md shadow-emerald-600/20 transition-all touch-press cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Pedir por WhatsApp (Atención Inmediata)</span>
            </button>

            <div className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Garantía oficial directa en todos los productos</span>
            </div>
          </div>
        )}

      </div>

      {/* WhatsApp Checkout Modal */}
      <WhatsAppCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
      />
    </>
  );
}
