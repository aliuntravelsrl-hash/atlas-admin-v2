import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Ruta del archivo CSV
const csvPath = 'c:/Users/Admin/Downloads/contacts.csv';

// 1. Cargar configuración de .env
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = {};
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      envConfig[key] = val;
    }
  });
} catch (e) {
  console.error('Error al leer el archivo .env:', e);
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: No se encontraron las claves de Supabase.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parsear argumentos
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Parseador de CSV robusto (respetando comillas y multilineas)
function parseCSV(csvText) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let cell = '';
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // saltar el quote escapado
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell);
        cell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(cell);
        lines.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
  }
  if (cell || row.length > 0) {
    row.push(cell);
    lines.push(row);
  }
  return lines;
}

// Limpiar y normalizar número de teléfono a formato internacional (+1...)
function normalizePhone(phoneStr) {
  if (!phoneStr) return null;
  // Remover caracteres especiales pero mantener el '+'
  let cleaned = phoneStr.trim().replace(/[^\d+*#]/g, '');
  
  // Descartar códigos de servicio de operador (*11, *147#, etc.)
  if (cleaned.startsWith('*') || cleaned.startsWith('#') || cleaned.length < 7) {
    return null;
  }
  
  // Si no empieza con '+', analizar longitud
  if (!cleaned.startsWith('+')) {
    // Si tiene 10 dígitos y empieza con códigos de área de RD (809, 829, 849) o EE.UU.
    if (cleaned.length === 10 && /^(809|829|849|201|305|786|917|646|347|718|516|914)/.test(cleaned)) {
      cleaned = '+1' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length === 10) {
      // Por defecto RD si no se sabe
      cleaned = '+1' + cleaned;
    } else {
      // Intentar agregar +1 si no tiene prefijo de país pero parece número local
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

async function run() {
  console.log('===================================================');
  console.log('   SISTEMA DE INGESTA DE CLIENTES - ALIUN TRAVEL   ');
  console.log('===================================================');
  console.log(`Modo: ${isDryRun ? 'DRY-RUN (Simulación sin guardar)' : 'PRODUCCIÓN (Escritura en Supabase)'}`);
  console.log(`Archivo origen: ${csvPath}`);
  console.log('---------------------------------------------------');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Error: El archivo CSV no existe en ${csvPath}`);
    process.exit(1);
  }
  
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvText);
  
  if (rows.length < 2) {
    console.error('❌ Error: El CSV está vacío o no contiene cabeceras.');
    process.exit(1);
  }
  
  const headers = rows[0].map(h => h.trim());
  console.log(`Cabeceras encontradas (${headers.length}):`, headers.slice(0, 10).join(', ') + '...');
  
  const colFirst = headers.indexOf('First Name');
  const colMiddle = headers.indexOf('Middle Name');
  const colLast = headers.indexOf('Last Name');
  const colPhone1 = headers.indexOf('Phone 1 - Value');
  const colPhone2 = headers.indexOf('Phone 2 - Value');
  const colNickname = headers.indexOf('Nickname');
  const colFileAs = headers.indexOf('File As');
  const colLabels = headers.indexOf('Labels');
  
  console.log('Mapeo de Columnas:');
  console.log(`- First Name: Columna ${colFirst}`);
  console.log(`- Last Name: Columna ${colLast}`);
  console.log(`- Phone 1: Columna ${colPhone1}`);
  console.log(`- Nickname: Columna ${colNickname}`);
  console.log(`- File As: Columna ${colFileAs}`);
  console.log('---------------------------------------------------');
  
  // Obtener teléfonos existentes en Supabase para evitar duplicados
  let existingPhones = new Set();
  if (!isDryRun) {
    console.log('Obteniendo leads existentes de Supabase para evitar duplicados...');
    const { data: dbLeads, error: dbErr } = await supabase.from('crm_leads').select('phone');
    if (dbErr) {
      console.error('❌ Error al consultar leads existentes en Supabase:', dbErr.message);
      process.exit(1);
    }
    dbLeads.forEach(lead => {
      if (lead.phone) {
        existingPhones.add(normalizePhone(lead.phone));
      }
    });
    console.log(`Total de teléfonos existentes en DB: ${existingPhones.size}`);
  }
  
  const uniqueLeads = [];
  const phonesInCsv = new Set();
  let discardedCount = 0;
  let csvDuplicateCount = 0;
  let dbDuplicateCount = 0;
  
  // Procesar filas (saltando cabeceras)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2 || row.every(cell => cell.trim() === '')) {
      continue;
    }
    
    // Extraer valores
    const firstName = colFirst !== -1 ? row[colFirst]?.trim() : '';
    const middleName = colMiddle !== -1 ? row[colMiddle]?.trim() : '';
    const lastName = colLast !== -1 ? row[colLast]?.trim() : '';
    const rawPhone1 = colPhone1 !== -1 ? row[colPhone1]?.trim() : '';
    const rawPhone2 = colPhone2 !== -1 ? row[colPhone2]?.trim() : '';
    const nickname = colNickname !== -1 ? row[colNickname]?.trim() : '';
    const fileAs = colFileAs !== -1 ? row[colFileAs]?.trim() : '';
    const labels = colLabels !== -1 ? row[colLabels]?.trim() : '';
    
    // Determinar teléfono a usar (preferir Phone 1, fallback a Phone 2)
    const phone = normalizePhone(rawPhone1) || normalizePhone(rawPhone2);
    
    if (!phone) {
      discardedCount++;
      continue;
    }
    
    // Verificar duplicado en este mismo lote de CSV
    if (phonesInCsv.has(phone)) {
      csvDuplicateCount++;
      continue;
    }
    
    // Verificar duplicado en base de datos
    if (existingPhones.has(phone)) {
      dbDuplicateCount++;
      continue;
    }
    
    // Construir Nombre Completo
    let fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
    if (!fullName) {
      fullName = nickname || fileAs;
    }
    if (!fullName || fullName.replace(/[^\w\s]/g, '').trim() === '') {
      fullName = `Contacto sin Nombre (${phone})`;
    }
    
    const lead = {
      full_name: fullName,
      phone: phone,
      source: 'manual',
      stage: 'nuevo',
      assigned_to: 'director',
      message: `Contacto importado de Google Contacts. Labels: ${labels || 'Ninguno'}`
    };
    
    uniqueLeads.push(lead);
    phonesInCsv.add(phone);
  }
  
  console.log(`Resultados de preparación de datos:`);
  console.log(`- Total de líneas en CSV: ${rows.length - 1}`);
  console.log(`- Contactos procesados y válidos: ${uniqueLeads.length}`);
  console.log(`- Descartados por teléfono inválido/corto (ej. códigos operador): ${discardedCount}`);
  console.log(`- Omitidos por duplicado dentro del CSV: ${csvDuplicateCount}`);
  console.log(`- Omitidos por ya existir en Supabase: ${dbDuplicateCount}`);
  console.log('---------------------------------------------------');
  
  if (uniqueLeads.length === 0) {
    console.log('⚠️ No hay nuevos contactos válidos para insertar.');
    return;
  }
  
  if (isDryRun) {
    console.log('Muestra de los primeros 10 contactos a insertar:');
    uniqueLeads.slice(0, 10).forEach((l, idx) => {
      console.log(`  ${idx + 1}. Nombre: "${l.full_name}" | Tel: "${l.phone}" | Origen: "${l.source}"`);
    });
    console.log('---------------------------------------------------');
    console.log('Simulación completada con éxito. Ejecuta sin --dry-run para aplicar los cambios.');
    return;
  }
  
  // Realizar inserción en base de datos en bloques de 50 registros
  console.log(`Iniciando inserción de ${uniqueLeads.length} leads en Supabase...`);
  const chunkSize = 50;
  let insertedCount = 0;
  
  for (let i = 0; i < uniqueLeads.length; i += chunkSize) {
    const chunk = uniqueLeads.slice(i, i + chunkSize);
    const { error } = await supabase.from('crm_leads').insert(chunk);
    
    if (error) {
      console.error(`❌ Error en bloque ${i / chunkSize + 1}:`, error.message);
      // Continuar con los siguientes bloques si uno falla, para no abortar todo
    } else {
      insertedCount += chunk.length;
      console.log(`   ✅ Bloque ${i / chunkSize + 1} insertado (${insertedCount}/${uniqueLeads.length})`);
    }
  }
  
  console.log('---------------------------------------------------');
  console.log(`🎉 Ingesta completada con éxito.`);
  console.log(`- Total registros insertados: ${insertedCount}`);
  console.log(`- Fallidos: ${uniqueLeads.length - insertedCount}`);
  console.log('===================================================');
}

run();
