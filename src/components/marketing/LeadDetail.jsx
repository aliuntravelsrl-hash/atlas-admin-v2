import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const ACTIVITY_ICONS = {
  nota: { char: '📝', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  llamada: { char: '📞', color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  whatsapp: { char: '💬', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  cotizacion: { char: '📄', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  email: { char: '✉️', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  sistema: { char: '🤖', color: 'bg-slate-700/30 text-slate-400 border-slate-700/40' },
};

const STAGES = [
  { id: 'nuevo', name: 'Nuevo' },
  { id: 'contactado', name: 'Contactado' },
  { id: 'cotizado', name: 'Cotizado' },
  { id: 'negociando', name: 'Negociando' },
  { id: 'confirmada', name: 'Confirmada' },
  { id: 'perdido', name: 'Perdido' },
];

export const LeadDetail = ({ leadId, onClose, onRefresh }) => {
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Registrar Actividad Form
  const [newActivity, setNewActivity] = useState({
    type: 'nota',
    content: ''
  });
  const [savingActivity, setSavingActivity] = useState(false);

  useEffect(() => {
    if (leadId) {
      loadLeadDetails();
    }
  }, [leadId]);

  const loadLeadDetails = async () => {
    setLoading(true);
    try {
      // 1. Obtener datos del Lead
      const { data: leadData, error: leadError } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (leadError) throw leadError;
      setLead(leadData);

      // 2. Obtener Actividades vinculadas
      const { data: actData, error: actError } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
        
      if (actError) throw actError;
      setActivities(actData || []);
    } catch (err) {
      console.error('Error loading lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (newStage) => {
    if (!lead) return;
    
    // UI local optimista
    setLead(prev => ({ ...prev, stage: newStage }));
    
    try {
      const { error } = await supabase.rpc('avanzar_pipeline', {
        p_lead_id: lead.id,
        p_new_stage: newStage,
        p_actor: 'director'
      });

      if (error) {
        console.warn('RPC falló, ejecutando fallback directo de actualización...');
        const { error: updateError } = await supabase
          .from('crm_leads')
          .update({ stage: newStage, updated_at: new Date().toISOString() })
          .eq('id', lead.id);
        
        if (updateError) throw updateError;
        
        await supabase.from('crm_activities').insert({
          lead_id: lead.id,
          type: 'sistema',
          content: `Etapa cambiada a: ${newStage}`,
          created_by: 'director'
        });
      }
      
      loadLeadDetails();
      onRefresh();
    } catch (err) {
      alert('Error al actualizar etapa: ' + err.message);
      loadLeadDetails();
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newActivity.content.trim()) return;
    
    setSavingActivity(true);
    try {
      const { error } = await supabase
        .from('crm_activities')
        .insert([{
          lead_id: leadId,
          type: newActivity.type,
          content: newActivity.content,
          created_by: 'director'
        }]);

      if (error) throw error;
      
      // Actualizar updated_at del lead para orden de Kanban
      await supabase
        .from('crm_leads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', leadId);

      setNewActivity({ type: 'nota', content: '' });
      loadLeadDetails();
      onRefresh();
    } catch (err) {
      alert('Error al registrar actividad: ' + err.message);
    } finally {
      setSavingActivity(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-slate-900 border-l border-slate-800 shadow-2xl z-40 p-6 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-xs text-slate-400 font-semibold animate-pulse">Cargando expediente del cliente...</div>
      </div>
    );
  }

  if (!lead) return null;

  // Generar links de contacto
  const cleanPhone = lead.phone?.replace(/[^0-9+]/g, '') || '';
  const waUrl = `https://wa.me/${cleanPhone.replace('+', '')}`;
  const cwUrl = lead.chatwoot_id 
    ? `https://chat.aliuntravel.com/app/accounts/1/conversations/${lead.chatwoot_id}`
    : 'https://chat.aliuntravel.com';

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[460px] bg-slate-900 border-l border-slate-800 shadow-2xl z-40 flex flex-col text-slate-200">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Detalles del Lead</span>
          </div>
          <h2 className="text-xl font-black text-white truncate max-w-[320px]">{lead.full_name}</h2>
          
          {/* Selector de Etapa */}
          <div className="flex items-center gap-1.5 pt-1.5">
            <span className="text-xs text-slate-500 font-bold">Etapa:</span>
            <select
              value={lead.stage}
              onChange={(e) => handleStageChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs font-extrabold text-blue-400 px-2 py-0.5 focus:outline-none cursor-pointer"
            >
              {STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-white text-base font-extrabold p-1 focus:outline-none"
        >
          ✕
        </button>
      </div>

      {/* Body content (scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Acciones Rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold text-xs transition-all text-center"
          >
            <span>💬</span> WhatsApp Directo
          </a>
          <a
            href={cwUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 rounded-xl font-bold text-xs transition-all text-center"
          >
            <span>✉️</span> Ver en Chatwoot
          </a>
        </div>

        {/* Ficha de Detalles */}
        <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 space-y-3.5 text-xs">
          <h3 className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-900 pb-1.5">Expediente General</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block font-bold mb-0.5">Teléfono:</span>
              <span className="font-mono text-white font-semibold">{lead.phone}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-bold mb-0.5">Email:</span>
              <span className="truncate block text-white font-semibold">{lead.email || 'No registrado'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block font-bold mb-0.5">Origen / Canal:</span>
              <span className="capitalize text-white font-semibold">{lead.source}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-bold mb-0.5">Hotel de Interés:</span>
              <span className="text-white font-semibold">{lead.hotel_interest || 'Ninguno'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block font-bold mb-0.5">Check In / Out:</span>
              <span className="text-white font-semibold font-mono">
                {lead.check_in ? `${lead.check_in} a ${lead.check_out}` : 'No definido'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-bold mb-0.5">Ocupación:</span>
              <span className="text-white font-semibold">
                {lead.adults} Adultos {lead.children > 0 && `· ${lead.children} Niños`}
              </span>
            </div>
          </div>

          {lead.message && (
            <div className="pt-2 border-t border-slate-900/50">
              <span className="text-slate-500 block font-bold mb-1">Mensaje Inicial:</span>
              <p className="bg-slate-900/80 p-2.5 rounded-xl text-slate-300 font-medium leading-relaxed italic border border-slate-900">
                "{lead.message}"
              </p>
            </div>
          )}
        </div>

        {/* Formulario Nueva Actividad */}
        <form onSubmit={handleAddActivity} className="space-y-3">
          <h3 className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px]">Registrar Actividad / Notas</h3>
          <div className="flex gap-2">
            <select
              value={newActivity.type}
              onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
              className="bg-slate-950 border border-slate-800 px-2 py-2 rounded-xl text-xs text-slate-300 font-semibold focus:outline-none"
            >
              <option value="nota">Nota</option>
              <option value="llamada">Llamada</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
            <input
              type="text"
              required
              placeholder="Escribe un resumen de la actividad..."
              value={newActivity.content}
              onChange={(e) => setNewActivity({ ...newActivity, content: e.target.value })}
              className="flex-1 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/50 placeholder-slate-650"
            />
            <button
              type="submit"
              disabled={savingActivity}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-xs font-bold text-white rounded-xl transition-colors"
            >
              {savingActivity ? '...' : 'Guardar'}
            </button>
          </div>
        </form>

        {/* Timeline Historial */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-900 pb-1.5">Línea de Tiempo</h3>
          
          {activities.length === 0 ? (
            <p className="text-xs text-slate-500 text-center italic py-4">Sin actividades registradas.</p>
          ) : (
            <div className="relative border-l border-slate-800 ml-3 space-y-5 py-1">
              {activities.map((act) => {
                const conf = ACTIVITY_ICONS[act.type] || ACTIVITY_ICONS.sistema;
                const formattedDate = new Date(act.created_at).toLocaleString('es-DO', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={act.id} className="relative pl-6 group">
                    {/* Icon Bullet */}
                    <span className={`absolute -left-3.5 top-0.5 w-7 h-7 rounded-full border flex items-center justify-center text-xs shadow-md ${conf.color}`}>
                      {conf.char}
                    </span>
                    
                    {/* Info */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 capitalize">
                          {act.type} · <span className="text-slate-500 font-semibold">{act.created_by}</span>
                        </span>
                        <span className="text-[9px] font-medium text-slate-500 font-mono">{formattedDate}</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium leading-relaxed pr-2">
                        {act.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LeadDetail;
