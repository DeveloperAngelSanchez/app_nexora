# Nexora Store (`app_nexora_store`) - Plan de Arquitectura y Desarrollo

## 1. Misión del Proyecto
E-commerce tecnológico de alta conversión enfocado en productos Apple, Ugreen, Cases, Cargadores, Smartwatches y Accesorios.
Inspirado en la estructura y catálogo de [tecnoofertas.pe](https://tecnoofertas.pe/), pero con diseño ultramoderno, microanimaciones, modo oscuro/claro y rendimiento ultraveloz.

---

## 2. Optimización para Límites Gratuitos (Vercel & Supabase)
Para un estimado de ~500 visitas/mes, la arquitectura está diseñada para consumir **menos del 1%** del Free Tier:

- **Vercel Hobby Tier (100GB Bandwidth, Edge Cache)**:
  - Todas las páginas de productos y catálogo utilizan **ISR (Incremental Static Regeneration)** y **SSG (Static Site Generation)**.
  - La tienda se sirve desde el CDN global en milisegundos sin coste de cómputo repetitivo.
- **Supabase Free Tier (500MB DB, 1GB Storage, 50k MAU)**:
  - Consultas a base de datos mínimas (solo durante revalidación y checkout/pedidos).
  - Storage optimizado para assets en formato WebP comprimido.

---

## 3. Stack Tecnológico Seleccionado
- **Framework Frontend & Backend**: Next.js 15+ (App Router) + React 19 + TypeScript.
- **Gestor de Paquetes**: `pnpm` (rápido, seguro y eficiente en espacio de disco).
- **Estilos & UI**: Tailwind CSS + Lucide Icons + microinteracciones en CSS puro.
- **Base de Datos & Auth**: Supabase (PostgreSQL + RLS + Client SDK).
- **Estado Global (Carrito)**: Zustand con persistencia en `localStorage`.
- **Scraping / Catalog Seeder**: Node.js + Cheerio + Axios para extracción automatizada de catálogo de tecnoofertas.pe.
- **Conversión**: Checkout Híbrido (Orden directa vía WhatsApp con formato detallado + Pasarela online).

---

## 4. Fases de Ejecución

- [x] **Fase 1**: Análisis de tecnoofertas.pe, definición del stack tecnológico y solicitud de permisos.
- [x] **Fase 2**: Inicialización del proyecto Next.js en `htdocs/app_nexora_store` con `pnpm`, Tailwind CSS, Lucide Icons, Supabase SDK y Zustand.
- [x] **Fase 3**: Script de Web Scraping & Extracción de catálogo (Apple, Ugreen, Cases, Cargadores, Smartwatch, Packs) y generación de `src/data/catalog.json` (157+ productos).
- [x] **Fase 4**: Definición del Schema SQL para Supabase (`supabase/schema.sql`) con fallback offline y motor de consulta `src/lib/catalog.ts`.
- [x] **Fase 5**: Desarrollo del Frontend:
  - Header premium con buscador instantáneo, selector de moneda y carrito flotante.
  - Hero Slider dinámico con banners promocionales Apple & Ugreen.
  - Grid de productos con badges de descuento, filtros por marca/categoría y vista rápida.
  - Ficha de detalle de producto con galería de imágenes y selector de variantes (color/modelo).
  - Drawer del carrito con cálculo en tiempo real y Checkout con derivación a WhatsApp / pasarela.
  - Catálogo completo interactivo con filtros (`/catalogo`).
- [x] **Fase 6**: Testing, verificación en navegador y preparación para Deploy en Vercel (162 páginas SSG generadas).
