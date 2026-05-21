import fs from 'fs';
import path from 'path';

const sourceDir = 'C:\\Users\\Admin\\Downloads\\-atlas-api-toolbox';
const destDir = 'C:\\Users\\Admin\\.antigravity\\-atlas-admin-v2\\public\\api-toolbox';

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  
  const entries = fs.readdirSync(from, { withFileTypes: true });
  
  for (let entry of entries) {
    const fromPath = path.join(from, entry.name);
    const toPath = path.join(to, entry.name);
    
    // Ignorar la carpeta .git u otros archivos que no necesitemos
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'sql') {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
      console.log(`Copiado: ${fromPath} -> ${toPath}`);
    }
  }
}

try {
  console.log(`Iniciando copia de especificaciones...`);
  console.log(`Origen: ${sourceDir}`);
  console.log(`Destino: ${destDir}`);
  
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`El directorio origen no existe: ${sourceDir}`);
  }
  
  // Copiar las 3 carpetas específicas para asegurarnos de cumplir el orden y alcance
  const foldersToCopy = ['01-meta', '02-google', '03-tiktok'];
  
  for (const folder of foldersToCopy) {
    const srcFolder = path.join(sourceDir, folder);
    const dstFolder = path.join(destDir, folder);
    
    if (fs.existsSync(srcFolder)) {
      console.log(`Copiando carpeta ${folder}...`);
      copyFolderSync(srcFolder, dstFolder);
    } else {
      console.warn(`Advertencia: Carpeta origen no encontrada: ${srcFolder}`);
    }
  }
  
  console.log(`¡Copia completada con éxito!`);
} catch (error) {
  console.error(`Error durante la copia:`, error.message);
  process.exit(1);
}
