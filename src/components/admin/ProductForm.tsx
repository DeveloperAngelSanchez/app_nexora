'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Sparkles, 
  Layers, 
  DollarSign, 
  Package, 
  Check, 
  AlertCircle,
  Camera,
  ScanLine
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { ImageUploader } from './ImageUploader';
import { createProduct, updateProduct } from '@/lib/admin/products';
import { useRemoteScanHost } from '@/lib/admin/useRemoteScanSession';

const BarcodeScannerModal = dynamic(
  () => import('./BarcodeScannerModal').then((mod) => mod.BarcodeScannerModal),
  { ssr: false }
);

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductFormProps {
  initialData?: any;
  categories: CategoryOption[];
  isEditing?: boolean;
}

export function ProductForm({ initialData, categories, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [justScanned, setJustScanned] = useState(false);

  // Form states
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [barcode, setBarcode] = useState(
    initialData?.barcode || (!isEditing ? searchParams?.get('barcode') || '' : '')
  );

  // Continuous background remote scan receiver (fills barcode in real-time even with modal closed!)
  useRemoteScanHost((scanData) => {
    if (scanData?.barcode) {
      setBarcode(scanData.barcode);
      setJustScanned(true);
      setTimeout(() => setJustScanned(false), 3000);
    }
  });
  const [brandName, setBrandName] = useState(initialData?.brand_name || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories[0]?.id || '');
  const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : '');
  const [regularPrice, setRegularPrice] = useState(initialData?.regular_price ? String(initialData.regular_price) : '');
  const [stock, setStock] = useState(initialData?.stock !== undefined ? String(initialData.stock) : '10');
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured || false);
  const [isBestSeller, setIsBestSeller] = useState(initialData?.is_best_seller || false);
  const [isNew, setIsNew] = useState(initialData?.is_new || false);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [description, setDescription] = useState(initialData?.description || '');
  const [features, setFeatures] = useState<string[]>(
    Array.isArray(initialData?.features) && initialData.features.length > 0
      ? initialData.features
      : ['']
  );
  const [images, setImages] = useState<string[]>(
    Array.isArray(initialData?.images) ? initialData.images : []
  );

  // Helper auto slug generator from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated);
    }
  };

  const handleAddFeature = () => {
    setFeatures((prev) => [...prev, '']);
  };

  const handleFeatureChange = (idx: number, val: string) => {
    setFeatures((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const priceNum = parseFloat(price);
    const regularPriceNum = regularPrice ? parseFloat(regularPrice) : null;
    const stockNum = parseInt(stock, 10) || 0;

    if (!name.trim()) {
      setErrorMsg('El nombre del producto es obligatorio.');
      setLoading(false);
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg('El precio de venta debe ser un número mayor a 0.');
      setLoading(false);
      return;
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      barcode: barcode.trim() || null,
      brand: brandName.trim() || 'Genérico',
      category_id: categoryId || (categories.length > 0 ? categories[0].id : ''),
      price: priceNum,
      regular_price: regularPriceNum,
      stock: stockNum,
      in_stock: stockNum > 0,
      is_featured: isFeatured,
      is_best_seller: isBestSeller,
      is_new: isNew,
      is_active: isActive,
      description: description.trim(),
      features: features.filter((f) => f.trim().length > 0),
      images: images.filter((img) => img.trim().length > 0),
    };

    try {
      let res;
      if (isEditing && initialData?.id) {
        res = await updateProduct(initialData.id, payload);
      } else {
        res = await createProduct(payload);
      }

      if (res.success) {
        router.push('/nxd-92f/productos');
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Error al guardar el producto.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl pb-16">
      
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/nxd-92f/productos"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {isEditing ? `Editar: ${initialData?.name || 'Producto'}` : 'Crear Nuevo Producto'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Completa la información técnica, precios e imágenes para el catálogo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/nxd-92f/productos"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Guardando...' : isEditing ? 'Actualizar Producto' : 'Guardar y Publicar'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Column (Data) & Right Column (Media & Settings) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card: Basic Info */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Información Principal</span>
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="ej. Cargador GaN UGREEN Nexode 65W 3 Puertos"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Barcode Field with Scan Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Código de Barras (EAN / UPC / SKU)
                    </label>
                    {justScanned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full animate-bounce">
                        ✓ ¡Escaneado desde tu móvil!
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Escanear con Cámara o Celular</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="ej. 6957303893456"
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-slate-900 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold transition-all ${
                      justScanned
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="absolute right-2 top-2 p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Abrir Escáner"
                  >
                    <ScanLine className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Código único para identificar el producto físicamente con lectores y cámaras.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Slug (URL amigable) *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="cargador-gan-ugreen-65w"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Marca / Fabricante
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="ej. Apple, UGREEN, Baseus"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Descripción Detallada
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe los beneficios clave, compatibilidad, especificaciones y garantía..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 leading-relaxed font-normal"
                />
              </div>
            </div>
          </div>

          {/* Card: Features Bullets */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Especificaciones (Bullets)</span>
              </h2>
              <button
                type="button"
                onClick={handleAddFeature}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Especificación</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    placeholder="ej. Potencia de salida de 65W Max USB-C"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                  {features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card: Images Uploader */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <ImageUploader images={images} onChange={setImages} />
          </div>

        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card: Pricing & Stock */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Precio e Inventario</span>
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Precio de Oferta / Venta (S/) *
                </label>
                <input
                  type="number"
                  step="0.10"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="89.90"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Precio Regular / Tachado (S/)
                </label>
                <input
                  type="number"
                  step="0.10"
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(e.target.value)}
                  placeholder="129.90"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400">
                  Opcional. Se mostrará tachado si es mayor al precio de venta.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Stock Disponible (unidades) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="10"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Card: Category Selection */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Categoría</span>
            </h2>

            {categories.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Puedes agregar más categorías desde el módulo de Categorías.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <p className="text-xs font-bold text-amber-900">
                  No hay categorías registradas aún.
                </p>
                <p className="text-[11px] text-amber-700">
                  Puedes guardar el producto ahora y asignarle categoría luego, o crear una nueva.
                </p>
                <Link
                  href="/nxd-92f/categorias"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                >
                  + Ir a Gestión de Categorías
                </Link>
              </div>
            )}
          </div>

          {/* Card: Badges & Visibility */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Visibilidad y Destacados
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Producto Activo</p>
                  <p className="text-[10px] text-slate-500">Visible para clientes en la tienda</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Destacado (Home)</p>
                  <p className="text-[10px] text-slate-500">Aparecerá en el bloque principal</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Más Vendido (Badge)</p>
                  <p className="text-[10px] text-slate-500">Insignia "Best Seller" en la tarjeta</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(e) => setIsNew(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Lanzamiento Nuevo</p>
                  <p className="text-[10px] text-slate-500">Insignia "Nuevo" en la tarjeta</p>
                </div>
              </label>
            </div>
          </div>

        </div>

      </div>

      {/* Barcode Scanner Modal for form autofill */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectBarcode={(code) => setBarcode(code)}
        autoRedirect={false}
      />

    </form>
  );
}
