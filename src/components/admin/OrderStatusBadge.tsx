import React from 'react';

interface OrderStatusBadgeProps {
  status: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const configs = {
    pending: {
      label: 'Pendiente',
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    confirmed: {
      label: 'Confirmado',
      className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    dispatched: {
      label: 'Enviado',
      className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    delivered: {
      label: 'Entregado',
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    cancelled: {
      label: 'Cancelado',
      className: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
  };

  const config = configs[status] || configs.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
      {config.label}
    </span>
  );
}
