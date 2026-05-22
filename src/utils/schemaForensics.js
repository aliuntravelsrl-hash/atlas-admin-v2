export const logSchemaAudit = (results) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}]`;

  if (results.type === 'audit') {
    console.log(`${prefix} 🔍 [Auditoría] ${results.message}`);
    if (results.details) {
      console.table(results.details);
    }
  } else if (results.type === 'error') {
    console.error(`${prefix} ❌ [Error] ${results.message}`, results.error);
  } else if (results.type === 'repair') {
    console.log(`${prefix} 🔧 [Reparación] ${results.message}`);
  } else if (results.type === 'truth') {
    console.log(`${prefix} ✅ [Verdad Absoluta] ${results.message}`);
  } else if (results.type === 'analysis') {
    console.log(`${prefix} 🔧 [Análisis] ${results.message}`);
  }
};