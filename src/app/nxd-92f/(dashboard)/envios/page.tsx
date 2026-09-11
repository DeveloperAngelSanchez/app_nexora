import React from 'react';
import { EnviosDashboardClient } from '@/components/admin/envios/EnviosDashboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Envíos y Rastreo Shalom | Nexora Admin',
  description: 'Seguimiento y gestión de envíos automatizados por Shalom en Nexora Store',
};

export const revalidate = 0;

export default function AdminEnviosPage() {
  return <EnviosDashboardClient />;
}
