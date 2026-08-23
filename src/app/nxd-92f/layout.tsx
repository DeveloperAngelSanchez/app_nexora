import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NeXora Admin Panel',
  description: 'Panel interno de administración de catálogo y tienda.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {children}
    </div>
  );
}
