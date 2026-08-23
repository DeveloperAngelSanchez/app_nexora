'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  Minus, 
  Plus, 
  MessageCircle, 
  Share2, 
  Check,
  Star,
  Zap
} from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  const colorVariant = product.variants?.find(v => v.name.toLowerCase() === 'color');
  const modelVariant = product.variants?.find(v => v.name.toLowerCase() === 'modelo');

  const [selectedColor, setSelectedColor] = useState(
    colorVariant?.options[0] || ''
  );
  const [selectedModel, setSelectedModel] = useState(
    modelVariant?.options[0] || ''
  );

  const [isCopied, setIsCopied] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { addItem } = useCartStore();

  const [whatsappPhone, setWhatsappPhone] = useState('51999999999');

  React.useEffect(() => {
    async function loadPhone() {
      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase-browser');
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase
          .from('site_settings')
          .select('whatsapp_number')
          .eq('id', 'main')
          .maybeSingle();

        if (data?.whatsapp_number) {
          const clean = data.whatsapp_number.replace(/[^0-9]/g, '');
          setWhatsappPhone(clean.startsWith('51') ? clean : `51${clean}`);
        }
      } catch (e) {
        // fallback
      }
    }
    loadPhone();
  }, []);

  const handleAddToCart = () => {
    addItem(product, quantity, selectedColor || undefined, selectedModel || undefined);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleDirectWhatsAppBuy = () => {
    const variantDetails = [selectedModel, selectedColor].filter(Boolean).join(' - ');
    let msg = `Hola NeXora Store, deseo adquirir el siguiente producto:\n\n`;
    msg += `📦 Producto: ${product.name}\n`;
    if (variantDetails) msg += `🎨 Variante: ${variantDetails}\n`;
    msg += `🔢 Cantidad: ${quantity} unidad(es)\n`;
    msg += `💵 Precio Unitario: ${product.symbol} ${product.price.toFixed(2)}\n`;
    msg += `💰 Total: ${product.symbol} ${(product.price * quantity).toFixed(2)}\n\n`;
    msg += `Por favor indíquenme la disponibilidad y los datos para realizar el pago por Yape / Plin / Transferencia. Muchas gracias.`;

    const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const images = product.images.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      {/* 1. Image Gallery */}
      <div className="lg:col-span-6 space-y-4">
        <div className="relative aspect-square rounded-3xl bg-white border border-slate-200 p-8 flex items-center justify-center overflow-hidden group shadow-sm">
          {product.discountPercentage > 0 && (
            <span className="absolute top-4 left-4 text-xs font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 z-10">
              -{product.discountPercentage}% DTO
            </span>
          )}

          <img
            src={images[selectedImage] || images[0]}
            alt={product.name}
            className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80';
            }}
          />

          <button
            onClick={handleShare}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200 shadow-xs"
            title="Copiar enlace"
            aria-label="Copiar enlace"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Thumbnail Selector */}
        {images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-18 h-18 rounded-2xl p-2 bg-white border transition-all shrink-0 ${
                  selectedImage === idx 
                    ? 'border-emerald-600 ring-2 ring-emerald-600/30' 
                    : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
                aria-label={`Ver imagen ${idx + 1}`}
              >
                <img src={img} alt="" className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        )}

        {/* Guarantees Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-2 gap-4 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Despacho en Lima</p>
              <p className="text-slate-500 text-[11px]">En 24h a tu puerta</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Garantía Nexora</p>
              <p className="text-slate-500 text-[11px]">6 meses oficiales</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Product Info & Purchase Actions */}
      <div className="lg:col-span-6 space-y-6">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
            {product.brand} Oficial
          </span>
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            En Stock ({product.stock} unidades)
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          {product.name}
        </h1>

        {/* Rating */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400" />
            ))}
          </div>
          <span className="font-bold text-slate-900">{product.rating}</span>
          <span className="text-slate-500">({product.reviewCount} clientes verificados)</span>
        </div>

        {/* Pricing Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-500 block mb-0.5 font-medium">Precio de Oferta:</span>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-950">
                {product.symbol} {product.price.toFixed(2)}
              </span>
              {product.regularPrice > product.price && (
                <span className="text-sm text-slate-400 line-through font-medium">
                  {product.symbol} {product.regularPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {product.discountPercentage > 0 && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              Ahorras {product.symbol} {(product.regularPrice - product.price).toFixed(2)}
            </span>
          )}
        </div>

        {/* Variants: Model */}
        {modelVariant && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 block">
              Modelo / Versión:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {modelVariant.options.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedModel(option)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all touch-press ${
                    selectedModel === option
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Variants: Color */}
        {colorVariant && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 block">
              Color disponible: <span className="text-emerald-700">{selectedColor}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {colorVariant.options.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all touch-press ${
                    selectedColor === color
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity & CTA Buttons */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            
            {/* Quantity */}
            <div className="flex items-center border border-slate-200 bg-white rounded-2xl overflow-hidden p-1 shadow-2xs">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Disminuir cantidad"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-9 text-center text-xs font-bold text-slate-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Aumentar cantidad"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className={`flex-1 font-bold py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all touch-press text-xs shadow-md ${
                isAdded
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Añadido al Carrito</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Añadir al Carrito</span>
                </>
              )}
            </button>
          </div>

          {/* Instant Buy via WhatsApp */}
          <button
            onClick={handleDirectWhatsAppBuy}
            className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold py-3.5 px-6 rounded-full flex items-center justify-center gap-2 text-xs transition-all touch-press shadow-2xs"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Comprar Directo por WhatsApp</span>
          </button>
        </div>

        {/* Features Bullet List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Características Principales
          </h2>
          <ul className="space-y-2 text-xs text-slate-600">
            {product.features?.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Description */}
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed pt-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Descripción
          </h3>
          <p>{product.description}</p>
        </div>

      </div>

    </div>
  );
}
