import { useState, useEffect } from 'react';

export const MissionControlLive = () => {
  const [agents] = useState([
    { name: 'Hermes Translator', role: 'Voucher Delivery', status: 'Online', lastActive: 'Hace 2 min' },
    { name: 'Claw Booking Agent', role: 'Reservation Sync', status: 'Online', lastActive: 'Hace 1 min' },
    { name: 'Horizons Copywriter', role: 'Content Generator', status: 'Busy', lastActive: 'Procesando' },
    { name: 'Aliun Auditor', role: 'Quality Assurance', status: 'Online', lastActive: 'Hace 5 min' },
    { name: 'Kommo Connector', role: 'CRM Pipeline Sync', status: 'Offline', lastActive: 'Hace 1 hora' }
  ]);

  const [tasks] = useState([
    { id: 'TSK-9402', description: 'Generar Voucher PDF para Reserva #7741', priority: 'SEV1', status: 'Awaiting approval' },
    { id: 'TSK-9399', description: 'Traducción de reseña en RAG Cache', priority: 'SEV3', status: 'Processing' },
    { id: 'TSK-9395', description: 'Creación de Copia de Oferta WhatsApp', priority: 'SEV2', status: 'Awaiting approval' },
    { id: 'TSK-9390', description: 'Sincronizar leads de Kommo a Supabase', priority: 'SEV4', status: 'Queued' }
  ]);

  const [logs, setLogs] = useState([
    { id: 1, time: '10:44:05', text: 'Hermes Translator comenzó renderizado de PDF.', severity: 'INFO' },
    { id: 2, time: '10:43:52', text: 'Solicitud de reserva ingresada desde la web pública.', severity: 'INFO' },
    { id: 3, time: '10:42:10', text: 'Aprobación del Director requerida para tarifas Lopesan.', severity: 'WARNING' },
    { id: 4, time: '10:40:15', text: 'Claw Booking Agent sincronizó 15 nuevas tarifas con Supabase.', severity: 'SUCCESS' },
    { id: 5, time: '10:38:00', text: 'Error de respuesta de webhook de Kommo (re-intentando en 30s).', severity: 'ERROR' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simular la inyección de nuevos logs dinámicos para dar sensación de "LIVE"
      const now = new Date();
      const timeString = now.toTimeString().split(' ')[0];
      const randomLogs = [
        { time: timeString, text: 'Agent heartbeat recibido.', severity: 'INFO' },
        { time: timeString, text: 'Verificación de calidad de hoteles completada.', severity: 'SUCCESS' },
        { time: timeString, text: 'Consulta RAG realizada desde el chat interactivo.', severity: 'INFO' },
        { time: timeString, text: 'Sincronización del CRM iniciada.', severity: 'INFO' }
      ];
      const selectedLog = randomLogs[Math.floor(Math.random() * randomLogs.length)];
      setLogs(prev => [
        { id: Date.now(), ...selectedLog },
        ...prev.slice(0, 9)
      ]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Mission Control <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-wider font-extrabold border border-emerald-500/30">Live</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium">
            Monitor de estado en vivo de los agentes autónomos de Aliun Travel.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lista de Agentes */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <span>🤖 Estado de Agentes</span>
          </h3>

          <div className="space-y-3">
            {agents.map((agent, i) => (
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
            ))}
          </div>
        </div>

        {/* Cola de Tareas */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <span>📋 Tareas del Sistema</span>
          </h3>

          <div className="space-y-3">
            {tasks.map((task, i) => (
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
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{task.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Consola Live Logs */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <span>📡 Logs de Transmisión</span>
            </h3>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-[10px] space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/50 p-1 rounded transition">
                  <span className="text-slate-500 flex-shrink-0">{log.time}</span>
                  <span className={`font-bold px-1.5 py-0.2 rounded text-[8px] flex-shrink-0 ${
                    log.severity === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400' :
                    log.severity === 'WARNING' ? 'bg-amber-500/15 text-amber-400' :
                    log.severity === 'ERROR' ? 'bg-rose-500/15 text-rose-400' :
                    'bg-slate-850 text-slate-400'
                  }`}>{log.severity}</span>
                  <span className="text-slate-300">{log.text}</span>
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
