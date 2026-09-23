import { createSupabaseAdminClient } from '@/lib/supabase-server';

export interface ShalomStoredShipment {
  id: string;
  order_id?: string | null;
  carrier?: string;
  numero: string;
  codigo: string;
  ose_id?: number | string;
  estado: string; // 'En origen' | 'En tránsito' | 'En destino' | 'Entregado'
  subtitulo: string;
  fecha_estado: string;
  origen_nombre?: string;
  origen_direccion?: string;
  destino_nombre?: string;
  destino_direccion?: string;
  destinatario?: string;
  comprobante_pdf?: string;
  comprobante_serie?: string;
  comprobante_numero?: string;
  comprobante_pendiente?: boolean;
  grt_url?: string;
  carguero?: string;
  fecha_envio?: string;
  tipo_pago?: string;
  monto?: string;
  estado_pago?: string;
  last_checked_at: string;
  created_at: string;
}

export interface ShalomConnectionState {
  is_connected: boolean;
  shalom_email: string;
  auth_token: string;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  terms_accepted_ip?: string | null;
  status: 'active' | 'disconnected' | 'error';
  updated_at: string | null;
}

// Semilla de reserva en caso de fallo de conexión con Supabase
const FALLBACK_SHIPMENTS: ShalomStoredShipment[] = [
  {
    id: 'sh-95379502-P3PJ',
    numero: '95379502',
    codigo: 'P3PJ',
    ose_id: 98851762,
    estado: 'En destino',
    subtitulo: 'Disponible para retiro en agencia de destino.',
    fecha_estado: '11/09/26 a las 08:30',
    fecha_envio: '2026-09-10 12:57:00',
    tipo_pago: 'Contra entrega',
    monto: '12.00',
    estado_pago: 'Por cobrar (CR)',
    origen_nombre: 'Agencia Raymondi (La Victoria)',
    origen_direccion: 'JR. ANTONIO RAYMONDI NRO. 113, LA VICTORIA, LIMA',
    destino_nombre: 'Agencia Paita Sol y Mar',
    destino_direccion: 'MZ. H LT. 14 URB. SOL Y MAR, PAITA, PIURA',
    destinatario: 'Cliente Nexora Store',
    grt_url: 'https://shalom.com.pe/rastrea',
    comprobante_pendiente: true,
    carguero: '1045277',
    last_checked_at: '2026-09-11T02:51:16.323Z',
    created_at: '2026-09-10T20:00:00.000Z',
  },
  {
    id: 'sh-94567034-3KPC',
    numero: '94567034',
    codigo: '3KPC',
    ose_id: 98124501,
    estado: 'En destino',
    subtitulo: 'Disponible para retiro en agencia de destino.',
    fecha_estado: '09/09/26 a las 10:30',
    fecha_envio: '2026-09-09 10:30:00',
    tipo_pago: 'Pagado en origen',
    monto: '15.00',
    estado_pago: 'Pagado',
    origen_nombre: 'Agencia San Borja',
    origen_direccion: 'AV. AVIACIÓN 2819, SAN BORJA, LIMA (Frente a Bembos)',
    destino_nombre: 'Agencia Paita Sol y Mar',
    destino_direccion: 'MZ. H LT. 14 URB. SOL Y MAR, PAITA, PIURA',
    destinatario: 'Cliente VIP Nexora',
    comprobante_pdf: 'https://www.nubefact.com/cpe/82b646ac-150e-484e-aa6e-969c6f9123fb.pdf',
    comprobante_pendiente: false,
    grt_url: 'https://shalom.com.pe/rastrea',
    carguero: '1042190',
    last_checked_at: '2026-09-10T18:15:00.000Z',
    created_at: '2026-09-09T10:30:00.000Z',
  },
];

let fallbackConnectionState: ShalomConnectionState = {
  is_connected: false,
  shalom_email: '',
  auth_token: '',
  terms_accepted: false,
  terms_accepted_at: null,
  status: 'disconnected',
  updated_at: null,
};

function mapRowToShipment(row: any): ShalomStoredShipment {
  return {
    id: String(row.id),
    order_id: row.order_id || null,
    carrier: row.carrier || 'shalom',
    numero: String(row.numero),
    codigo: String(row.codigo).toUpperCase(),
    ose_id: row.ose_id ? Number(row.ose_id) : undefined,
    estado: row.estado || 'En origen',
    subtitulo: row.subtitulo || 'Rumbo a su destino.',
    fecha_estado: row.fecha_estado || '',
    origen_nombre: row.origen_nombre || undefined,
    origen_direccion: row.origen_direccion || undefined,
    destino_nombre: row.destino_nombre || undefined,
    destino_direccion: row.destino_direccion || undefined,
    destinatario: row.destinatario || undefined,
    comprobante_pdf: row.comprobante_pdf || undefined,
    comprobante_serie: row.comprobante_serie || undefined,
    comprobante_numero: row.comprobante_numero || undefined,
    comprobante_pendiente: row.comprobante_pendiente ?? true,
    grt_url: row.grt_url || undefined,
    carguero: row.carguero || undefined,
    fecha_envio: row.fecha_envio ? new Date(row.fecha_envio).toISOString() : undefined,
    tipo_pago: row.tipo_pago || 'Contra entrega',
    monto: row.monto !== null && row.monto !== undefined ? Number(row.monto).toFixed(2) : '12.00',
    estado_pago: row.estado_pago || 'Por cobrar (CR)',
    last_checked_at: row.last_checked_at || new Date().toISOString(),
    created_at: row.created_at || new Date().toISOString(),
  };
}

// ---------------- API DE ACCESO A DATOS (SUPABASE CON FALLBACK RESILIENTE) ----------------

export async function getShalomConnection(): Promise<ShalomConnectionState> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('integrations_config')
      .select('*')
      .eq('id', 'shalom')
      .single();

    if (!error && data) {
      const config = (data.config as any) || {};
      return {
        is_connected: Boolean(data.is_connected),
        shalom_email: config.shalom_email || '',
        auth_token: config.auth_token || '',
        terms_accepted: Boolean(config.terms_accepted),
        terms_accepted_at: config.terms_accepted_at || null,
        terms_accepted_ip: config.terms_accepted_ip || null,
        status: (data.status as any) || 'disconnected',
        updated_at: data.updated_at || null,
      };
    }
  } catch (err) {
    console.warn('[Shalom Storage] Error al leer integrations_config de Supabase:', err);
  }

  return fallbackConnectionState;
}

export async function updateShalomConnection(
  connection: Partial<ShalomConnectionState>
): Promise<ShalomConnectionState> {
  const current = await getShalomConnection();
  const next: ShalomConnectionState = {
    ...current,
    ...connection,
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from('integrations_config').upsert({
      id: 'shalom',
      is_connected: next.is_connected,
      status: next.status,
      config: {
        shalom_email: next.shalom_email,
        auth_token: next.auth_token,
        terms_accepted: next.terms_accepted,
        terms_accepted_at: next.terms_accepted_at,
        terms_accepted_ip: next.terms_accepted_ip,
      },
      updated_at: next.updated_at,
    });
  } catch (err) {
    console.warn('[Shalom Storage] Error al guardar integrations_config en Supabase:', err);
  }

  fallbackConnectionState = next;
  return next;
}

export async function disconnectShalomAccount(): Promise<ShalomConnectionState> {
  return updateShalomConnection({
    is_connected: false,
    shalom_email: '',
    auth_token: '',
    terms_accepted: false,
    terms_accepted_at: null,
    terms_accepted_ip: null,
    status: 'disconnected',
  });
}

export async function getShalomShipments(): Promise<ShalomStoredShipment[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map(mapRowToShipment);
    }
  } catch (err) {
    console.warn('[Shalom Storage] Error consultando tabla shipments de Supabase:', err);
  }

  return FALLBACK_SHIPMENTS;
}

export async function getShalomShipmentById(id: string): Promise<ShalomStoredShipment | undefined> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      return mapRowToShipment(data);
    }
  } catch (err) {
    console.warn(`[Shalom Storage] Error obteniendo envío ${id} en Supabase:`, err);
  }

  return FALLBACK_SHIPMENTS.find((s) => s.id === id);
}

export async function saveOrUpdateShipment(
  shipment: Partial<ShalomStoredShipment> & { numero: string; codigo: string }
): Promise<ShalomStoredShipment> {
  const cleanNum = shipment.numero.trim();
  const cleanCod = shipment.codigo.trim().toUpperCase();
  const now = new Date().toISOString();

  const payload: any = {
    carrier: shipment.carrier || 'shalom',
    numero: cleanNum,
    codigo: cleanCod,
    ose_id: shipment.ose_id ? Number(shipment.ose_id) : null,
    estado: shipment.estado || 'En origen',
    subtitulo: shipment.subtitulo || 'Rumbo a su destino.',
    fecha_estado: shipment.fecha_estado || new Date().toLocaleString('es-PE'),
    origen_nombre: shipment.origen_nombre || null,
    origen_direccion: shipment.origen_direccion || null,
    destino_nombre: shipment.destino_nombre || null,
    destino_direccion: shipment.destino_direccion || null,
    destinatario: shipment.destinatario || null,
    comprobante_pdf: shipment.comprobante_pdf || null,
    comprobante_serie: shipment.comprobante_serie || null,
    comprobante_numero: shipment.comprobante_numero || null,
    comprobante_pendiente: shipment.comprobante_pendiente ?? true,
    grt_url: shipment.grt_url || null,
    carguero: shipment.carguero || null,
    tipo_pago: shipment.tipo_pago || 'Contra entrega',
    monto: shipment.monto ? parseFloat(shipment.monto) : 12.00,
    estado_pago: shipment.estado_pago || 'Por cobrar (CR)',
    last_checked_at: now,
  };

  if (shipment.order_id) payload.order_id = shipment.order_id;
  if (shipment.fecha_envio) payload.fecha_envio = shipment.fecha_envio;
  if (shipment.id && !shipment.id.startsWith('sh-')) payload.id = shipment.id;

  try {
    const supabase = createSupabaseAdminClient();
    
    // Intentar buscar si ya existe por carrier + numero + codigo
    const { data: existing } = await supabase
      .from('shipments')
      .select('id')
      .eq('carrier', payload.carrier)
      .eq('numero', payload.numero)
      .eq('codigo', payload.codigo)
      .maybeSingle();

    let savedRow: any = null;

    if (existing?.id) {
      const { data, error } = await supabase
        .from('shipments')
        .update({
          ...payload,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (!error && data) savedRow = data;
    } else {
      const { data, error } = await supabase
        .from('shipments')
        .insert({
          ...payload,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (!error && data) savedRow = data;
    }

    if (savedRow) {
      return mapRowToShipment(savedRow);
    }
  } catch (err) {
    console.error('[Shalom Storage] Error al guardar en Supabase:', err);
  }

  // Fallback en memoria si la BD estuviera inaccesible
  const fallbackItem: ShalomStoredShipment = {
    id: shipment.id || `sh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...payload,
    monto: String(payload.monto || '12.00'),
    created_at: now,
  };

  const existingIdx = FALLBACK_SHIPMENTS.findIndex(
    (s) => s.numero === cleanNum && s.codigo === cleanCod
  );
  if (existingIdx >= 0) {
    FALLBACK_SHIPMENTS[existingIdx] = { ...FALLBACK_SHIPMENTS[existingIdx], ...fallbackItem };
    return FALLBACK_SHIPMENTS[existingIdx];
  } else {
    FALLBACK_SHIPMENTS.unshift(fallbackItem);
    return fallbackItem;
  }
}

export async function deleteShipment(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id);

    if (!error) return true;
  } catch (err) {
    console.warn(`[Shalom Storage] Error al eliminar envío ${id} en Supabase:`, err);
  }

  const initialLen = FALLBACK_SHIPMENTS.length;
  const filtered = FALLBACK_SHIPMENTS.filter((s) => s.id !== id);
  if (filtered.length !== initialLen) {
    FALLBACK_SHIPMENTS.length = 0;
    FALLBACK_SHIPMENTS.push(...filtered);
    return true;
  }
  return false;
}
