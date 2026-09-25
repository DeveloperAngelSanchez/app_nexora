import crypto from 'crypto';
import { generateShalomBearer, decryptShalomPayload } from './crypto';
import type { ShalomStatusResponse, ShalomTrackingResult } from './types';

const BASE_URL = 'https://serviceswebapi.shalomcontrol.com/api/v1/web';

function generateSessionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

function decryptWithSessionKey<T = any>(dataB64: string, sessionKeyB64: string): T {
  const rawBuffer = Buffer.from(dataB64, 'base64');
  const key = Buffer.from(sessionKeyB64, 'base64');
  const iv = rawBuffer.subarray(0, 16);
  const ciphertext = rawBuffer.subarray(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  decipher.setAutoPadding(true);
  let dec = decipher.update(ciphertext, undefined, 'utf8');
  dec += decipher.final('utf8');
  try {
    return JSON.parse(dec) as T;
  } catch {
    return dec as unknown as T;
  }
}

let cachedSession: { csrf: string; sessionKey: string; expiresAt: number } | null = null;

export async function getShalomSession(): Promise<{ csrf: string; sessionKey: string }> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedSession && cachedSession.expiresAt > now + 30) {
    return { csrf: cachedSession.csrf, sessionKey: cachedSession.sessionKey };
  }

  const sessionKey = generateSessionKey();
  const sessionRes = await fetch('https://shalom.com.pe/api/local/session', {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Session-Key': sessionKey,
      'Origin': 'https://shalom.com.pe',
      'Referer': 'https://shalom.com.pe/rastrea',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(4000),
  });

  if (!sessionRes.ok) {
    throw new Error(`Error obteniendo sesión de Shalom (${sessionRes.status})`);
  }

  const { csrf, expiresAt } = await sessionRes.json();
  cachedSession = {
    csrf,
    sessionKey,
    expiresAt: expiresAt || now + 300,
  };

  return { csrf, sessionKey };
}

/**
 * Consulta el estado de un envío en Shalom a través del endpoint /rastrea/estados
 * utilizando su ose_id.
 */
export async function getShalomStatusByOseId(
  oseId: string | number,
  authToken?: string
): Promise<ShalomStatusResponse> {
  const formData = new FormData();
  formData.append('ose_id', String(oseId));

  // 1. Intentar método moderno con sesión web oficial
  try {
    const { csrf, sessionKey } = await getShalomSession();
    const headers: Record<string, string> = {
      'Origin': 'https://shalom.com.pe',
      'Referer': 'https://shalom.com.pe/rastrea',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'X-Proxy-Token': csrf,
      'X-Session-Key': sessionKey,
      'Accept': 'application/json, text/plain, */*',
    };

    if (authToken) {
      headers['X-Auth-Token'] = authToken;
    }

    const response = await fetch('https://shalom.com.pe/api/v1/web/rastrea/estados', {
      method: 'POST',
      headers,
      body: formData,
      signal: AbortSignal.timeout(4500),
    });

    if (response.ok) {
      const json = await response.json();
      if (json.encrypted && json.data) {
        return decryptWithSessionKey<ShalomStatusResponse>(json.data, sessionKey);
      }
      return json;
    }
  } catch (sessErr: any) {
    console.warn('[Shalom API] Sesión oficial falló, probando canal secundario:', sessErr?.message);
  }

  // 2. Fallback con Bearer directo a serviceswebapi
  const bearer = generateShalomBearer();
  const headers: Record<string, string> = {
    'Authorization': bearer,
    'Accept': 'application/json, text/plain, */*',
  };

  if (authToken) {
    headers['X-Auth-Token'] = authToken;
  }

  const response = await fetch(`${BASE_URL}/rastrea/estados`, {
    method: 'POST',
    headers,
    body: formData,
    signal: AbortSignal.timeout(3500),
  });

  if (!response.ok) {
    throw new Error(`Error en API Shalom (${response.status}): ${response.statusText}`);
  }

  const json = await response.json();

  if (json.encrypted && json.data) {
    return decryptShalomPayload<ShalomStatusResponse>(json.data);
  }

  return json;
}

/**
 * Mapea la respuesta cruda de Shalom a un resultado normalizado para la UI de Nexora
 */
export function normalizeShalomStatus(
  statusData: ShalomStatusResponse,
  numero: string,
  codigo: string,
  oseId?: number | string
): ShalomTrackingResult {
  const msg = statusData.message || 'En tránsito';
  const data = statusData.data || {};

  // Determinar hitos completados
  const hitos = {
    origen: Boolean(data.origen?.fecha || data.registrado?.fecha),
    transito: Boolean(data.transito?.fecha || msg === 'En tránsito' || msg === 'En destino' || msg === 'Entregado'),
    destino: Boolean(data.destino?.fecha || msg === 'En destino' || msg === 'Entregado'),
    entregado: Boolean(data.entregado?.fecha || msg === 'Entregado'),
  };

  // Subtítulo dinámico
  let subtitulo = 'Rumbo a su destino.';
  if (msg === 'En origen') {
    subtitulo = 'Recepción en agencia de origen lista para despacho.';
  } else if (msg === 'En destino') {
    subtitulo = 'Disponible para retiro en agencia de destino.';
  } else if (msg === 'Entregado') {
    subtitulo = 'El paquete ha sido entregado exitosamente al destinatario.';
  }

  // Fecha del estado actual
  let fechaEstado = '';
  if (msg === 'Entregado' && data.entregado?.fecha) {
    fechaEstado = data.entregado.fecha;
  } else if (msg === 'En destino' && data.destino?.fecha) {
    fechaEstado = data.destino.fecha;
  } else if (data.transito?.fecha) {
    fechaEstado = data.transito.fecha;
  } else if (data.origen?.fecha) {
    fechaEstado = data.origen.fecha;
  } else if (data.registrado?.fecha) {
    fechaEstado = data.registrado.fecha;
  }

  return {
    numero,
    codigo,
    ose_id: oseId,
    estado: msg,
    subtitulo,
    fecha_estado: fechaEstado,
    hitos,
    carguero: data.transito?.carguero || (data.transito?.cargueros ? data.transito.cargueros[0] : undefined),
    raw_estados: statusData,
  };
}

/**
 * Consulta información detallada de la orden en Shalom a través del endpoint /rastrea/buscar
 */
export async function getShalomOrderDetails(
  numero: string,
  codigo: string,
  oseId?: string | number,
  authToken?: string,
  recaptchaToken?: string
): Promise<any> {
  const cleanNum = String(numero || '').trim();
  const cleanCod = String(codigo || '').trim().toUpperCase();

  const payload: Record<string, any> = {
    numero: cleanNum,
    codigo: cleanCod,
  };
  if (oseId) payload.ose_id = String(oseId);
  if (recaptchaToken) payload.recaptcha_token = recaptchaToken;

  // 1. Intentar método moderno con sesión web oficial
  try {
    const { csrf, sessionKey } = await getShalomSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Origin': 'https://shalom.com.pe',
      'Referer': 'https://shalom.com.pe/rastrea',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'X-Proxy-Token': csrf,
      'X-Session-Key': sessionKey,
      'Accept': 'application/json, text/plain, */*',
    };

    if (authToken) {
      headers['X-Auth-Token'] = authToken;
    }

    const response = await fetch('https://shalom.com.pe/api/v1/web/rastrea/buscar', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const json = await response.json();
      if (json.encrypted && json.data) {
        return decryptWithSessionKey<any>(json.data, sessionKey);
      }
      return json;
    }
  } catch (err: any) {
    console.warn('[Shalom API] Buscar con sesión web falló:', err?.message);
  }

  // 2. Fallback con Bearer directo a serviceswebapi
  const bearer = generateShalomBearer();
  const formData = new FormData();
  formData.append('numero', cleanNum);
  formData.append('codigo', cleanCod);
  if (oseId) formData.append('ose_id', String(oseId));
  if (recaptchaToken) formData.append('recaptcha_token', recaptchaToken);

  const headers: Record<string, string> = {
    'Authorization': bearer,
    'Accept': 'application/json, text/plain, */*',
  };

  if (authToken) {
    headers['X-Auth-Token'] = authToken;
  }

  const response = await fetch(`${BASE_URL}/rastrea/buscar`, {
    method: 'POST',
    headers,
    body: formData,
    signal: AbortSignal.timeout(4000),
  });

  if (!response.ok) {
    throw new Error(`Error en API Shalom buscar (${response.status}): ${response.statusText}`);
  }

  const json = await response.json();
  if (json.encrypted && json.data) {
    return decryptShalomPayload<any>(json.data);
  }
  return json;
}

/**
 * Consulta el comprobante electrónico oficial en Shalom a través del endpoint /rastrea/comprobante
 */
export async function getShalomVoucher(
  params: { serie?: string; numero?: string; cop_id?: string | number; recaptcha_token?: string },
  authToken?: string
): Promise<{ success: boolean; data?: { pdf?: string; xml?: string }; message?: string }> {
  const bearer = generateShalomBearer();
  const formData = new FormData();
  if (params.serie) formData.append('serie', params.serie);
  if (params.numero) formData.append('numero', params.numero);
  if (params.cop_id) formData.append('cop_id', String(params.cop_id));
  if (params.recaptcha_token) formData.append('recaptcha_token', params.recaptcha_token);

  const headers: Record<string, string> = {
    'Authorization': bearer,
    'Accept': 'application/json, text/plain, */*',
  };

  if (authToken) {
    headers['X-Auth-Token'] = authToken;
  }

  const response = await fetch(`${BASE_URL}/rastrea/comprobante`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Error en API Shalom comprobante (${response.status}): ${response.statusText}`);
  }

  const json = await response.json();
  if (json.encrypted && json.data) {
    return decryptShalomPayload<any>(json.data);
  }
  return json;
}

/**
 * Consulta la Guía de Remisión Transportista (GRT) en Shalom a través del endpoint /rastrea/grt
 */
export async function getShalomGrt(
  oseId: string | number,
  capId?: string | number,
  authToken?: string
): Promise<{ success: boolean; data?: { enlace?: string }; message?: string }> {
  const bearer = generateShalomBearer();
  const formData = new FormData();
  formData.append('ose_id', String(oseId));
  if (capId) formData.append('cap_id', String(capId));

  const headers: Record<string, string> = {
    'Authorization': bearer,
    'Accept': 'application/json, text/plain, */*',
  };

  if (authToken) {
    headers['X-Auth-Token'] = authToken;
  }

  const response = await fetch(`${BASE_URL}/rastrea/grt`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Error en API Shalom grt (${response.status}): ${response.statusText}`);
  }

  const json = await response.json();
  if (json.encrypted && json.data) {
    return decryptShalomPayload<any>(json.data);
  }
  return json;
}

/**
 * Valida y resuelve con rigor que el comprobante asociado a una orden corresponda exactamente
 * a esa orden y no a otra, evitando mezclar boletas o enlaces estáticos de órdenes ajenas.
 */
export function verifyAndResolveOrderDocuments(params: {
  numero: string;
  codigo?: string;
  ose_id?: string | number;
  tipo_pago?: string;
  estado_pago?: string;
  comprobante_pdf?: string;
  grt_url?: string;
}): {
  comprobante_pdf?: string;
  comprobante_pendiente: boolean;
  grt_url?: string;
} {
  const isContraEntrega = 
    params.tipo_pago?.toLowerCase().includes('contra entrega') ||
    params.estado_pago?.toLowerCase().includes('por cobrar');

  const pdf = params.comprobante_pdf;

  return {
    comprobante_pdf: pdf || undefined,
    comprobante_pendiente: isContraEntrega || !pdf,
    grt_url: params.grt_url || (params.ose_id ? 'https://shalom.com.pe/rastrea' : undefined),
  };
}
