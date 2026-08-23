import React from 'react';
import Link from 'next/link';
import { 
  Package, 
  Layers, 
  ShoppingBag, 
  AlertTriangle, 
  Plus, 
  ArrowRight,
  Clock,
  TrendingUp,
  Tag
} from 'lucide-react';
import { getAdminProducts } from '@/lib/admin/products';
import { getAdminCategories } from '@/lib/admin/categories';
import { getAdminOrders } from '@/lib/admin/orders';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';

export const revalidate = 0; // Dynamic server render

export default async function AdminDashboardPage() {
  const [products, categories, orders] = await Promise.all([
    getAdminProducts(),
    getAdminCategories(),
    getAdminOrders(),
  ]);

  const activeProducts = products.filter((p) => p.is_active);
  const lowStockProducts = products.filter((p) => p.stock <= 5 && p.is_active);
  const pendingOrders = orders.filter((o) => o.status === 'pending');

  const stats = [
    {
      label: 'Productos Activos',
      value: activeProducts.length,
      sublabel: `${products.length} productos en total`,
      icon: Package,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200/80',
      href: '/nxd-92f/productos',
    },
    {
      label: 'Stock Bajo (≤ 5)',
      value: lowStockProducts.length,
      sublabel: 'Requieren reposición',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200/80',
      href: '/nxd-92f/productos?stock=low',
    },
    {
      label: 'Categorías Creadas',
      value: categories.length,
      sublabel: 'Estructura de catálogo',
      icon: Layers,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-200/80',
      href: '/nxd-92f/categorias',
    },
    {
      label: 'Pedidos Totales',
      value: orders.length,
      sublabel: `${pendingOrders.length} pendientes de atención`,
      icon: ShoppingBag,
      color: 'text-teal-600',
      bg: 'bg-teal-50 border-teal-200/80',
      href: '/nxd-92f/pedidos',
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Panel General
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Resumen en tiempo real del inventario, catálogo y pedidos registrados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/nxd-92f/productos/nuevo"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Producto</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all group block"
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} border flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="mt-4">
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">{stat.label}</p>
                <p className="text-[11px] text-slate-400 mt-1">{stat.sublabel}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Fast Shortcuts Bar if 0 products */}
      {products.length === 0 && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              ¡Tu tienda está lista para recibir sus primeros productos!
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Empieza creando las categorías principales y luego publica tus productos con fotos, precios y variantes.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/nxd-92f/categorias"
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs"
            >
              1. Crear Categorías
            </Link>
            <Link
              href="/nxd-92f/productos/nuevo"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              2. Publicar Producto
            </Link>
          </div>
        </div>
      )}

      {/* Two Column Section: Recent Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Products */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Últimos Productos Agregados</h2>
            </div>
            <Link href="/nxd-92f/productos" className="text-xs text-emerald-600 hover:text-emerald-700 font-bold">
              Ver todos ({products.length}) →
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay productos registrados todavía.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {products.slice(0, 5).map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">NX</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {p.brand_name || 'Sin marca'} • Stock: <span className={p.stock <= 5 ? 'text-amber-600 font-bold' : 'text-slate-600'}>{p.stock}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-slate-900">
                      S/ {Number(p.price).toFixed(2)}
                    </span>
                    <Link
                      href={`/nxd-92f/productos/${p.id}/editar`}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Pedidos Recientes</h2>
            </div>
            <Link href="/nxd-92f/pedidos" className="text-xs text-emerald-600 hover:text-emerald-700 font-bold">
              Ver todos ({orders.length}) →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay pedidos registrados todavía.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{o.order_number}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="text-xs text-slate-600 truncate">{o.customer_name} • {o.city}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-black text-emerald-600">
                      S/ {Number(o.total).toFixed(2)}
                    </span>
                    <Link
                      href={`/nxd-92f/pedidos/${o.id}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
