import fs from 'fs';
import path from 'path';

const WEBHOOK_URL = 'https://n8n-n8n.xaruuo.easypanel.host/webhook/notion-reporter';

const payload = {
  agente: 'Antigravity',
  tipo: 'sprint_update',
  estado: 'Activo',
  tarea: 'Go-Live & Customer Ingestion Plan - 25 May',
  mensaje: `Roadmap y Checklist de Integración CRM + Canales Digitales (Aliun Travel). 

1. Meta Ads (Dataset 1197179654562182) - Conversions API (CAPI) para Conversion Leads (Pendiente).
2. Google Ads - Conversiones Offline (GCLID) (Pendiente).
3. Catálogos - Meta Commerce Manager XML Feed (Pendiente).
4. Instagram API - DM Webhooks & Lead Sync (Pendiente).
5. Messenger API - Page Chats Webhooks & Lead Sync (Pendiente).

Fase A: Ingesta del Listado de Clientes (CSV): Crear y ejecutar el script import-customers.js para migrar los 739 clientes de contacts.csv a Supabase.
Fase B: Conexión de API de Conversiones (Meta Ads).
Fase C: Canalización Conversacional (Instagram, Messenger y WhatsApp).
Fase D: Catálogos de Producto (Hoteles).`,
  prioridad: 'SEV2'
};

async function report() {
  console.log('Enviando reporte a Notion a través del webhook de n8n...');
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const text = await response.text();
      console.log('✅ Reporte enviado con éxito. Respuesta:', text);
    } else {
      console.error('❌ Error al enviar reporte. Status:', response.status, response.statusText);
      const text = await response.text();
      console.log('Respuesta del error:', text);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

report();
