'use client';

import React from 'react';

export function ShalomStatusCardSkeleton() {
  return (
    <div className="space-y-4 select-none animate-in fade-in duration-300">
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .shimmer-effect {
          position: relative;
          overflow: hidden;
        }
        .shimmer-effect::after {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.4) 20%,
            rgba(255, 255, 255, 0.7) 60%,
            rgba(255, 255, 255, 0)
          );
          animation: shimmer 1.5s infinite;
          content: '';
        }
      `}</style>

      {/* Tarjeta Principal Shimmer */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 md:p-8">
        
        {/* Cabecera Shimmer */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6">
          <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
            
            {/* Silueta Camión Shimmer */}
            <div className="shrink-0 w-36 h-24 sm:w-44 sm:h-28 rounded-2xl bg-slate-100 border border-slate-200/60 shimmer-effect flex items-center justify-center">
              <div className="w-16 h-8 bg-slate-200/80 rounded-lg" />
            </div>

            {/* Textos y Badge Shimmer */}
            <div className="space-y-2.5 flex-1">
              <div className="flex items-center gap-3">
                <div className="h-7 sm:h-8 w-36 sm:w-44 bg-slate-200/90 rounded-xl shimmer-effect" />
                <div className="h-6 w-16 bg-slate-100 rounded-full border border-slate-200 shimmer-effect" />
              </div>
              <div className="h-4 w-52 bg-slate-100 rounded-md shimmer-effect" />
              <div className="h-3 w-32 bg-slate-100 rounded-md shimmer-effect" />
            </div>
          </div>

          {/* Metadatos N° Orden Shimmer */}
          <div className="w-full md:w-auto space-y-2 text-left md:text-right pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="h-6 w-48 bg-slate-200/90 rounded-lg shimmer-effect ml-0 md:ml-auto" />
            <div className="h-4 w-36 bg-slate-100 rounded-md shimmer-effect ml-0 md:ml-auto" />
          </div>
        </div>

        {/* Stepper Horizontal Shimmer Elástico */}
        <div className="mt-4 pt-4 border-t border-slate-100 w-full overflow-hidden">
          <div className="flex items-center justify-between w-full max-w-3xl mx-auto px-1 sm:px-4 py-2">
            
            {/* HITO 1 */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 ring-4 ring-white shadow-xs shimmer-effect" />
              <div className="h-3 w-12 sm:w-14 bg-slate-100 rounded-md mt-2 shimmer-effect" />
            </div>

            {/* LÍNEA 1-2 */}
            <div className="flex-1 h-1 sm:h-1.5 mx-1.5 sm:mx-3 rounded-full bg-slate-100 mb-5 min-w-[20px] shimmer-effect" />

            {/* HITO 2 */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 ring-4 ring-white shadow-xs shimmer-effect" />
              <div className="h-3 w-12 sm:w-14 bg-slate-100 rounded-md mt-2 shimmer-effect" />
            </div>

            {/* LÍNEA 2-3 */}
            <div className="flex-1 h-1 sm:h-1.5 mx-1.5 sm:mx-3 rounded-full bg-slate-100 mb-5 min-w-[20px] shimmer-effect" />

            {/* HITO 3 */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 ring-4 ring-white shadow-xs shimmer-effect" />
              <div className="h-3 w-12 sm:w-14 bg-slate-100 rounded-md mt-2 shimmer-effect" />
            </div>

            {/* LÍNEA 3-4 */}
            <div className="flex-1 h-1 sm:h-1.5 mx-1.5 sm:mx-3 rounded-full bg-slate-100 mb-5 min-w-[20px] shimmer-effect" />

            {/* HITO 4 */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 ring-4 ring-white shadow-xs shimmer-effect" />
              <div className="h-3 w-12 sm:w-14 bg-slate-100 rounded-md mt-2 shimmer-effect" />
            </div>

          </div>
        </div>
      </div>

      {/* Ficha de Ruta Logística Shimmer */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="h-4 w-52 bg-slate-200 rounded-md shimmer-effect mb-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <div className="h-3 w-28 bg-slate-200 rounded shimmer-effect" />
            <div className="h-5 w-44 bg-slate-200 rounded-lg shimmer-effect" />
            <div className="h-3 w-full bg-slate-100 rounded shimmer-effect" />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <div className="h-3 w-28 bg-slate-200 rounded shimmer-effect" />
            <div className="h-5 w-44 bg-slate-200 rounded-lg shimmer-effect" />
            <div className="h-3 w-full bg-slate-100 rounded shimmer-effect" />
          </div>
        </div>
      </div>

    </div>
  );
}
