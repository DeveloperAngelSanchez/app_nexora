'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Truck, Zap } from 'lucide-react';

const slides = [
  {
    id: 1,
    badge: 'COMBOS TECNOLÓGICOS',
    title: 'Tecno Packs de Alto Rendimiento',
    description: 'Smartwatch Ultra + Auriculares inalámbricos + Estación de carga en un solo paquete con precio especial.',
    ctaText: 'Ver Tecno Packs',
    ctaLink: '/catalogo?category=packs',
    secondaryText: 'Accesorios Apple',
    secondaryLink: '/catalogo?category=apple',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
    highlight: 'Ahorro de hasta 35% en combo'
  },
  {
    id: 2,
    badge: 'TECNOLOGÍA GAN III',
    title: 'Cargadores Rápidos UGREEN Nexode',
    description: 'Potencia de 65W y 100W para cargar simultáneamente tu MacBook, iPhone y iPad a máxima velocidad.',
    ctaText: 'Comprar UGREEN',
    ctaLink: '/catalogo?brand=ugreen',
    secondaryText: 'Ver Todos los Cargadores',
    secondaryLink: '/catalogo?category=cargadores',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    highlight: 'Control térmico inteligente'
  },
  {
    id: 3,
    badge: 'PROTECCIÓN INTEGRAL',
    title: 'Cases Blindados Serie iPhone 16 & 15',
    description: 'Bisel de aluminio reforzado para la cámara, acabado mate antihuellas y soporte MagSafe de alta adherencia.',
    ctaText: 'Explorar Cases',
    ctaLink: '/catalogo?category=cases',
    secondaryText: 'Micas y Protectores',
    secondaryLink: '/catalogo?category=micas',
    image: 'https://images.unsplash.com/photo-1603539260192-3ef8e1837f48?auto=format&fit=crop&w=800&q=80',
    highlight: 'Protección contra impactos 360°'
  }
];

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const slide = slides[currentSlide];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-100/80 to-slate-50 py-6 sm:py-10 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-white border border-slate-200 shadow-lg p-6 sm:p-10 lg:p-14 overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold tracking-wider">
                  <Zap className="w-3.5 h-3.5 fill-emerald-600" />
                  <span>{slide.badge}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  {slide.title}
                </h1>
              </div>

              <p className="text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed font-normal">
                {slide.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={slide.ctaLink}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 rounded-full text-xs shadow-md shadow-emerald-600/20 transition-all touch-press"
                >
                  <span>{slide.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={slide.secondaryLink}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-6 py-3.5 rounded-full text-xs transition-colors"
                >
                  <span>{slide.secondaryText}</span>
                </Link>
              </div>

              {/* Trust Features */}
              <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-100 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Garantía de 6 meses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Despacho express Lima & Provincias</span>
                </div>
              </div>
            </div>

            {/* Right Image Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-md group">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{slide.highlight}</span>
                  <span className="text-emerald-700 font-semibold text-[11px]">En Stock</span>
                </div>
              </div>
            </div>

          </div>

          {/* Navigation Dots & Arrows */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all ${
                    currentSlide === idx ? 'w-8 bg-emerald-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                aria-label="Slide anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                aria-label="Siguiente slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
