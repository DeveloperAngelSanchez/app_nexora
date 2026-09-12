import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ShalomStoredShipment {
  id: string;
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
  carguero?: string;
  fecha_envio?: string; // Fecha en que se colocó el paquete en la agencia de origen
  tipo_pago?: string; // Ej: Contra entrega, Pagado en origen
  monto?: string; // Ej: 12.00
  estado_pago?: string; // Ej: Por cobrar (CR), Pagado
  last_checked_at: string; // ISO string de última consulta
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

interface ShalomStoreData {
  connection: ShalomConnectionState;
  shipments: ShalomStoredShipment[];
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const STORE_FILE = path.join(DATA_DIR, 'shalom_store.json');
const TMP_STORE_FILE = path.join(os.tmpdir(), 'shalom_store.json');

// Memoria caché para rendimiento instantáneo y persistencia durante la vida del contenedor serverless
let memoryStore: ShalomStoreData | null = null;

function getDefaultStoreData(): ShalomStoreData {
  return {
    connection: {
      is_connected: false,
      shalom_email: '',
      auth_token: '',
      terms_accepted: false,
      terms_accepted_at: null,
      status: 'disconnected',
      updated_at: null,
    },
    shipments: [],
  };
}

function ensureStoreFile(): ShalomStoreData {
  if (memoryStore) {
    return memoryStore;
  }

  // 1. Intentar leer desde /tmp/shalom_store.json (donde se guardan mutaciones en Vercel/Lambda)
  try {
    if (fs.existsSync(TMP_STORE_FILE)) {
      const raw = fs.readFileSync(TMP_STORE_FILE, 'utf-8');
      memoryStore = JSON.parse(raw) as ShalomStoreData;
      return memoryStore;
    }
  } catch (err) {
    console.warn('[Storage] Error leyendo de TMP_STORE_FILE:', err);
  }

  // 2. Si no existe en /tmp, leer del archivo bundled src/data/shalom_store.json (lectura permitida en Vercel)
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      memoryStore = JSON.parse(raw) as ShalomStoreData;
      return memoryStore;
    }
  } catch (err) {
    console.warn('[Storage] Error leyendo de STORE_FILE:', err);
  }

  // 3. Fallback a datos por defecto
  memoryStore = getDefaultStoreData();
  return memoryStore;
}

function writeStoreData(data: ShalomStoreData) {
  // 1. Actualizar siempre la caché en memoria inmediatamente
  memoryStore = data;

  // 2. Guardar en /tmp/shalom_store.json (siempre con permisos de escritura en Vercel / AWS Lambda / Linux / Mac)
  try {
    fs.writeFileSync(TMP_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Storage] No se pudo escribir en TMP_STORE_FILE:', err);
  }

  // 3. Si el entorno local permite escribir en src/data/shalom_store.json, hacerlo también
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // En Vercel / Lambda lanzará EROFS (Read-only file system).
    // Lo ignoramos de forma segura porque ya está persistido en /tmp y en la memoria del runtime.
  }
}

// ---------------- API DE ACCESO A DATOS ----------------

export function getShalomConnection(): ShalomConnectionState {
  const store = ensureStoreFile();
  return store.connection;
}

export function updateShalomConnection(connection: Partial<ShalomConnectionState>): ShalomConnectionState {
  const store = ensureStoreFile();
  store.connection = {
    ...store.connection,
    ...connection,
    updated_at: new Date().toISOString(),
  };
  writeStoreData(store);
  return store.connection;
}

export function disconnectShalomAccount(): ShalomConnectionState {
  const store = ensureStoreFile();
  store.connection = {
    is_connected: false,
    shalom_email: '',
    auth_token: '',
    terms_accepted: false,
    terms_accepted_at: null,
    terms_accepted_ip: null,
    status: 'disconnected',
    updated_at: new Date().toISOString(),
  };
  writeStoreData(store);
  return store.connection;
}

export function getShalomShipments(): ShalomStoredShipment[] {
  const store = ensureStoreFile();
  // Ordenar envíos por fecha de envío descendente (los más recientes arriba)
  return [...store.shipments].sort((a, b) => {
    const timeA = a.fecha_envio ? new Date(a.fecha_envio).getTime() : new Date(a.created_at).getTime();
    const timeB = b.fecha_envio ? new Date(b.fecha_envio).getTime() : new Date(b.created_at).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });
}

export function getShalomShipmentById(id: string): ShalomStoredShipment | undefined {
  const store = ensureStoreFile();
  return store.shipments.find((s) => s.id === id);
}

export function saveOrUpdateShipment(shipment: Partial<ShalomStoredShipment> & { numero: string; codigo: string }): ShalomStoredShipment {
  const store = ensureStoreFile();
  const cleanNum = shipment.numero.trim();
  const cleanCod = shipment.codigo.trim().toUpperCase();

  const existingIndex = store.shipments.findIndex(
    (s) => s.numero === cleanNum && s.codigo === cleanCod
  );

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const updated: ShalomStoredShipment = {
      ...store.shipments[existingIndex],
      ...shipment,
      numero: cleanNum,
      codigo: cleanCod,
      last_checked_at: now,
    };
    store.shipments[existingIndex] = updated;
    writeStoreData(store);
    return updated;
  } else {
    const created: ShalomStoredShipment = {
      id: shipment.id || `sh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      numero: cleanNum,
      codigo: cleanCod,
      ose_id: shipment.ose_id,
      estado: shipment.estado || 'En origen',
      subtitulo: shipment.subtitulo || 'Rumbo a su destino.',
      fecha_estado: shipment.fecha_estado || new Date().toLocaleString('es-PE'),
      origen_nombre: shipment.origen_nombre,
      origen_direccion: shipment.origen_direccion,
      destino_nombre: shipment.destino_nombre,
      destino_direccion: shipment.destino_direccion,
      destinatario: shipment.destinatario,
      comprobante_pdf: shipment.comprobante_pdf,
      carguero: shipment.carguero,
      fecha_envio: shipment.fecha_envio || new Date().toISOString(),
      tipo_pago: shipment.tipo_pago || 'Contra entrega',
      monto: shipment.monto || '12.00',
      estado_pago: shipment.estado_pago || 'Por cobrar',
      last_checked_at: now,
      created_at: now,
    };
    store.shipments.unshift(created);
    writeStoreData(store);
    return created;
  }
}

export function deleteShipment(id: string): boolean {
  const store = ensureStoreFile();
  const initialLen = store.shipments.length;
  store.shipments = store.shipments.filter((s) => s.id !== id);
  if (store.shipments.length !== initialLen) {
    writeStoreData(store);
    return true;
  }
  return false;
}
