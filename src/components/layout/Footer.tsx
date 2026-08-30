import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Truck, 
  Headphones, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail,
  Folder
} from 'lucide-react';
import { Logo } from './Logo';
import { PublicSiteSettings } from '@/lib/settings';
import { Category } from '@/types';

interface FooterProps {
  settings?: PublicSiteSettings;
  categories?: Category[];
}

// Clean inline SVGs for social media
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function Footer({ settings, categories = [] }: FooterProps) {
  const storeName = settings?.store_name || 'Nexora Store';
  const cleanPhone = (settings?.whatsapp_number || '').replace(/\D/g, '');
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(settings?.whatsapp_message || 'Hola, deseo información.')}`
    : '#';

  return (
    <footer className="bg-white border-t border-slate-200 mt-12 text-slate-600">
      {/* Guarantees bar */}
      <div className="border-b border-slate-100 bg-slate-50/70 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Envíos a Todo el Perú</p>
              <p className="text-[11px] text-slate-500">Lima express & Olva / Shalom a provincias</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Garantía Directa</p>
              <p className="text-[11px] text-slate-500">Productos nuevos y verificados</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Asesoría Personalizada</p>
              <p className="text-[11px] text-slate-500">Atención rápida por WhatsApp</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Compra 100% Segura</p>
              <p className="text-[11px] text-slate-500">Pagos con Yape, Plin y transferencias</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-4">
          <Logo />
          <p className="text-xs text-slate-500 leading-relaxed">
            {settings?.store_description || `${storeName} - Tu tienda tecnológica de confianza en Perú. Productos de alta calidad y atención personalizada.`}
          </p>
          <div className="text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700">RUC: 10762351240</p>
            <p>Comprobantes Electrónicos: Boleta / Factura</p>
          </div>
        </div>

        {/* Categories (100% Dynamic from Database) */}
        <div>
          <h4 className="font-bold text-slate-900 text-xs mb-3 tracking-wider uppercase">Categorías</h4>
          <ul className="space-y-2 text-xs">
            {categories.length > 0 ? (
              categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link 
                    href={`/categoria/${cat.slug || cat.id}`} 
                    className="hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                  >
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))
            ) : (
              <li>
                <Link href="/catalogo" className="hover:text-emerald-600 transition-colors">
                  Ver todo el catálogo
                </Link>
              </li>
            )}
            <li>
              <Link href="/catalogo" className="text-emerald-600 font-semibold hover:underline">
                Explorar catálogo completo →
              </Link>
            </li>
          </ul>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-bold text-slate-900 text-xs mb-3 tracking-wider uppercase">Atención al Cliente</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/catalogo" className="hover:text-emerald-600 transition-colors">
                Catálogo de Productos
              </Link>
            </li>
            <li>
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-emerald-600 transition-colors"
              >
                Seguimiento de Pedido
              </a>
            </li>
            <li>
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-emerald-600 transition-colors"
              >
                Preguntas Frecuentes & Garantía
              </a>
            </li>
            <li>
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-emerald-600 transition-colors"
              >
                Libro de Reclamaciones Virtual
              </a>
            </li>
          </ul>
        </div>

        {/* Contact info (100% Dynamic from Database) */}
        <div>
          <h4 className="font-bold text-slate-900 text-xs mb-3 tracking-wider uppercase">Contacto Directo</h4>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Lima & Provincias, Perú</span>
            </div>
            {settings?.whatsapp_number && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors font-semibold">
                  +{cleanPhone} (WhatsApp)
                </a>
              </div>
            )}
            {/* Social Links if configured */}
            <div className="flex items-center gap-3 pt-2">
              {settings?.social_instagram && (
                <a
                  href={settings.social_instagram.startsWith('http') ? settings.social_instagram : `https://instagram.com/${settings.social_instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-emerald-600 transition-colors"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {settings?.social_facebook && (
                <a
                  href={settings.social_facebook.startsWith('http') ? settings.social_facebook : `https://facebook.com/${settings.social_facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-emerald-600 transition-colors"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados. Diseñado para alta conversión e-commerce.</p>
      </div>
    </footer>
  );
}
