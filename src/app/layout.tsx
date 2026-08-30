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
  title: 'NeXora Store | Tienda Online Oficial Perú',
  description: 'Tienda online oficial en Perú con despachos a todo el país, garantía directa y atención personalizada por WhatsApp.',
  openGraph: {
    title: 'NeXora Store Perú',
    description: 'Despachos diarios en Lima y provincias, garantía oficial directa y atención por WhatsApp.',
    type: 'website',
    locale: 'es_PE',
    siteName: 'NeXora Store',
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
