import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export const MissionControlLive = () => {
  const [activeTab, setActiveTab] = useState('workflows');
  
  // Catálogo descriptivo de agentes del ecosistema Aliun
  const [agents, setAgents] = useState([
    { name: 'Hermes Translator', role: 'Voucher Delivery', status: 'Online', lastActive: 'Hace 2 min' },
    { name: 'Claw Booking Agent', role: 'Reservation Sync', status: 'Online', lastActive: 'Hace 1 min' },
    { name: 'Horizons Copywriter', role: 'Content Generator', status: 'Online', lastActive: 'Procesando' },
    { name: 'Aliun Auditor', role: 'Quality Assurance', status: 'Online', lastActive: 'Hace 5 min' },
    { name: 'Kommo Connector', role: 'CRM Pipeline Sync', status: 'Offline', lastActive: 'Hace 1 hora' }
  ]);

  const [n8nWorkflows] = useState([
    { name: 'WF-A: Agente IA Ventas', id: '0ps4wRmBFXcAy0u2', type: 'Webhook', status: 'Live', dept: 'ATLAS-SALES' },
    { name: 'WF-A-HUM: Humanización', id: 'WF-A-HUMANIZACION', type: 'Sub-Flow', status: 'Live', dept: 'ATLAS-SALES' },
    { name: 'WF-REINDEX: Reindex RAG', id: 'gWWeTx9biC9obZsy', type: 'Webhook/Cron', status: 'Live', dept: 'ATLAS-OPS' },
    { name: 'WF-BOOKING-API', id: 'fkeayENDXynocb8I', type: 'Webhook', status: 'Live', dept: 'ATLAS-OPS' },
    { name: 'WF-BOOKING-FULFILLMENT', id: 'UrFIhdYw7EOLFnQd', type: 'Webhook/Queue', status: 'Live', dept: 'ATLAS-OPS' },
    { name: 'Flujo C - Cotización PDF', id: 'Da46ZVQGRpdgaI02', type: 'Webhook', status: 'Live', dept: 'ATLAS-FINANCE' },
    { name: 'Flujo F - Voucher Hotel', id: 'T89xnmHoKMrFMhnT', type: 'Webhook', status: 'Live', dept: 'ATLAS-OPS' },
    { name: 'Flujo K - Confirmación PDF', id: 'clJ7YfPfzOLZSS0P', type: 'Webhook', status: 'Live', dept: 'ATLAS-FINANCE' },
    { name: 'Ingesta Tarifas Core 1', id: 'OJFIUi2OcwEqMaF6', type: 'Webhook', status: 'Live', dept: 'ATLAS-OPS' }
  ]);

  // Estados dinámicos de integración real
  const [systemStatus, setSystemStatus] = useState({ status: 'connecting', version: '-', tools: 0 });
  const [bookingStats, setBookingStats] = useState({ total: 0, pending: 0, paid: 0, confirmed: 0, cancelled: 0 });
  const [paidNoVoucherCount, setPaidNoVoucherCount] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([
    { id: 1, time: '10:44:05', text: 'Hermes Translator comenzó renderizado de PDF.', severity: 'INFO' },
    { id: 2, time: '10:43:52', text: 'Solicitud de reserva ingresada desde la web pública.', severity: 'INFO' },
    { id: 3, time: '10:42:10', text: 'Aprobación del Director requerida para tarifas Lopesan.', severity: 'WARNING' },
    { id: 4, time: '10:40:15', text: 'Claw Booking Agent sincronizó 15 nuevas tarifas con Supabase.', severity: 'SUCCESS' }
  ]);

  // Configuración de endpoint dinámico de n8n
  const rawWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || "https://n8n-n8n.xaruuo.easypanel.host/webhook/reserva_logic";
  const mcpHealthUrl = rawWebhookUrl.replace(/\/webhook\/[^\/]+$/, '/webhook/mcp-health');

  // 1. Polling de Salud de MCP (cada 30 segundos)
  useEffect(() => {
    const fetchMcpHealth = async () => {
      try {
        const response = await fetch(mcpHealthUrl);
        if (response.ok) {
          const data = await response.json();
          setSystemStatus({
            status: data.status || 'ok',
            version: data.version || '1.3.1',
            tools: data.tools || 13
          });
          // Actualizar estado del agente Hermes en la UI
          setAgents(prev => prev.map(a => 
            a.name === 'Hermes Translator' ? { ...a, status: 'Online', lastActive: 'Activo ahora' } : a
          ));
        } else {
          setSystemStatus({ status: 'offline', version: 'error', tools: 0 });
          setAgents(prev => prev.map(a => 
            a.name === 'Hermes Translator' ? { ...a, status: 'Offline', lastActive: 'Error de respuesta' } : a
          ));
        }
      } catch (err) {
        console.error('Error fetching MCP health:', err);
        setSystemStatus({ status: 'offline', version: 'desconectado', tools: 0 });
        setAgents(prev => prev.map(a => 
          a.name === 'Hermes Translator' ? { ...a, status: 'Offline', lastActive: 'Error de red' } : a
        ));
      }
    };

    fetchMcpHealth();
    const interval = setInterval(fetchMcpHealth, 30000);
    return () => clearInterval(interval);
  }, [mcpHealthUrl]);

  // 2. Polling de Estadísticas y Brechas en Supabase (cada 60 segundos)
  useEffect(() => {
    const fetchDatabaseMetrics = async () => {
      try {
        const { data: bookingsData, error } = await supabase
          .from('bookings')
          .select('id, guest_name, status, payment_status, voucher_code, voucher_id');

        if (error) throw error;

        const stats = { total: 0, pending: 0, paid: 0, confirmed: 0, cancelled: 0 };
        const missingVouchersList = [];
        let gapCount = 0;

        bookingsData.forEach(b => {
          stats.total++;
          if (b.status === 'pending_validation') stats.pending++;
          if (b.status === 'cancelled') stats.cancelled++;
          if (b.status === 'confirmed' || b.status === 'completed') stats.confirmed++;
          
          if (b.payment_status === 'paid') {
            stats.paid++;
            
            // Lógica ajustada del usuario: voucher_code es nulo OR voucher_id es nulo (cualquiera falta = gap)
            if (!b.voucher_code || !b.voucher_id) {
              gapCount++;
              missingVouchersList.push({
                id: `GAP-${b.id.substring(0, 8).toUpperCase()}`,
                description: `Alerta: Reserva #${b.id.substring(0, 6)} de ${b.guest_name || 'Huésped'} pagada sin Voucher.`,
                priority: 'SEV1',
                status: !b.voucher_code ? 'Falta código' : 'Falta archivo PDF'
              });
            }
          }
        });

        setBookingStats(stats);
        setPaidNoVoucherCount(gapCount);

        // Actualizar tareas del sistema con las brechas reales + tareas mock complementarias
        const mockTasks = [
          { id: 'TSK-9399', description: 'Traducción de reseña en RAG Cache', priority: 'SEV3', status: 'Processing' },
          { id: 'TSK-9395', description: 'Creación de Copia de Oferta WhatsApp', priority: 'SEV2', status: 'Awaiting approval' }
        ];
        setTasks([...missingVouchersList, ...mockTasks]);

        // Si hay brechas, inyectar log crítico
        if (gapCount > 0) {
          const timeString = new Date().toTimeString().split(' ')[0];
          setLogs(prev => {
            const hasLog = prev.some(l => l.text.includes('Brecha de Integridad detectada'));
            if (hasLog) return prev;
            return [
              {
                id: Date.now(),
                time: timeString,
                text: `Brecha de Integridad detectada: ${gapCount} reserva(s) pagada(s) carecen de voucher_code o voucher_id.`,
                severity: 'ERROR'
              },
              ...prev
            ];
          });
        }

      } catch (err) {
        console.error('Error fetching database metrics:', err);
      }
    };

    fetchDatabaseMetrics();
    const interval = setInterval(fetchDatabaseMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  // Simulación interactiva de logs vivos (cada 15s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeString = now.toTimeString().split(' ')[0];
      const randomLogs = [
        { time: timeString, text: 'Agent heartbeat recibido en canal de control.', severity: 'INFO' },
        { time: timeString, text: 'Verificación periódica de calidad de hoteles maestro completada.', severity: 'SUCCESS' },
        { time: timeString, text: 'Consulta RAG realizada con éxito al catálogo de Lopesan.', severity: 'INFO' },
        { time: timeString, text: 'Sincronización de pipeline con Kommo completada sin errores.', severity: 'SUCCESS' }
      ];
      const selectedLog = randomLogs[Math.floor(Math.random() * randomLogs.length)];
      setLogs(prev => [
        { id: Date.now(), ...selectedLog },
        ...prev.slice(0, 12)
      ]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-100 shadow-2xl">
      
      {/* Alerta Crítica PaidNoVoucher */}
      {paidNoVoucherCount > 0 && (
        <div className="bg-rose-500/10 border-2 border-rose-500 text-rose-200 p-4 rounded-xl flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 font-extrabold text-xl">⚠️</div>
            <div>
              <h4 className="font-extrabold text-white text-base">Alerta Crítica: Brecha de Integridad Detectada</h4>
              <p className="text-xs text-rose-300 font-medium">Hay {paidNoVoucherCount} reserva(s) con pago aprobado ('paid') que no tienen voucher_code o voucher_id asociado en base de datos.</p>
            </div>
          </div>
          <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border border-rose-400">SEV1 Activo</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Mission Control 
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-wider font-extrabold border border-emerald-500/30">Live</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium text-sm">
            Monitor de estado operacional en vivo de los agentes autónomos e integraciones de Aliun Travel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${systemStatus.status === 'ok' ? 'bg-emerald-500 animate-ping' : 'bg-rose-500 animate-pulse'}`}></span>
            <span>MCP Health: {systemStatus.status.toUpperCase()} (v{systemStatus.version})</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-blue-400">
            Tools Mapeadas: {systemStatus.tools}
          </div>
        </div>
      </div>

      {/* KPIs de Integración */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition">
          <div className="text-[10px] uppercase font-bold text-slate-500">Reservas Totales</div>
          <div className="text-2xl font-black text-white mt-1">{bookingStats.total}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition">
          <div className="text-[10px] uppercase font-bold text-slate-500">Pendientes Validación</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{bookingStats.pending}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition">
          <div className="text-[10px] uppercase font-bold text-slate-500">Pagos Aprobados</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{bookingStats.paid}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition">
          <div className="text-[10px] uppercase font-bold text-slate-500">Confirmadas/Completas</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{bookingStats.confirmed}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lista de Agentes / Workflows */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('workflows')}
              className={`font-bold text-sm transition-all pb-1 border-b-2 ${
                activeTab === 'workflows' ? 'text-blue-400 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              🔄 n8n Services ({n8nWorkflows.length})
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`font-bold text-sm transition-all pb-1 border-b-2 ${
                activeTab === 'agents' ? 'text-blue-400 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              🤖 Agentes IA ({agents.length})
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
            {activeTab === 'agents' ? (
              agents.map((agent, i) => (
                <div key={i} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between hover:border-slate-800 transition">
                  <div>
                    <div className="font-bold text-white text-sm">{agent.name}</div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{agent.role}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${
                      agent.status === 'Online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                      agent.status === 'Busy' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                      'bg-slate-800 border-slate-700 text-slate-500'
                    }`}>
                      {agent.status}
                    </span>
                    <div className="text-[9px] text-slate-500 mt-1 font-bold">{agent.lastActive}</div>
                  </div>
                </div>
              ))
            ) : (
              n8nWorkflows.map((wf, i) => (
                <div key={i} className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between hover:border-slate-800 transition">
                  <div>
                    <div className="font-bold text-white text-xs">{wf.name}</div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">ID: {wf.id} | {wf.type}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded-md border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                      {wf.status}
                    </span>
                    <div className="text-[8px] text-blue-400 mt-1 font-extrabold uppercase tracking-wider">{wf.dept}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cola de Tareas */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <span>📋 Tareas del Sistema ({tasks.length})</span>
          </h3>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
            {tasks.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-semibold">
                No hay tareas pendientes en la cola.
              </div>
            ) : (
              tasks.map((task, i) => (
                <div key={i} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-2 hover:border-slate-800 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400 text-xs">{task.id}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-md ${
                      task.priority === 'SEV1' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500' :
                      task.priority === 'SEV2' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500' :
                      'bg-blue-500/10 border border-blue-500/20 text-blue-500'
                    }`}>{task.priority}</span>
                  </div>
                  <p className="text-xs text-white font-semibold leading-relaxed">{task.description}</p>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${task.priority === 'SEV1' ? 'text-rose-400' : 'text-slate-500'}`}>{task.status}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Consola Live Logs */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <span>📡 Logs de Transmisión ({logs.length})</span>
            </h3>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-[10px] space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/50 p-1 rounded transition">
                  <span className="text-slate-500 flex-shrink-0">{log.time}</span>
                  <span className={`font-bold px-1.5 py-0.2 rounded text-[8px] flex-shrink-0 ${
                    log.severity === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400' :
                    log.severity === 'WARNING' ? 'bg-amber-500/15 text-amber-400' :
                    log.severity === 'ERROR' ? 'bg-rose-500/15 text-rose-400' :
                    'bg-slate-850 text-slate-400'
                  }`}>{log.severity}</span>
                  <span className="text-slate-300 break-words">{log.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-850 text-center text-[9px] text-slate-500 font-extrabold uppercase tracking-wider mt-4">
            Mission Control Streamer V2.6
          </div>
        </div>

      </div>

    </div>
  );
};

export default MissionControlLive;

