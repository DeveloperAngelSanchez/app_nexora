import { generateShalomBearer, decryptShalomPayload } from './crypto';
import type { ShalomStatusResponse, ShalomTrackingResult } from './types';

const BASE_URL = 'https://serviceswebapi.shalomcontrol.com/api/v1/web';

/**
 * Consulta el estado de un envío en Shalom a través del endpoint /rastrea/estados
 * utilizando su ose_id.
 */
export async function getShalomStatusByOseId(
  oseId: string | number,
  authToken?: string
): Promise<ShalomStatusResponse> {
  const bearer = generateShalomBearer();
  const formData = new FormData();
  formData.append('ose_id', String(oseId));

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
