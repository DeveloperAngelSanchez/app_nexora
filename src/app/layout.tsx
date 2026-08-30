import type { Metadata, Viewport } from 'next';
import './globals.css';
import { JsonLd, buildOrganizationSchema, buildWebSiteSchema } from '@/components/seo/JsonLd';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#10b981',
};

const baseUrl = 'https://www.nexoratechpe.store';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'NeXora Store | Tienda Online de Tecnología en Perú',
    template: '%s | NeXora Store Perú',
  },
  description: 'Tienda online oficial en Perú de tecnología, audífonos bluetooth, cargadores rápidos, smartwatches y accesorios móviles. Envíos express a Lima y provincias con garantía directa.',
  keywords: [
    'tienda online peru',
    'tecnologia peru',
    'audifonos bluetooth lima',
    'cargadores rapidos peru',
    'smartwatch peru',
    'accesorios celulares lima',
    'nexora store',
    'gadgets peru',
    'comprar tecnologia online peru',
    'envios a todo el peru',
  ],
  authors: [{ name: 'NeXora Store Perú', url: baseUrl }],
  creator: 'NeXora Store',
  publisher: 'NeXora Store',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: 'NeXora Store Perú | Tienda Online Oficial',
    description: 'Encuentra lo último en tecnología, accesorios y gadgets con garantía directa y envíos express a todo el Perú.',
    url: baseUrl,
    siteName: 'NeXora Store Perú',
    locale: 'es_PE',
    type: 'website',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'NeXora Store Perú Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeXora Store Perú | Tienda Online Oficial de Tecnología',
    description: 'Despachos diarios a todo el Perú, garantía directa de fábrica y atención personalizada por WhatsApp.',
    images: ['/icons/icon-512x512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
  const organizationSchema = buildOrganizationSchema(undefined, baseUrl);
  const websiteSchema = buildWebSiteSchema(baseUrl);

  return (
    <html lang="es" className="h-full antialiased" data-scroll-behavior="smooth">
      <head>
        <JsonLd data={[organizationSchema, websiteSchema]} />
      </head>
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
