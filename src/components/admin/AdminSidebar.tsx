'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  ShoppingBag, 
  Tag, 
  Settings, 
  ExternalLink, 
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const ADMIN_BASE = '/nxd-92f';

const navigation = [
  { name: 'Dashboard', href: ADMIN_BASE, icon: LayoutDashboard, exact: true },
  { name: 'Productos', href: `${ADMIN_BASE}/productos`, icon: Package },
  { name: 'Categorías', href: `${ADMIN_BASE}/categorias`, icon: Layers },
  { name: 'Pedidos', href: `${ADMIN_BASE}/pedidos`, icon: ShoppingBag },
  { name: 'Promociones', href: `${ADMIN_BASE}/promociones`, icon: Tag },
  { name: 'Configuración', href: `${ADMIN_BASE}/configuracion`, icon: Settings },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebar({ 
  isOpen = false, 
  onClose, 
  isCollapsed = false,
  onToggleCollapse 
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push(`${ADMIN_BASE}/login`);
    router.refresh();
  };

  const renderContent = (collapsed: boolean, isMobile: boolean) => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 shadow-xs select-none">
      {/* Brand Header */}
      <div className={`h-20 flex items-center border-b border-slate-100 transition-all ${
        collapsed ? 'justify-center px-2' : 'justify-between px-6'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
            NX
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm truncate">NeXora</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Control Central</p>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              title={collapsed ? item.name : undefined}
              className={`flex items-center rounded-2xl text-xs font-semibold transition-all group relative ${
                collapsed 
                  ? 'justify-center p-3' 
                  : 'gap-3 px-3.5 py-3'
              } ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
              
              {!collapsed && <span className="truncate">{item.name}</span>}

              {/* Floating Tooltip in Collapsed Mode */}
              {collapsed && (
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-100 space-y-1.5 bg-slate-50/50">
        
        {/* Desktop Collapse / Expand Toggle Button */}
        {!isMobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir barra lateral' : 'Compactar barra lateral'}
            className={`w-full flex items-center rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-white hover:border-slate-200 border border-transparent transition-all py-2 cursor-pointer ${
              collapsed ? 'justify-center' : 'justify-between px-3.5'
            }`}
          >
            {!collapsed && <span className="text-[11px]">Compactar Menú</span>}
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}

        <Link
          href="/"
          target="_blank"
          title={collapsed ? 'Ver Tienda' : undefined}
          className={`flex items-center rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white hover:border-slate-200 border border-transparent transition-all py-2 ${
            collapsed ? 'justify-center' : 'justify-between px-3.5'
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            {!collapsed && <span>Ver Tienda</span>}
          </span>
          {!collapsed && <ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
        </Link>

        <button
          onClick={handleSignOut}
          title={collapsed ? 'Cerrar Sesión' : undefined}
          className={`w-full flex items-center rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer py-2 ${
            collapsed ? 'justify-center' : 'gap-2.5 px-3.5'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className={`hidden md:block fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        {renderContent(isCollapsed, false)}
      </aside>

      {/* Mobile Slide-in Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150">
          <div 
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {renderContent(false, true)}
          </div>
        </div>
      )}
    </>
  );
}
