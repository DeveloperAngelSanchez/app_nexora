export interface ShalomStatusNode {
  fecha: string;
  completo?: boolean;
  cargueros?: string[];
  carguero?: string;
  cliente?: {
    nombre?: string;
    documento?: string;
    tipo_documento?: string;
  };
  [key: string]: any;
}

export interface ShalomStatusData {
  registrado?: ShalomStatusNode | null;
  origen?: ShalomStatusNode | null;
  transito?: ShalomStatusNode | null;
  destino?: ShalomStatusNode | null;
  entregado?: ShalomStatusNode | null;
  reparto?: ShalomStatusNode | null;
  demora?: string | null;
  tiene_cambio_destino?: boolean;
  tiene_devolucion_mercaderia?: boolean;
  solicitante_tipo?: string;
}

export interface ShalomStatusResponse {
  success: boolean;
  message: string; // 'En origen' | 'En tránsito' | 'En destino' | 'Entregado'
  data: ShalomStatusData;
}

export interface ShalomBuscarData {
  ose_id: number;
  numero_orden: string;
  codigo_orden: string;
  fecha_traslado?: string;
  fecha_emision?: string;
  tipo_pago?: string;
  estado_pago?: string;
  contenido?: string;
  monto?: string;
  entregado?: boolean;
  direccion_entrega?: string;
  tiempo_llegada?: string;
  origen_nombre?: string;
  origen_direccion?: string;
  destino_nombre?: string;
  destino_direccion?: string;
  destinatario_nombre?: string;
  destinatario_documento?: string;
  comprobante_url?: string;
}

export interface ShalomTrackingResult {
  numero: string;
  codigo: string;
  ose_id?: number | string;
  estado: 'En origen' | 'En tránsito' | 'En destino' | 'Entregado' | string;
  subtitulo: string;
  fecha_estado: string;
  hitos: {
    origen: boolean;
    transito: boolean;
    destino: boolean;
    entregado: boolean;
  };
  origen_nombre?: string;
  origen_direccion?: string;
  destino_nombre?: string;
  destino_direccion?: string;
  destinatario?: string;
  carguero?: string;
  comprobante_pdf?: string;
  comprobante_serie?: string;
  comprobante_numero?: string;
  comprobante_pendiente?: boolean;
  grt_url?: string;
  tipo_pago?: string;
  monto?: string;
  estado_pago?: string;
  raw_estados?: ShalomStatusResponse;
  raw_buscar?: ShalomBuscarData;
}
