'use client';

import React from 'react';

interface ShalomTruckRoadAnimationProps {
  isMoving?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ShalomTruckRoadAnimation({
  isMoving = true,
  className = '',
  size = 'md',
}: ShalomTruckRoadAnimationProps) {
  // Ajuste de escala según tamaño
  const scaleMap = {
    sm: 'w-24 h-16',
    md: 'w-36 h-24 sm:w-44 sm:h-28',
    lg: 'w-48 h-32',
  };

  return (
    <div className={`relative flex items-center justify-center select-none overflow-hidden ${scaleMap[size]} ${className}`}>
      <style jsx>{`
        /* Animación de la pista desplazándose en perspectiva hacia atrás */
        @keyframes roadDashesMove {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -56;
          }
        }

        /* Micro-vibración de suspensión del camión */
        @keyframes truckSuspension {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-1.2px) rotate(0.2deg);
          }
          50% {
            transform: translateY(0.5px) rotate(-0.15deg);
          }
          75% {
            transform: translateY(-0.8px) rotate(0.1deg);
          }
        }

        /* Rotación continua de neumáticos */
        @keyframes wheelRotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Pulso de sombra en sincronía con el chasis */
        @keyframes shadowPulse {
          0%, 100% {
            transform: scaleX(1) scaleY(1);
            opacity: 0.35;
          }
          50% {
            transform: scaleX(1.05) scaleY(0.95);
            opacity: 0.45;
          }
        }

        /* Estela sutil de viento/velocidad */
        @keyframes windStream {
          0% {
            transform: translateX(10px);
            opacity: 0;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            transform: translateX(-40px);
            opacity: 0;
          }
        }

        .anim-road-moving {
          animation: roadDashesMove 0.7s linear infinite;
        }

        .anim-truck-moving {
          animation: truckSuspension 0.45s ease-in-out infinite;
          will-change: transform;
        }

        .anim-wheel-moving {
          animation: wheelRotate 0.6s linear infinite;
          transform-origin: center;
        }

        .anim-shadow-moving {
          animation: shadowPulse 0.45s ease-in-out infinite;
          transform-origin: center;
        }

        .anim-wind-1 {
          animation: windStream 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .anim-wind-2 {
          animation: windStream 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.3s;
        }
      `}</style>

      {/* Estelas sutiles de velocidad aerodinámica cuando está en movimiento */}
      {isMoving && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          viewBox="0 0 200 120"
          fill="none"
        >
          <line
            x1="180"
            y1="35"
            x2="150"
            y2="35"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="anim-wind-1 opacity-40"
          />
          <line
            x1="165"
            y1="50"
            x2="135"
            y2="50"
            stroke="#94a3b8"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="anim-wind-2 opacity-50"
          />
        </svg>
      )}

      {/* SVG Principal: Pista, Sombra y Camión Shalom */}
      <svg
        viewBox="0 0 220 130"
        className="w-full h-full overflow-visible z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Sombra de la pista */}
          <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Rojo corporativo Shalom */}
          <linearGradient id="shalomRed" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>

          {/* Brillo de cabina */}
          <linearGradient id="cabinGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          {/* Detalle metal parachoque */}
          <linearGradient id="bumperGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>

        {/* 1. PISTA / CARRETERA EN PERSPECTIVA (Fiel a Shalom) */}
        <g id="roadGroup">
          {/* Base de asfalto en perspectiva oblicua */}
          <path
            d="M 12 110 L 195 106 Q 206 106 208 100 L 214 96 Q 216 93 210 93 L 26 95 Q 12 95 10 102 Z"
            fill="url(#roadGradient)"
            opacity="0.85"
          />

          {/* Borde exterior de la pista */}
          <path
            d="M 12 110 L 195 106"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* Línea central discontinua de la pista con movimiento infinito */}
          <path
            d="M 22 103 L 202 99"
            stroke="#ffffff"
            strokeWidth="2.8"
            strokeDasharray="14 14"
            strokeLinecap="round"
            className={isMoving ? 'anim-road-moving' : ''}
            opacity="0.9"
          />
        </g>

        {/* 2. SOMBRA DEL CAMIÓN */}
        <g className={isMoving ? 'anim-shadow-moving' : ''}>
          <ellipse
            cx="98"
            cy="104"
            rx="74"
            ry="7"
            fill="#0f172a"
            opacity="0.4"
          />
        </g>

        {/* 3. CAMIÓN SHALOM (Chasis con micro-rebote de suspensión) */}
        <g id="truckBody" className={isMoving ? 'anim-truck-moving' : ''}>
          {/* --- FURGÓN TRASERO ROJO SHALOM --- */}
          <rect
            x="32"
            y="32"
            width="82"
            height="56"
            rx="8"
            fill="url(#shalomRed)"
          />
          {/* Relieve / bisel superior del furgón */}
          <path
            d="M 32 40 Q 32 32 40 32 L 106 32 Q 114 32 114 40 L 114 44 L 32 44 Z"
            fill="#ef4444"
            opacity="0.6"
          />

          {/* LOGO SHALOM (Círculo blanco con 'S' cursiva en el furgón) */}
          <g transform="translate(68, 57)">
            {/* Círculo ovalado inclinado */}
            <ellipse
              cx="0"
              cy="0"
              rx="15"
              ry="13"
              fill="#ffffff"
            />
            {/* Letra 'S' de Shalom estilizada */}
            <path
              d="M 4.5 -6 C 1 -7.5 -4 -7 -6.5 -4 C -8.5 -1.5 -8 2 -4 3.5 L 2 5.5 C 5 6.5 5 8.5 3 9.5 C 0.5 10.5 -4 10 -7 8 M -4 6 C -1 7.5 4 7 6.5 4 C 8.5 1.5 8 -2 4 -3.5 L -2 -5.5 C -5 -6.5 -5 -8.5 -3 -9.5 C -0.5 -10.5 4 -10 7 -8"
              stroke="#dc2626"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>

          {/* --- CABINA DEL CAMIÓN --- */}
          {/* Contorno frontal cabina aerodinámica */}
          <path
            d="M 114 44 
               L 138 44 
               Q 148 44 154 52 
               L 168 70 
               Q 172 75 170 82 
               L 170 88 
               L 114 88 Z"
            fill="url(#shalomRed)"
          />

          {/* Techo cabina */}
          <path
            d="M 114 42 L 138 42 Q 146 42 152 49 L 114 49 Z"
            fill="#ef4444"
          />

          {/* Parabrisas / Ventana Frontal (Blanco / Celeste claro) */}
          <path
            d="M 122 49 
               L 138 49 
               Q 144 49 148 54 
               L 156 66 
               Q 158 69 154 69 
               L 122 69 Z"
            fill="url(#cabinGlass)"
          />

          {/* Ventanilla lateral pequeña */}
          <path
            d="M 158 58 L 163 65 Q 164 68 161 68 L 157 68 Z"
            fill="#cbd5e1"
            opacity="0.8"
          />

          {/* Faro delantero (Luz cálida amarilla/blanca) */}
          <path
            d="M 167 78 L 171 80 Q 172 83 169 85 L 166 85 Z"
            fill="#fef08a"
          />
          {isMoving && (
            <circle cx="172" cy="82" r="3" fill="#fef08a" opacity="0.6" />
          )}

          {/* Paragolpes delantero / Guardafangos */}
          <rect
            x="162"
            y="85"
            width="10"
            height="5"
            rx="2.5"
            fill="url(#bumperGrad)"
          />

          {/* Chasis inferior oscuro */}
          <rect
            x="36"
            y="85"
            width="128"
            height="5"
            rx="1.5"
            fill="#1e293b"
          />

          {/* --- NEUMÁTICOS Y RINES --- */}
          {/* Neumático Trasero 1 */}
          <g transform="translate(54, 90)">
            <circle cx="0" cy="0" r="11" fill="#1e293b" />
            <circle cx="0" cy="0" r="8" fill="#334155" />
            <circle cx="0" cy="0" r="4.5" fill="#cbd5e1" />
            {/* Radios giratorios cuando se mueve */}
            <g className={isMoving ? 'anim-wheel-moving' : ''}>
              <line x1="-7" y1="0" x2="7" y2="0" stroke="#64748b" strokeWidth="1.2" />
              <line x1="0" y1="-7" x2="0" y2="7" stroke="#64748b" strokeWidth="1.2" />
            </g>
            <circle cx="0" cy="0" r="2" fill="#0f172a" />
          </g>

          {/* Neumático Delantero */}
          <g transform="translate(142, 90)">
            <circle cx="0" cy="0" r="11" fill="#1e293b" />
            <circle cx="0" cy="0" r="8" fill="#334155" />
            <circle cx="0" cy="0" r="4.5" fill="#cbd5e1" />
            {/* Radios giratorios cuando se mueve */}
            <g className={isMoving ? 'anim-wheel-moving' : ''}>
              <line x1="-7" y1="0" x2="7" y2="0" stroke="#64748b" strokeWidth="1.2" />
              <line x1="0" y1="-7" x2="0" y2="7" stroke="#64748b" strokeWidth="1.2" />
            </g>
            <circle cx="0" cy="0" r="2" fill="#0f172a" />
          </g>
        </g>
      </svg>
    </div>
  );
}
