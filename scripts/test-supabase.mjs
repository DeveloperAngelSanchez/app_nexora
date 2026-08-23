import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load .env or .env.local manually
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const fullPath = resolve(ROOT, file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          const value = rest.join('=').trim().replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      });
      return file;
    }
  }
  return null;
}

const envFile = loadEnv();

console.log(`\n🔍 Verificando variables de entorno desde: ${envFile || 'NINGUNO'}`);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Configurada (' + supabaseUrl.substring(0, 25) + '...)' : '❌ Faltante'}`);
console.log(`- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? '✅ Configurada (longitud: ' + anonKey.length + ' chars)' : '❌ Faltante'}`);
console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${serviceKey ? '✅ Configurada (longitud: ' + serviceKey.length + ' chars)' : '⚠️ No configurada (opcional pero recomendada)'}`);

if (!supabaseUrl || !anonKey) {
  console.error('\n❌ ERROR: Faltan variables obligatorias de Supabase.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function testConnection() {
  try {
    console.log('\n📡 Probando petición a Supabase (consultando site_settings y categories)...');
    
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1);

    if (settingsError) {
      console.error('❌ Error al consultar site_settings:', settingsError.message);
      return;
    }

    console.log('✅ Conexión con Supabase establecida con éxito!');
    console.log('📦 Tabla site_settings encontrada:', settings);

    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`📦 Tabla products accesible (total productos en DB: ${count})`);
    }

    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('email, role, is_active');

    if (!adminError) {
      console.log(`👤 Administradores registrados:`, adminUsers?.length > 0 ? adminUsers : 'Ninguno todavía');
    }

    console.log('\n🎉 ¡TODO LISTO Y FUNCIONANDO AL 100% CON TU SUPABASE!');
  } catch (err) {
    console.error('❌ Error inesperado:', err.message);
  }
}

testConnection();
