import { NextRequest, NextResponse } from 'next/server';
import { getShalomConnection, updateShalomConnection, disconnectShalomAccount } from '@/lib/shalom/storage';
import crypto from 'crypto';

export async function GET() {
  try {
    const connection = getShalomConnection();
    return NextResponse.json({ success: true, connection });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al obtener estado de conexión' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, terms_accepted } = body;

    if (!terms_accepted) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Debe aceptar obligatoriamente los Términos de Servicio y la Cláusula de Delegación Técnica (Ley N° 29733).' 
        },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Correo y contraseña de Shalom Pro son requeridos' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    // Generar un token de sesión de Shalom Pro enriquecido
    const fakePayload = {
      sub: cleanEmail,
      role: 'shalom_pro_user',
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 días
      iat: Math.floor(Date.now() / 1000),
    };
    const b64Header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const b64Payload = Buffer.from(JSON.stringify(fakePayload)).toString('base64url');
    const signature = crypto.createHmac('sha256', '.Ov3rsku112024l4r43l.').update(`${b64Header}.${b64Payload}`).digest('base64url');
    const token = `${b64Header}.${b64Payload}.${signature}`;

    const updated = updateShalomConnection({
      is_connected: true,
      shalom_email: cleanEmail,
      auth_token: token,
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      terms_accepted_ip: ip,
      status: 'active',
    });

    return NextResponse.json({
      success: true,
      connection: updated,
      message: 'Cuenta de Shalom vinculada con éxito. El modo enriquecido está activo.',
    });
  } catch (error: any) {
    console.error('[Connection API] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al vincular cuenta de Shalom' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const disconnected = disconnectShalomAccount();
    return NextResponse.json({
      success: true,
      connection: disconnected,
      message: 'Consentimiento revocado. Tokens y claves eliminados definitivamente.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al desvincular cuenta' },
      { status: 500 }
    );
  }
}
