import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Truck, 
  Headphones, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail 
} from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200">
      {/* Guarantees row */}
      <div className="border-b border-slate-100 bg-slate-50/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Despachos Diarios</h4>
              <p className="text-[11px] text-slate-500">Lima en 24h y provincias vía Olva Courier</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Garantía Directa</h4>
              <p className="text-[11px] text-slate-500">6 meses de garantía oficial por falla de fábrica</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Pagos Flexibles</h4>
              <p className="text-[11px] text-slate-500">Yape, Plin, transferencias y contraentrega en Lima</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Asesoría Inmediata</h4>
              <p className="text-[11px] text-slate-500">Atención personalizada y soporte por WhatsApp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Brand info */}
        <div className="space-y-3">
          <Logo variant="dark" />
          <p className="text-xs text-slate-500 leading-relaxed font-normal">
            E-commerce tecnológico enfocado en accesorios de alta fidelidad para iPhone, Mac, Apple Watch, cargadores rápidos GaN Ugreen y bundles tecnológicos.
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 font-semibold">
            <span className="bg-slate-100 px-2 py-0.5 rounded">Yape</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded">Plin</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded">BCP</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded">BBVA</span>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-bold text-slate-900 text-xs mb-3 tracking-wider uppercase">Categorías</h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li>
              <Link href="/catalogo?category=apple" className="hover:text-emerald-600 transition-colors">
                Accesorios Apple & MagSafe
              </Link>
            </li>
            <li>
              <Link href="/catalogo?category=cargadores" className="hover:text-emerald-600 transition-colors">
                Cargadores GaN UGREEN
              </Link>
            </li>
            <li>
              <Link href="/catalogo?category=cases" className="hover:text-emerald-600 transition-colors">
                Cases Serie iPhone 16 & 15
              </Link>
            </li>
            <li>
              <Link href="/catalogo?category=packs" className="hover:text-emerald-600 transition-colors">
                Tecno Packs Seleccionados
              </Link>
            </li>
            <li>
              <Link href="/catalogo?category=smartwatch" className="hover:text-emerald-600 transition-colors">
                Smartwatches & Pulseras
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-bold text-slate-900 text-xs mb-3 tracking-wider uppercase">Atención</h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li>
              <a href="https://wa.me/51999999999" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">
                Seguimiento de Pedido por WhatsApp
              </a>
            </li>
            <li>
              <Link href="/catalogo" className="hover:text-emerald-600 transition-colors">
                Garantía y Devoluciones
              </Link>
            </li>
            <li>
              <Link href="/catalogo" className="hover:text-emerald-600 transition-colors">
                Preguntas Frecuentes
              </Link>
            </li>
            <li>
              <Link href="/catalogo" className="hover:text-emerald-600 transition-colors">
                Términos del Servicio
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="font-bold text-slate-900 text-xs mb-3 tracking-wider uppercase">Contacto Directo</h4>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Lima Metropolitana, Perú</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <a href="https://wa.me/51999999999" className="hover:text-emerald-600 transition-colors font-semibold">
                +51 999 999 999 (WhatsApp)
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>ventas@nexorastore.pe</span>
            </div>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="border-t border-slate-100 py-6 text-center text-xs text-slate-400 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Nexora Tech Perú. Todos los derechos reservados.</p>
          <p className="text-[11px] text-slate-500">Tienda online de alta conversión y velocidad.</p>
        </div>
      </div>
    </footer>
  );
}
