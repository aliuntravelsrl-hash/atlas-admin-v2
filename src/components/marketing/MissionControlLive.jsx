import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export const MissionControlLive = () => {
  const [activeTab, setActiveTab] = useState('workflows');
  
  // Catálogo de agentes de Aliun — poblado en tiempo real desde personal_ia (RRHH-IA)
  const [agents, setAgents] = useState([]);

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

  // Estados reales conectados a Supabase y n8n
  const [systemStatus, setSystemStatus] = useState({ mcp: '🔴', n8n: '🔴', supabase: '🔴', mcpVersion: '—', mcpTools: 0 });
  const [bookingStats, setBookingStats] = useState({ total: 0, paid: 0, pending: 0, confirmed: 0, cancelled: 0 });
  const [criticalNoVoucher, setCriticalNoVoucher] = useState([]);
  const [warningNoVoucher, setWarningNoVoucher] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [tasks, setTasks] = useState([]);

  // 1. Polling de Salud del Sistema MCP / n8n (cada 30s)
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const res = await fetch('https://n8n-n8n.xaruuo.easypanel.host/webhook/mcp-health');
        if (res.ok) {
          const data = await res.json();
          setSystemStatus({
            mcp: data.status === 'ok' ? '🟢' : '🔴',
            mcpVersion: data.version || '—',
            mcpTools: data.tools || 0,
            supabase: (data.supabase === 'connected' || data.supabase === 'ok') ? '🟢' : '🔴',
            n8n: '🟢'
          });
        } else {
          setSystemStatus({ mcp: '🔴', n8n: '🟢', supabase: '🔴', mcpVersion: 'error', mcpTools: 0 });
        }
      } catch (err) {
        console.error('Error fetching system status:', err);
        setSystemStatus({ mcp: '🔴', n8n: '🔴', supabase: '🔴', mcpVersion: 'desconectado', mcpTools: 0 });
      }
    };

    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // 1b. Polling de Personal IA (RRHH-IA) — roster real del enjambre Hermes (cada 60s)
  useEffect(() => {
    const fetchPersonalIA = async () => {
      try {
        const { data, error } = await supabase.rpc('rpc_personal_ia_status');
        if (error) throw error;

        const personal = data?.personal || [];

        const mapped = personal.map(p => {
          const mins = p.minutos_desde_heartbeat;
          let lastActive = 'Sin datos';
          if (mins !== null && mins !== undefined) {
            if (mins < 1) lastActive = 'Recién verificado';
            else if (mins < 60) lastActive = `Hace ${Math.round(mins)} min`;
            else lastActive = `Hace ${Math.round(mins / 60)} h`;
          }

          const statusMap = { online: 'Online', idle: 'Busy', error: 'Offline', offline: 'Offline' };

          return {
            name: p.nombre_agente,
            role: p.rol + (p.departamento ? ` · ${p.departamento}` : ''),
            status: statusMap[p.estado] || 'Offline',
            lastActive,
            incidentesAbiertos: p.incidentes_abiertos || 0
          };
        });

        setAgents(mapped);
      } catch (err) {
        console.error('Error fetching personal_ia:', err);
      }
    };

    fetchPersonalIA();
    const interval = setInterval(fetchPersonalIA, 60000);
    return () => clearInterval(interval);
  }, []);

  // 2. Polling de Estadísticas de Reservas y Actividad Reciente (cada 60s)
  useEffect(() => {
    const fetchDatabaseData = async () => {
      try {
        // A. Booking Stats
        const { count: total } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true });

        const { count: paid } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', 'paid');

        const { count: pending } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', 'pending');

        const { count: confirmed } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'confirmed');

        const { count: cancelled } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'cancelled');

        setBookingStats({ total: total || 0, paid: paid || 0, pending: pending || 0, confirmed: confirmed || 0, cancelled: cancelled || 0 });

        // B. Alerta: Gaps de Vouchers
        const { data: gapBookings } = await supabase
          .from('bookings')
          .select('id, booking_reference, total_amount, currency, created_at, guest_name, voucher_code, voucher_id')
          .eq('payment_status', 'paid')
          .or('voucher_code.is.null,voucher_id.is.null');

        const totalGaps = gapBookings || [];
        
        // Faltan ambos: Brecha Total (SEV1 Rojo)
        const criticalList = totalGaps.filter(b => b.voucher_code === null && b.voucher_id === null);
        // Falta solo uno: Brecha Parcial (SEV2 Amarillo)
        const warningList = totalGaps.filter(b => (b.voucher_code === null && b.voucher_id !== null) || (b.voucher_code !== null && b.voucher_id === null));

        setCriticalNoVoucher(criticalList);
        setWarningNoVoucher(warningList);

        // Actualizar tareas con las brechas reales de severidad SEV1 y SEV2 + tareas mock
        const criticalTasks = criticalList.map(b => ({
          id: `GAP-CRIT-${b.booking_reference || b.id.substring(0, 6).toUpperCase()}`,
          description: `Brecha SEV1: Reserva ${b.booking_reference || b.id.substring(0, 6)} sin voucher_code ni voucher_id.`,
          priority: 'SEV1',
          status: 'Crítico - Pendiente Hermes'
        }));

        const warningTasks = warningList.map(b => ({
          id: `GAP-WARN-${b.booking_reference || b.id.substring(0, 6).toUpperCase()}`,
          description: `Brecha SEV2: Reserva ${b.booking_reference || b.id.substring(0, 6)} con voucher incompleto (${b.voucher_code ? 'falta URL' : 'falta código'}).`,
          priority: 'SEV2',
          status: 'Advertencia - Gap Parcial'
        }));

        const mockTasks = [
          { id: 'TSK-9399', description: 'Traducción de reseña en RAG Cache', priority: 'SEV3', status: 'Processing' },
          { id: 'TSK-9395', description: 'Creación de Copia de Oferta WhatsApp', priority: 'SEV2', status: 'Awaiting approval' }
        ];
        setTasks([...criticalTasks, ...warningTasks, ...mockTasks]);

        // C. Actividad Reciente de Bookings
        const { data: recent } = await supabase
          .from('bookings')
          .select('booking_reference, status, payment_status, created_at, total_amount, currency, guest_name')
          .order('created_at', { ascending: false })
          .limit(10);

        setRecentActivity(recent || []);

      } catch (err) {
        console.error('Error fetching database metrics:', err);
      }
    };

    fetchDatabaseData();
    const interval = setInterval(fetchDatabaseData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-100 shadow-2xl">
      
      {/* Banner de Alerta Crítica (SEV1 - Faltan Ambos) */}
      {criticalNoVoucher.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-500 text-rose-200 p-4 rounded-xl flex flex-col gap-3 animate-pulse shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 font-extrabold text-xl">🚨</div>
            <div>
              <h4 className="font-extrabold text-white text-base">Brecha de Integridad Crítica (SEV1): {criticalNoVoucher.length} Reserva(s) Pagada(s) sin Voucher</h4>
              <p className="text-xs text-rose-300 font-medium">Hermes Translator no generó ningún código de voucher (voucher_code) ni enlace PDF (voucher_id).</p>
            </div>
          </div>
          <div className="space-y-2 border-t border-rose-900/60 pt-2.5">
            {criticalNoVoucher.map(b => (
              <div key={b.id} className="text-xs flex items-center justify-between bg-rose-950/60 border border-rose-900/40 px-3 py-1.5 rounded-lg text-rose-300">
                <span className="font-bold">{b.booking_reference || 'REF-N/A'} — {b.guest_name || 'Huésped'}</span>
                <span className="font-mono bg-rose-500/20 px-2 py-0.5 rounded text-[10px] text-rose-200">
                  {b.currency || 'USD'} {Number(b.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banner de Advertencia Parcial (SEV2 - Falta Uno) */}
      {warningNoVoucher.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500 text-amber-250 p-4 rounded-xl flex flex-col gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-extrabold text-xl">⚠️</div>
            <div>
              <h4 className="font-extrabold text-white text-base">Advertencia de Integridad Parcial (SEV2): {warningNoVoucher.length} Reserva(s) con Voucher Incompleto</h4>
              <p className="text-xs text-amber-300 font-medium">Falta uno de los campos requeridos (voucher_code o voucher_id) en el registro de la reserva.</p>
            </div>
          </div>
          <div className="space-y-2 border-t border-amber-900/60 pt-2.5">
            {warningNoVoucher.map(b => (
              <div key={b.id} className="text-xs flex items-center justify-between bg-amber-950/60 border border-amber-900/40 px-3 py-1.5 rounded-lg text-amber-300">
                <span className="font-bold">{b.booking_reference || 'REF-N/A'} — {b.guest_name || 'Huésped'}</span>
                <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded text-[10px] text-amber-200">
                  Falta: {b.voucher_code === null ? 'Código de Confirmación' : 'URL de Voucher PDF'}
                </span>
              </div>
            ))}
          </div>
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
            Monitor en tiempo real del ecosistema tecnológico, agentes y base de datos de Aliun Travel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2">
            <span>MCP: {systemStatus.mcp}</span>
            <span className="text-[10px] text-slate-500">v{systemStatus.mcpVersion}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2">
            <span>Supabase: {systemStatus.supabase}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2">
            <span>n8n: {systemStatus.n8n}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-blue-400">
            Tools: {systemStatus.mcpTools}
          </div>
        </div>
      </div>

      {/* KPIs de Reservas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition">
          <div className="text-[10px] uppercase font-bold text-slate-500">Reservas Totales</div>
          <div className="text-2xl font-black text-white mt-1">{bookingStats.total}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition">
          <div className="text-[10px] uppercase font-bold text-slate-500">Pendientes de Pago</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{bookingStats.pending}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition">
          <div className="text-[10px] uppercase font-bold text-slate-500">Pagos Aprobados</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{bookingStats.paid}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition">
          <div className="text-[10px] uppercase font-bold text-slate-500">Confirmadas</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{bookingStats.confirmed}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition">
          <div className="text-[10px] uppercase font-bold text-slate-500">Canceladas</div>
          <div className="text-2xl font-black text-slate-500 mt-1">{bookingStats.cancelled}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sección 1: n8n / Agentes */}
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
              agents.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs font-semibold animate-pulse">
                  Cargando personal IA...
                </div>
              ) : (
                agents.map((agent, i) => (
                  <div key={i} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between hover:border-slate-800 transition">
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        {agent.name}
                        {agent.incidentesAbiertos > 0 && (
                          <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-rose-500/15 text-rose-400 border border-rose-500/20">
                            {agent.incidentesAbiertos} incidente{agent.incidentesAbiertos > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
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
              )
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

        {/* Sección 2: Cola de Tareas */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <span>📋 Tareas del Sistema ({tasks.length})</span>
          </h3>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
            {tasks.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-semibold animate-pulse">
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
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${task.priority === 'SEV1' ? 'text-rose-400 font-extrabold' : 'text-slate-500'}`}>{task.status}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sección 3: Transmisión y Registro de Actividad Real */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <span>📡 Registro de Actividad Real</span>
            </h3>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-[10px] space-y-3.5 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
              {recentActivity.length === 0 ? (
                <div className="text-center py-12 text-slate-650 text-xs italic animate-pulse">
                  Esperando transacciones de reservas...
                </div>
              ) : (
                recentActivity.map((act, idx) => (
                  <div key={idx} className="flex flex-col gap-1 hover:bg-slate-900/50 p-2 rounded border border-slate-900 transition">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>{new Date(act.created_at).toLocaleDateString()} {new Date(act.created_at).toLocaleTimeString()}</span>
                      <span className="font-bold text-slate-400">{act.booking_reference || 'REF-N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-200 font-medium">
                      <span>{act.guest_name || 'Huésped'}</span>
                      <span className="text-blue-400">{act.currency} {Number(act.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.2 rounded text-[8px] font-black uppercase ${
                        act.status === 'confirmed' || act.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                        act.status === 'cancelled' ? 'bg-rose-500/15 text-rose-400' :
                        'bg-amber-500/15 text-amber-400'
                      }`}>Status: {act.status}</span>
                      <span className={`px-2 py-0.2 rounded text-[8px] font-black uppercase ${
                        act.payment_status === 'paid' ? 'bg-emerald-500/15 text-emerald-400' :
                        act.payment_status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>Pago: {act.payment_status}</span>
                    </div>
                  </div>
                ))
              )}
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
