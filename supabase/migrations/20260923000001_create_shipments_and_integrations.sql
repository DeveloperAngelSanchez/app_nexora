-- =====================================================================
-- Migration: 20260923000001_create_shipments_and_integrations.sql
-- Description: Shipments table for real persistence of carrier tracking (Shalom, Olva)
--              and integrations_config for external services state
-- =====================================================================

-- 1. Create Shipments Table
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    carrier TEXT NOT NULL DEFAULT 'shalom',
    numero TEXT NOT NULL,
    codigo TEXT NOT NULL,
    ose_id BIGINT,
    estado TEXT NOT NULL DEFAULT 'En origen',
    subtitulo TEXT NOT NULL DEFAULT 'Rumbo a su destino.',
    fecha_estado TEXT,
    origen_nombre TEXT,
    origen_direccion TEXT,
    destino_nombre TEXT,
    destino_direccion TEXT,
    destinatario TEXT,
    carguero TEXT,
    comprobante_pdf TEXT,
    comprobante_serie TEXT,
    comprobante_numero TEXT,
    comprobante_pendiente BOOLEAN NOT NULL DEFAULT true,
    grt_url TEXT,
    fecha_envio TIMESTAMPTZ,
    tipo_pago TEXT DEFAULT 'Contra entrega',
    monto NUMERIC(10, 2) DEFAULT 12.00,
    estado_pago TEXT DEFAULT 'Por cobrar (CR)',
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_shipments_carrier_numero_codigo UNIQUE (carrier, numero, codigo)
);

-- 2. Indexes for fast shipment lookups
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_numero ON public.shipments(numero);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON public.shipments(carrier);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at DESC);

-- 3. Trigger for updated_at
DROP TRIGGER IF EXISTS trg_shipments_updated_at ON public.shipments;
CREATE TRIGGER trg_shipments_updated_at
    BEFORE UPDATE ON public.shipments
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_set_updated_at();

-- 4. Integrations Config Table (for Shalom, WhatsApp, etc. connection states)
CREATE TABLE IF NOT EXISTS public.integrations_config (
    id TEXT PRIMARY KEY, -- e.g. 'shalom', 'olva'
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_connected BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'disconnected',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initial config row for Shalom
INSERT INTO public.integrations_config (id, config, is_connected, status)
VALUES (
    'shalom',
    '{
        "shalom_email": "",
        "auth_token": "",
        "terms_accepted": false,
        "terms_accepted_at": null
    }'::jsonb,
    false,
    'disconnected'
) ON CONFLICT (id) DO NOTHING;

-- 5. Row Level Security (RLS)
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_config ENABLE ROW LEVEL SECURITY;

-- Shipments RLS
CREATE POLICY "Admins have full access to shipments"
    ON public.shipments
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Public read-only tracking for shipments"
    ON public.shipments
    FOR SELECT
    USING (true);

-- Integrations Config RLS
CREATE POLICY "Admins have full access to integrations_config"
    ON public.integrations_config
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Seed Existing Shipments (Preserving historical data)
INSERT INTO public.shipments (
    numero,
    codigo,
    ose_id,
    estado,
    subtitulo,
    fecha_estado,
    fecha_envio,
    tipo_pago,
    monto,
    estado_pago,
    origen_nombre,
    origen_direccion,
    destino_nombre,
    destino_direccion,
    destinatario,
    grt_url,
    comprobante_pendiente,
    carguero,
    last_checked_at,
    created_at
) VALUES (
    '95379502',
    'P3PJ',
    98851762,
    'En destino',
    'Disponible para retiro en agencia de destino.',
    '11/09/26 a las 08:30',
    '2026-09-10 12:57:00+00',
    'Contra entrega',
    12.00,
    'Por cobrar (CR)',
    'Agencia Raymondi (La Victoria)',
    'JR. ANTONIO RAYMONDI NRO. 113, LA VICTORIA, LIMA',
    'Agencia Paita Sol y Mar',
    'MZ. H LT. 14 URB. SOL Y MAR, PAITA, PIURA',
    'Cliente Nexora Store',
    'https://shalom.com.pe/rastrea',
    true,
    '1045277',
    '2026-09-11 02:51:16.323+00',
    '2026-09-10 20:00:00+00'
), (
    '94567034',
    '3KPC',
    98124501,
    'En destino',
    'Disponible para retiro en agencia de destino.',
    '09/09/26 a las 10:30',
    '2026-09-09 10:30:00+00',
    'Pagado en origen',
    15.00,
    'Pagado',
    'Agencia San Borja',
    'AV. AVIACIÓN 2819, SAN BORJA, LIMA (Frente a Bembos)',
    'Agencia Paita Sol y Mar',
    'MZ. H LT. 14 URB. SOL Y MAR, PAITA, PIURA',
    'Cliente VIP Nexora',
    'https://shalom.com.pe/rastrea',
    false,
    '1042190',
    '2026-09-10 18:15:00+00',
    '2026-09-09 10:30:00+00'
) ON CONFLICT (carrier, numero, codigo) DO UPDATE SET
    estado = EXCLUDED.estado,
    subtitulo = EXCLUDED.subtitulo,
    fecha_estado = EXCLUDED.fecha_estado,
    last_checked_at = EXCLUDED.last_checked_at;
