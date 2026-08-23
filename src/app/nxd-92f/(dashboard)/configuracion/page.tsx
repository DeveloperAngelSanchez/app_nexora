import React from 'react';
import { getAdminSiteSettings } from '@/lib/admin/settings';
import { SettingsClient } from './SettingsClient';

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const settings = await getAdminSiteSettings();
  return <SettingsClient initialSettings={settings} />;
}
