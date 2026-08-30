'use client';

import React, { useState } from 'react';
import { UploadCloud, Link as LinkIcon, Trash2, Check, AlertCircle, Plus, Image as ImageIcon } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setErrorMsg(null);

    const supabase = createSupabaseBrowserClient();
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (error) {
          throw new Error(`Error subiendo imagen: ${error.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      onChange([...images, ...uploadedUrls]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al subir la imagen.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddUrl = () => {
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setErrorMsg('La URL de la imagen debe comenzar con http:// o https://');
      return;
    }

    onChange([...images, cleanUrl]);
    setUrlInput('');
    setErrorMsg(null);
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const copy = [...images];
    const item = copy.splice(index, 1)[0];
    copy.unshift(item);
    onChange(copy);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
            Galería de Imágenes del Producto
          </label>
          <p className="text-[11px] text-slate-500 font-medium">
            Sube fotos a Supabase Storage o pega URLs externas. La primera será la portada.
          </p>
        </div>
        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          {images.length} {images.length === 1 ? 'imagen' : 'imágenes'}
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dual Upload Options: File & URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1. Direct File Upload Dropzone */}
        <label
          className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-white transition-all cursor-pointer text-center group ${
            uploading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-emerald-600 transition-colors mb-2" />
          <span className="text-xs font-bold text-slate-800">
            {uploading ? 'Subiendo imagen...' : 'Subir archivos locales'}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            PNG, JPG, WEBP hasta 5MB
          </span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {/* 2. Direct External URL Input (No nested form tag to avoid page reload) */}
        <div className="flex flex-col justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Pegar URL externa</span>
            </span>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddUrl();
                }
              }}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim()}
            className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Imagen</span>
          </button>
        </div>

      </div>

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-slate-200 bg-white p-2 overflow-hidden shadow-2xs"
            >
              <div className="aspect-square rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden mb-1.5 relative border border-slate-100">
                <img
                  src={img}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {idx === 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    Portada
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-1 text-[11px]">
                {idx !== 0 ? (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="text-xs text-slate-500 hover:text-emerald-700 font-bold cursor-pointer"
                  >
                    Hacer portada
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700">Principal</span>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Eliminar foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
