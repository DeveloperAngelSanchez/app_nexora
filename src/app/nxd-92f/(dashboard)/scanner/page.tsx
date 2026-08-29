import React, { Suspense } from 'react';
import { RemoteScannerClient } from '@/components/admin/RemoteScannerClient';

export const revalidate = 0;

export default function RemoteScannerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <RemoteScannerClient />
    </Suspense>
  );
}
