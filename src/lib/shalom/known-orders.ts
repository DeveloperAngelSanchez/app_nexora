export interface KnownShalomOrder {
  numero: string;
  codigo: string;
  ose_id?: number;
  origen_nombre: string;
  origen_direccion: string;
  destino_nombre: string;
  destino_direccion: string;
  destinatario: string;
  comprobante_pdf?: string;
  comprobante_pendiente?: boolean;
  grt_url?: string;
  tipo_pago?: string;
  monto?: string;
  estado_pago?: string;
  fecha_envio?: string;
  contenido?: string;
  estado?: string;
  subtitulo?: string;
  fecha_estado?: string;
}

export const KNOWN_SHALOM_ORDERS: Record<string, KnownShalomOrder> = {
  '96910031': {
    numero: '96910031',
    codigo: 'TT7D',
    ose_id: 99341208,
    origen_nombre: 'Agencia Raymondi (La Victoria)',
    origen_direccion: 'JR. ANTONIO RAYMONDI NRO. 113, LA VICTORIA, LIMA',
    destino_nombre: 'Agencia Paita Sol y Mar',
    destino_direccion: 'MZ. H LT. 14 URB. SOL Y MAR, PAITA, PIURA',
    destinatario: 'ANGEL SANCHEZ PRECIADO',
    tipo_pago: 'Contra entrega',
    monto: '12.00',
    estado_pago: 'Pagado',
    fecha_envio: '2026-09-22 14:58:00',
    contenido: '1 PAQUETERIA NEXORA',
    grt_url: 'https://shalom.com.pe/rastrea',
    comprobante_pendiente: false,
    estado: 'Entregado',
    subtitulo: 'Entregado a ANGEL SANCHEZ PRECIADO con DNI 72727150, el día 24/09/26 a las 14:58.',
    fecha_estado: '24/09/26 a las 14:58',
  },
  '95379502': {
    numero: '95379502',
    codigo: 'P3PJ',
    ose_id: 98851762,
    origen_nombre: 'Agencia Raymondi (La Victoria)',
    origen_direccion: 'JR. ANTONIO RAYMONDI NRO. 113, LA VICTORIA, LIMA',
    destino_nombre: 'Agencia Paita Sol y Mar',
    destino_direccion: 'MZ. H LT. 14 URB. SOL Y MAR, PAITA, PIURA',
    destinatario: 'ANGEL SANCHEZ PRECIADO',
    tipo_pago: 'Contra entrega',
    monto: '12.00',
    estado_pago: 'Pagado',
    fecha_envio: '2026-09-10 12:57:00',
    contenido: '1 PAQUETERIA S (Accesorios Nexora)',
    grt_url: 'https://shalom.com.pe/rastrea',
    comprobante_pendiente: false,
    estado: 'Entregado',
    subtitulo: 'Entregado a ANGEL SANCHEZ PRECIADO con DNI 72727150, el día 12/09/26 a las 15:04.',
    fecha_estado: '12/09/26 a las 15:04',
  },
  '94567034': {
    numero: '94567034',
    codigo: '3KPC',
    ose_id: 98124501,
    origen_nombre: 'Agencia San Borja',
    origen_direccion: 'AV. AVIACIÓN 2819, SAN BORJA, LIMA (Frente a Bembos)',
    destino_nombre: 'Agencia Paita Sol y Mar',
    destino_direccion: 'MZ. H LT. 14 URB. SOL Y MAR, PAITA, PIURA (Costado de empresa San Miguel)',
    destinatario: 'MONICA SANCHEZ SABOYA',
    comprobante_pdf: 'https://www.nubefact.com/cpe/82b646ac-150e-484e-aa6e-969c6f9123fb.pdf',
    tipo_pago: 'Pagado en origen',
    monto: '15.00',
    estado_pago: 'Pagado',
    fecha_envio: '2026-09-09 10:30:00',
    contenido: '1 PAQUETERIA TECH',
    grt_url: 'https://shalom.com.pe/rastrea',
    comprobante_pendiente: false,
    estado: 'Entregado',
    subtitulo: 'Entregado a MONICA SANCHEZ SABOYA con DNI 72688505, el día 07/09/26 a las 10:01.',
    fecha_estado: '07/09/26 a las 10:01',
  }
};
