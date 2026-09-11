'use client';

import React from 'react';
import { Download, Check, ExternalLink } from 'lucide-react';
import { ShalomTruckRoadAnimation } from './ShalomTruckRoadAnimation';
import type { ShalomTrackingResult } from '@/lib/shalom/types';

interface ShalomStatusCardProps {
  tracking: ShalomTrackingResult;
  onDownloadGrt?: () => void;
  className?: string;
}

export function ShalomStatusCard({
  tracking,
  onDownloadGrt,
  className = '',
}: ShalomStatusCardProps) {
  const isTransito = tracking.estado.toLowerCase().includes('tránsito') || tracking.estado.toLowerCase().includes('transito');
  const isDestino = tracking.estado.toLowerCase().includes('destino');
  const isEntregado = tracking.estado.toLowerCase().includes('entregado');
  const isOrigen = tracking.estado.toLowerCase().includes('origen');

  // Evaluación de progreso en los 4 pasos estándar de Shalom
  const step1Passed = true; // Si existe orden, al menos ya se originó
  const step2Passed = isTransito || isDestino || isEntregado;
  const step3Passed = isDestino || isEntregado;
  const step4Passed = isEntregado;

  // Formato amigable de fecha si existe
  const formattedDate = tracking.fecha_estado
    ? tracking.fecha_estado
    : 'Actualizado recientemente';

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-6 select-none transition-all w-full max-w-full overflow-hidden ${className}`}>
      {/* SECCIÓN SUPERIOR: Vehículo + Títulos + N° de Orden */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5">
        {/* Izquierda: Camión animado y Textos */}
        <div className="flex items-center gap-3 sm:gap-5 w-full lg:w-auto min-w-0">
          {/* Animación del camión con pista en movimiento */}
          <div className="shrink-0 bg-slate-50/60 rounded-2xl p-1 border border-slate-100">
            <ShalomTruckRoadAnimation isMoving={isTransito} size="md" />
          </div>

          {/* Información principal de estado */}
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-red-600 tracking-tight whitespace-nowrap">
                {tracking.estado}
              </h2>

              {/* Badge GRT idéntico a la imagen de Shalom */}
              <button
                type="button"
                onClick={onDownloadGrt}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-red-500 text-red-600 hover:bg-red-50 active:scale-95 text-xs font-bold transition-all shadow-2xs cursor-pointer group whitespace-nowrap"
                title="Descargar Guía de Remisión Transportista"
              >
                <Download className="w-3.5 h-3.5 text-red-600 group-hover:translate-y-0.5 transition-transform" />
                <span>GRT</span>
              </button>

              {tracking.comprobante_pdf && (
                <a
                  href={tracking.comprobante_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-all whitespace-nowrap"
                  title="Ver Comprobante Electrónico en Nubefact"
                >
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>PDF Factura</span>
                </a>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 truncate">
              {tracking.subtitulo || 'Rumbo a su destino.'}
            </p>

            {tracking.carguero && (
              <span className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Vehículo asignado: <strong className="text-slate-700 font-mono">#{tracking.carguero}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Derecha: N° de Orden y Fecha */}
        <div className="text-left lg:text-right w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
          <div className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wide whitespace-nowrap">
            N° DE ORDEN: <span className="font-mono text-slate-950 font-black">{tracking.numero}</span>
            {tracking.codigo && (
              <span className="ml-1.5 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono font-bold">
                {tracking.codigo}
              </span>
            )}
          </div>
          <div className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium whitespace-nowrap">
            Desde el {formattedDate}
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: Stepper Horizontal 100% Fluido y Elástico */}
      <div className="mt-2 pt-4 border-t border-slate-100 w-full overflow-hidden">
        <div className="flex items-center justify-between w-full max-w-3xl mx-auto px-1 sm:px-4 py-1">
          
          {/* HITO 1: EN ORIGEN */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs ring-4 ring-white">
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 mt-2 text-center whitespace-nowrap">
              En origen
            </span>
          </div>

          {/* LÍNEA 1-2 */}
          <div className="flex-1 h-1 sm:h-1.5 mx-1.5 sm:mx-3 rounded-full bg-red-500 mb-5 min-w-[20px]" />

          {/* HITO 2: EN TRÁNSITO */}
          <div className="flex flex-col items-center shrink-0">
            <div 
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs transition-transform ${
                step2Passed 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white border-2 border-red-200'
              }`}
            >
              {step2Passed ? (
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-red-200" />
              )}
            </div>
            <span 
              className={`text-[11px] sm:text-xs mt-2 text-center font-bold whitespace-nowrap ${
                step2Passed ? 'text-slate-800' : 'text-slate-500'
              }`}
            >
              En tránsito
            </span>
          </div>

          {/* LÍNEA 2-3 */}
          <div 
            className={`flex-1 h-1 sm:h-1.5 mx-1.5 sm:mx-3 rounded-full mb-5 min-w-[20px] transition-colors ${
              step3Passed ? 'bg-red-500' : 'bg-red-100'
            }`} 
          />

          {/* HITO 3: EN DESTINO */}
          <div className="flex flex-col items-center shrink-0">
            <div 
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                step3Passed 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white border-2 border-red-200'
              }`}
            >
              {step3Passed ? (
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-red-200" />
              )}
            </div>
            <span 
              className={`text-[11px] sm:text-xs mt-2 text-center whitespace-nowrap ${
                step3Passed ? 'text-slate-800 font-bold' : 'text-slate-500 font-medium'
              }`}
            >
              En destino
            </span>
          </div>

          {/* LÍNEA 3-4 */}
          <div 
            className={`flex-1 h-1 sm:h-1.5 mx-1.5 sm:mx-3 rounded-full mb-5 min-w-[20px] transition-colors ${
              step4Passed ? 'bg-red-500' : 'bg-red-100'
            }`} 
          />

          {/* HITO 4: ENTREGADO */}
          <div className="flex flex-col items-center shrink-0">
            <div 
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                step4Passed 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white border-2 border-red-200'
              }`}
            >
              {step4Passed ? (
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-red-200" />
              )}
            </div>
            <span 
              className={`text-[11px] sm:text-xs mt-2 text-center whitespace-nowrap ${
                step4Passed ? 'text-slate-800 font-bold' : 'text-slate-500 font-medium'
              }`}
            >
              Entregado
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
