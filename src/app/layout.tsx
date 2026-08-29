import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: 'NeXora Tech | Accesorios Apple, UGREEN y Tecnología en Perú',
  description: 'Tienda online tecnológica en Perú. Accesorios para iPhone, Mac, Apple Watch, cargadores GaN Ugreen, cables de alta durabilidad y Tecno Packs con envío express.',
  openGraph: {
    title: 'NeXora Tech | Accesorios Apple & UGREEN',
    description: 'Despachos diarios en Lima y provincias, garantía oficial de 6 meses y atención por WhatsApp.',
    type: 'website',
    locale: 'es_PE',
    siteName: 'NeXora Tech Store',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NeXora',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
