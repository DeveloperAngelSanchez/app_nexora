'use client';

import React from 'react';
import { Menu, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface AdminTopBarProps {
  onToggleMenu?: () => void;
}

export function AdminTopBar({ onToggleMenu }: AdminTopBarProps) {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu hamburger button */}
        {onToggleMenu && (
          <button
            onClick={onToggleMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-700">
            Tienda en línea <span className="text-emerald-700 font-bold hidden sm:inline">• Sistema Operativo</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
        >
          <span className="hidden sm:inline">Visitar Storefront</span>
          <span className="sm:hidden">Tienda</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </Link>

        <div className="flex items-center gap-2.5 pl-3 sm:pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs">
            AD
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">Administrador</p>
            <p className="text-[10px] text-emerald-700 font-semibold">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
