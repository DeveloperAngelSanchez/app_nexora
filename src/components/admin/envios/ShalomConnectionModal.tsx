'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Lock, Loader2, AlertCircle, Check } from 'lucide-react';
import type { ShalomConnectionState } from '@/lib/shalom/storage';

interface ShalomConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: ShalomConnectionState;
  onUpdated: (newConnection: ShalomConnectionState) => void;
}

export function ShalomConnectionModal({
  isOpen,
  onClose,
  connection,
  onUpdated,
}: ShalomConnectionModalProps) {
  const [email, setEmail] = useState(connection.shalom_email || '');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(connection.terms_accepted || false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setErrorMsg('Debes aceptar obligatoriamente los Términos de Servicio y la Delegación Técnica.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Ingresa tu correo y contraseña de Shalom Pro.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/envios/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          terms_accepted: termsAccepted,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Fallo en la vinculación.');
      }

      onUpdated(data.connection);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con la cuenta de Shalom.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/envios/connection', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        onUpdated(data.connection);
        setConfirmDisconnect(false);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg('Error al desvincular cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden z-10 my-8">
        {/* Cabecera */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Vinculación de Cuenta Shalom Pro
              </h3>
              <p className="text-xs text-slate-500">
                Delegación Técnica y Desbloqueo de Datos Enriquecidos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {connection.is_connected && !confirmDisconnect ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    Cuenta Vinculada Activa
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Sesión activa con el correo: <strong>{connection.shalom_email}</strong>.
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Modo enriquecido habilitado: consultas de dirección exacta, agencia de destino y descarga de facturas en PDF.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDisconnect(true)}
                  className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Desvincular Cuenta
                </button>
              </div>
            </div>
          ) : confirmDisconnect ? (
            <div className="space-y-4 p-5 rounded-2xl bg-amber-50 border border-amber-200">
              <h4 className="text-sm font-bold text-amber-900">
                ¿Deseas desvincular tu cuenta de Shalom?
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                De conformidad con la Cláusula de Revocación del Consentimiento (Ley N° 29733), tus tokens y credenciales de Shalom serán eliminados inmediatamente e irreversiblemente del servidor.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDisconnect(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 cursor-pointer flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirmar y Desvincular</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-5">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Cuadro de Términos y Condiciones Legales con Scroll (Fiel al Plan Sección 4.3) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Términos y Condiciones Legales (Ley N° 29733 y Ley N° 30096)
                </label>
                <div className="h-44 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-3 leading-relaxed font-sans select-text">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1">
                    CLÁUSULA DE EXONERACIÓN DE RESPONSABILIDAD Y DELEGACIÓN TÉCNICA SHALOM
                  </div>
                  <p>
                    <strong>1. NATURALEZA DEL SERVICIO:</strong> Nuestra plataforma es una herramienta independiente de gestión logística. NO poseemos afiliación comercial directa ni patrocinio con SHALOM EMPRESARIAL S.A.C.
                  </p>
                  <p>
                    <strong>2. AUTORIZACIÓN DE MANDATO Y DELEGACIÓN TÉCNICA:</strong> Al ingresar sus credenciales de acceso (correo y clave de Shalom Pro) y presionar &quot;Aceptar y Vincular Cuenta&quot;, confiere a nuestra plataforma una autorización voluntaria para actuar como su agente automatizado para:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Iniciar sesión de forma segura y cifrada en las interfaces oficiales de Shalom.</li>
                    <li>Sincronizar y obtener el estado, agencias de origen/destino, fechas y comprobantes asociados a sus órdenes.</li>
                    <li>Emitir alertas automáticas en su panel de administración.</li>
                  </ul>
                  <p>
                    <strong>3. SEGURIDAD Y PRIVACIDAD DE DATOS (LEY N° 29733):</strong> Sus credenciales no se comparten con terceros. Se almacenan bajo cifrado seguro en reposo (AES-256) y TLS en tránsito. La información extraída solo será visible dentro de su sesión privada.
                  </p>
                  <p>
                    <strong>4. EXONERACIÓN DE RESPONSABILIDAD:</strong> La disponibilidad y exactitud de la información dependen de los servidores centrales de Shalom.
                  </p>
                  <p>
                    <strong>5. REVOCACIÓN DEL CONSENTIMIENTO:</strong> Puede revocar en cualquier momento la vinculación, provocando la destrucción inmediata de tokens y accesos.
                  </p>
                </div>
              </div>

              {/* Checkbox Obligatorio */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 mt-0.5"
                />
                <span className="text-xs text-slate-700 font-medium leading-tight">
                  He leído, comprendo y acepto los Términos de Servicio y la Cláusula de Delegación Técnica conforme a la Ley de Protección de Datos Personales.
                </span>
              </label>

              {/* Campos de Credenciales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Correo Shalom Pro <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contraseña Shalom Pro <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Cifrado militar AES-256 en reposo y transmisión segura HTTPS.</span>
              </div>

              {/* Botón Submit */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading || !termsAccepted}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Aceptar y Vincular Cuenta</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
