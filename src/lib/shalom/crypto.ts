import crypto from 'crypto';

const SHALOM_KEY_BASE64 = 'uQn/bQ94PXBEfId70zjN+VE1hSU7kh9VBXTOUd68Ssc=';
const SHALOM_HMAC_SECRET = '.Ov3rsku112024l4r43l.';

const keyBuffer = Buffer.from(SHALOM_KEY_BASE64, 'base64');

/**
 * Genera el Bearer Token dinámico requerido por los servicios web de Shalom.
 * Formato: Bearer web-<UUID>@<TIMESTAMP_EXPIRY>@<HMAC_SHA256_HEX>
 */
export function generateShalomBearer(): string {
  const uuid = crypto.randomUUID();
  const exp = Math.floor(Date.now() / 1000) + 300; // 5 minutos de vigencia
  const payload = `web-${uuid}@${exp}`;
  const hmac = crypto.createHmac('sha256', SHALOM_HMAC_SECRET).update(payload).digest('hex');
  return `Bearer ${payload}@${hmac}`;
}

/**
 * Descifra el payload Base64 cifrado con AES-256-CBC de Shalom.
 * Los primeros 16 bytes son el IV y el resto es el texto cifrado con PKCS7 padding.
 */
export function decryptShalomPayload<T = any>(dataB64: string): T {
  try {
    const rawBuffer = Buffer.from(dataB64, 'base64');
    if (rawBuffer.length < 16) {
      throw new Error('Payload cifrado demasiado corto para contener IV (16 bytes)');
    }

    const iv = rawBuffer.subarray(0, 16);
    const ciphertext = rawBuffer.subarray(16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted) as T;
    } catch {
      return decrypted as unknown as T;
    }
  } catch (error: any) {
    console.error('[Shalom Crypto] Error al descifrar payload:', error?.message);
    throw new Error(`Fallo al descifrar respuesta de Shalom: ${error?.message}`);
  }
}
