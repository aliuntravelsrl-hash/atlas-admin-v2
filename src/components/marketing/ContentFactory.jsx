import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Video, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  Sparkles, 
  Play, 
  Trash2, 
  Calendar, 
  Check, 
  Clock, 
  TrendingUp, 
  Users, 
  Globe, 
  DollarSign, 
  AlertCircle,
  Smartphone,
  ExternalLink,
  Save,
  CheckCircle,
  Repeat
} from 'lucide-react';

export const ContentFactory = () => {
  const [activeTab, setActiveTab] = useState('ingest');
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);

  // Ingestion State
  const [url, setUrl] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('');
  const [applyBranding, setApplyBranding] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionLogs, setExtractionLogs] = useState([]);
  const [extractedData, setExtractedData] = useState(null);

  // Queue State
  const [queue, setQueue] = useState([
    {
      id: 'q-1',
      title: 'Increíbles Toboganes en Lopesan Costa Bávaro',
      url: 'https://www.tiktok.com/@travel_lovers/video/7212457812',
      hotel_slug: 'lopesan-costa-bavaro',
      hotel_name: 'Lopesan Costa Bávaro Resort',
      duration: '45s',
      platform: 'tiktok',
      status: 'pending',
      thumbnail: 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=400&q=80',
      caption: '¡El paraíso familiar existe! 🌊 ¿Estás listo para tirarte por estos toboganes? Lopesan Costa Bávaro lo tiene todo. Reserva hoy con 25% OFF y traslado gratuito incluido en tu paquete. Escríbenos directamente al link para cotizar en segundos. 📲✨ #PuntaCana #LopesanCostaBavaro #ViajaAliun',
      suggested_by: 'IA (Gemini 1.5 Flash)',
      created_at: '2026-05-21T09:30:00Z',
      scheduled_for: '2026-05-22T15:00:00'
    },
    {
      id: 'q-2',
      title: 'Piscina Infinity en Luxury Bahia Principe Cayo Levantado',
      url: 'https://www.instagram.com/reel/C3b8m1xL9p2/',
      hotel_slug: 'cayo-levantado-resort',
      hotel_name: 'Cayo Levantado Resort',
      duration: '58s',
      platform: 'instagram',
      status: 'pending',
      thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
      caption: 'Desconéctate del mundo en el santuario de lujo de Samaná. 🏝️ Cayo Levantado Resort te ofrece una experiencia wellness incomparable. Paquete exclusivo de 4 noches con tarifas de preventa. Reserva directa con agente en WhatsApp tocando el enlace de nuestra Bio. 💳 Únicamente 5 bloqueos disponibles. #CayoLevantado #Samaná #LujoDominicano #AliunTravel',
      suggested_by: 'IA (Gemini 1.5 Pro)',
      created_at: '2026-05-21T10:15:00Z',
      scheduled_for: '2026-05-22T18:00:00'
    },
    {
      id: 'q-3',
      title: 'Showcooking en Restaurante El Alcázar - Occidental Caribe',
      url: 'https://www.youtube.com/shorts/qp83mZ10as8',
      hotel_slug: 'occidental-caribe',
      hotel_name: 'Occidental Caribe',
      duration: '32s',
      platform: 'youtube_shorts',
      status: 'pending',
      thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
      caption: '¡La mejor gastronomía del Caribe! 🍽️ Disfruta de cenas temáticas ilimitadas en Occidental Caribe. Paquetes familiares todo incluido con facilidades de pago (reserva con $99 USD y paga el resto en cuotas). Solicita tu itinerario sin costo hoy mismo en el link del perfil. ✈️🇩🇴 #OccidentalCaribe #VacacionesRD #PuntaCana #AliunVentas',
      suggested_by: 'IA (Gemini 1.5 Flash)',
      created_at: '2026-05-21T11:45:00Z',
      scheduled_for: '2026-05-23T12:00:00'
    }
  ]);

  const [selectedQueueItem, setSelectedQueueItem] = useState(null);
  const [editedCaption, setEditedCaption] = useState('');
  const [editedSchedule, setEditedSchedule] = useState('');

  // Logs Operacionales de n8n
  const [systemLogs, setSystemLogs] = useState([
    { id: 1, time: '12:00:02', type: 'SUCCESS', message: 'WF_004_ANALYTICS ejecutado. Métricas diarias actualizadas en Google Sheets.', workflow: 'WF_004' },
    { id: 2, time: '11:46:12', type: 'INFO', message: 'Video Occidental Caribe (q-3) procesado exitosamente por WF_002_BRAND.', workflow: 'WF_002' },
    { id: 3, time: '11:45:00', type: 'INFO', message: 'URL YouTube Shorts extraída por WF_001_EXTRACT. Enviando a Drive.', workflow: 'WF_001' },
    { id: 4, time: '09:00:15', type: 'SUCCESS', message: 'Video ID q-0 publicado vía BLOTATO en IG, TikTok, FB y YouTube.', workflow: 'WF_003' }
  ]);

  // KPIs del Dashboard de Marketing (Con Enfoque atlas_sales)
  const statsData = {
    engagementRate: '4.85%',
    engagementTarget: '4.5%',
    followerGrowth: '+16.2%',
    followerTarget: '+15.0%',
    webTraffic: '+28.4%',
    webTrafficTarget: '+25.0%',
    conversions: '42 reservas',
    costPerLead: '$3.82 USD',
    costPerLeadTarget: '< $5 USD',
    rebookingRate: '22.3%',
    rebookingTarget: '+20.0%',
    netWonRevenue: '$48,250 USD',
    estimatedRoas: '5.2x'
  };

  useEffect(() => {
    fetchHotels();
    if (queue.length > 0) {
      setSelectedQueueItem(queue[0]);
      setEditedCaption(queue[0].caption);
      setEditedSchedule(queue[0].scheduled_for);
    }
  }, []);

  const fetchHotels = async () => {
    try {
      setLoadingHotels(true);
      const { data, error } = await supabase
        .from('hotels_master')
        .select('slug, name')
        .order('name');
      
      if (error) throw error;

      if (data && data.length > 0) {
        setHotels(data);
      } else {
        // Fallback si la tabla está vacía
        setHotels([
          { slug: 'lopesan-costa-bavaro', name: 'Lopesan Costa Bávaro Resort' },
          { slug: 'cayo-levantado-resort', name: 'Cayo Levantado Resort' },
          { slug: 'occidental-caribe', name: 'Occidental Caribe' },
          { slug: 'bahia-principe-grand-aquamarine', name: 'Bahia Principe Grand Aquamarine' },
          { slug: 'hard-rock-punta-cana', name: 'Hard Rock Hotel & Casino Punta Cana' }
        ]);
      }
    } catch (err) {
      console.warn('Error fetching hotels from Supabase:', err);
      setHotels([
        { slug: 'lopesan-costa-bavaro', name: 'Lopesan Costa Bávaro Resort' },
        { slug: 'cayo-levantado-resort', name: 'Cayo Levantado Resort' },
        { slug: 'occidental-caribe', name: 'Occidental Caribe' },
        { slug: 'bahia-principe-grand-aquamarine', name: 'Bahia Principe Grand Aquamarine' }
      ]);
    } finally {
      setLoadingHotels(false);
    }
  };

  const handleExtract = async (e) => {
    e.preventDefault();
    if (!url || !selectedHotel) return;

    setIsExtracting(true);
    setExtractionLogs([]);
    setExtractedData(null);

    const steps = [
      { text: '🔗 Conectando con webhook n8n (WF_001_EXTRACT)...', delay: 400 },
      { text: '⏳ Extrayendo metadatos e investigando URL...', delay: 800 },
      { text: '📥 Descargando video en servidor temporal yt-dlp...', delay: 1200 },
      { text: '🎨 Aplicando watermark y branding ALIUN via FFmpeg (WF_002_BRAND)...', delay: 1800 },
      { text: '🧠 Generando caption enfocado en conversión con Gemini 1.5 Pro...', delay: 2400 },
      { text: '💾 Subiendo archivo original y branded a Google Drive...', delay: 2900 },
      { text: '✅ Ingesta completada. Lista para aprobación.', delay: 3300 }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setExtractionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step.text}`]);
        if (index === steps.length - 1) {
          setIsExtracting(false);
          const hotelObj = hotels.find(h => h.slug === selectedHotel);
          const mockResult = {
            id: `q-${Date.now()}`,
            title: `Explorando ${hotelObj ? hotelObj.name : 'Hotel Partner'}`,
            url: url,
            hotel_slug: selectedHotel,
            hotel_name: hotelObj ? hotelObj.name : selectedHotel,
            duration: '42s',
            platform: url.includes('tiktok') ? 'tiktok' : url.includes('youtube') || url.includes('youtu.be') ? 'youtube_shorts' : 'instagram',
            status: 'pending',
            thumbnail: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=400&q=80',
            caption: `¡Escápate al paraíso en ${hotelObj ? hotelObj.name : 'este resort'}! 🌴 Disfruta de playas cristalinas, gastronomía internacional y amenidades premium. Reserva ahora con tarifa con descuento exclusivo escribiéndonos directamente. 📲 Oferta de tiempo limitado con traslados incluidos. #ViajesCaribe #AliunTravel #Vacaciones2026`,
            suggested_by: 'IA (Gemini 1.5 Pro)',
            created_at: new Date().toISOString(),
            scheduled_for: new Date(Date.now() + 86400000).toISOString().slice(0, 16)
          };
          setExtractedData(mockResult);
          
          // Insertar en la cola interactiva
          setQueue(prev => [mockResult, ...prev]);
          setSelectedQueueItem(mockResult);
          setEditedCaption(mockResult.caption);
          setEditedSchedule(mockResult.scheduled_for);
          setUrl('');

          // Agregar al log general
          setSystemLogs(prev => [
            {
              id: Date.now(),
              time: new Date().toLocaleTimeString(),
              type: 'SUCCESS',
              message: `Video de ${mockResult.hotel_name} ingerido y brandeado con éxito.`,
              workflow: 'WF_001/002'
            },
            ...prev
          ]);
        }
      }, step.delay);
    });
  };

  const handleSelectQueueItem = (item) => {
    setSelectedQueueItem(item);
    setEditedCaption(item.caption);
    setEditedSchedule(item.scheduled_for);
  };

  const handleSaveCaption = () => {
    if (!selectedQueueItem) return;
    setQueue(prev => prev.map(item => 
      item.id === selectedQueueItem.id 
        ? { ...item, caption: editedCaption, scheduled_for: editedSchedule } 
        : item
    ));
    setSelectedQueueItem(prev => ({ ...prev, caption: editedCaption, scheduled_for: editedSchedule }));
    
    // Alerta de éxito guardada
    alert('Caption y fecha guardados localmente.');
  };

  const handleApprove = (id) => {
    const item = queue.find(q => q.id === id);
    if (!item) return;

    // Simular webhook a Blotato
    setQueue(prev => prev.filter(q => q.id !== id));
    
    // Loguear acción
    setSystemLogs(prev => [
      {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `Video "${item.title}" APROBADO. Programado para publicar en Blotato el ${new Date(editedSchedule).toLocaleString()}.`,
        workflow: 'WF_003'
      },
      ...prev
    ]);

    // Limpiar selección
    const remaining = queue.filter(q => q.id !== id);
    if (remaining.length > 0) {
      setSelectedQueueItem(remaining[0]);
      setEditedCaption(remaining[0].caption);
      setEditedSchedule(remaining[0].scheduled_for);
    } else {
      setSelectedQueueItem(null);
    }

    alert(`✅ Video "${item.title}" aprobado con éxito. Enviado al pipeline de Blotato para distribución unificada.`);
  };

  const handleDiscard = (id) => {
    if (!confirm('¿Estás seguro de que deseas descartar este video de la cola?')) return;
    
    const item = queue.find(q => q.id === id);
    setQueue(prev => prev.filter(q => q.id !== id));
    
    setSystemLogs(prev => [
      {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        type: 'WARNING',
        message: `Video "${item ? item.title : id}" DESCARTADO de la cola por el operador.`,
        workflow: 'Horizons UI'
      },
      ...prev
    ]);

    const remaining = queue.filter(q => q.id !== id);
    if (remaining.length > 0) {
      setSelectedQueueItem(remaining[0]);
      setEditedCaption(remaining[0].caption);
      setEditedSchedule(remaining[0].scheduled_for);
    } else {
      setSelectedQueueItem(null);
    }
  };

  return (
    <div className="space-y-8 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-100 min-h-[600px]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Content Factory 🎬 
            <span className="text-xs bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full uppercase tracking-wider font-extrabold border border-rose-500/30">
              R.E.P.L.I.C.A.
            </span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium">
            Fábrica inteligente de videos de viajes, branding FFmpeg y distribución unificada por Blotato.
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl self-start">
          <button
            onClick={() => setActiveTab('ingest')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'ingest' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📥 Ingesta Directa
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition relative ${
              activeTab === 'queue' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📋 Cola de Aprobación
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-slate-950">
                {queue.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'analytics' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 Métricas de Conversión
          </button>
        </div>
      </div>

      {/* Content tabs */}
      {activeTab === 'ingest' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de Ingesta */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔗 Extraer y Brandear Nuevo Video</span>
              </h3>

              <form onSubmit={handleExtract} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">URL del Video Original (Instagram, TikTok, YouTube Shorts)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.tiktok.com/@competidor/video/1234567"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hotel Asociado</label>
                    <select
                      required
                      value={selectedHotel}
                      onChange={(e) => setSelectedHotel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none transition"
                    >
                      <option value="">Selecciona un hotel...</option>
                      {loadingHotels ? (
                        <option disabled>Cargando hoteles...</option>
                      ) : (
                        hotels.map(h => (
                          <option key={h.slug} value={h.slug}>{h.name}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 pt-6 pl-2">
                    <input
                      type="checkbox"
                      id="branding-checkbox"
                      checked={applyBranding}
                      onChange={(e) => setApplyBranding(e.target.checked)}
                      className="w-4.5 h-4.5 rounded bg-slate-950 border-slate-800 text-rose-600 focus:ring-rose-500 focus:ring-offset-slate-950"
                    />
                    <label htmlFor="branding-checkbox" className="text-xs font-semibold text-slate-300 cursor-pointer">
                      Aplicar marca de agua y CTA final (FFmpeg)
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isExtracting}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-rose-600/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Procesando video con n8n...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Extraer, Brandear & Generar Copy</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Consola de logs de la extracción actual */}
            {isExtracting || extractionLogs.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Terminal de Extracción (Logs de n8n)</h4>
                  {isExtracting && <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>}
                </div>
                <div className="bg-slate-950 rounded-xl p-4 font-mono text-[11px] text-slate-300 space-y-2 h-44 overflow-y-auto">
                  {extractionLogs.map((log, index) => (
                    <div key={index} className={log.includes('✅') ? 'text-emerald-400 font-bold' : ''}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center py-10 space-y-2">
                <div className="text-4xl">🍿</div>
                <h4 className="font-bold text-slate-200">¿Listo para replicar contenido exitoso?</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Pega el enlace de algún video de Instagram, TikTok o YouTube Shorts de un hotel o competidor para que n8n lo descargue, inyecte nuestro logo/CTA, y genere un caption optimizado para ventas con IA.
                </p>
              </div>
            )}
          </div>

          {/* n8n Status & Operations Panel */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-md">🧠 Estado del Motor de Contenido</h3>
              
              <div className="space-y-3">
                <StatusRow label="WF_001_EXTRACT" status="ACTIVO" />
                <StatusRow label="WF_002_BRAND" status="ACTIVO" />
                <StatusRow label="WF_003_PUBLISH_BLOTATO" status="ACTIVO" />
                <StatusRow label="WF_004_ANALYTICS" status="ACTIVO" />
              </div>

              <div className="pt-4 border-t border-slate-850 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Licencia Blotato:</span>
                  <span className="text-emerald-400">Creator ($29/mo)</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Consumo este mes:</span>
                  <span className="text-slate-200">42 / 150 posts</span>
                </div>
              </div>
            </div>

            {/* Consola de logs históricos */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-md">🖥️ Historial del Sistema</h3>
              <div className="space-y-3 max-h-56 overflow-y-auto">
                {systemLogs.map(log => (
                  <div key={log.id} className="text-[10px] bg-slate-950 border border-slate-850 p-2.5 rounded-lg space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500">{log.time} ({log.workflow})</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold text-[8px] ${
                        log.type === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>{log.type}</span>
                    </div>
                    <p className="text-slate-300 font-semibold leading-relaxed">{log.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of Pending items */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-bold text-white text-md">Videos en Espera ({queue.length})</h3>
            
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {queue.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-center text-slate-500 italic">
                  No hay videos pendientes de aprobación. ¡Buen trabajo!
                </div>
              ) : (
                queue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectQueueItem(item)}
                    className={`p-3 bg-slate-900 border rounded-xl cursor-pointer hover:border-rose-500/50 transition flex gap-3 ${
                      selectedQueueItem?.id === item.id 
                        ? 'border-rose-500 bg-slate-900/80 shadow-md shadow-rose-500/5' 
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="w-16 h-20 rounded-lg bg-cover bg-center flex-shrink-0 border border-slate-800 relative" style={{ backgroundImage: `url(${item.thumbnail})` }}>
                      <span className="absolute bottom-1 right-1 bg-slate-950/70 px-1 py-0.2 text-[8px] text-white font-black rounded font-mono">
                        {item.duration}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.2 text-[8px] font-black uppercase rounded ${
                          item.platform === 'tiktok' ? 'bg-black text-white border border-slate-800' :
                          item.platform === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                          'bg-red-600 text-white'
                        }`}>
                          {item.platform === 'youtube_shorts' ? 'Short' : item.platform}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-semibold">
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold truncate">{item.hotel_name}</p>
                      <div className="text-[8px] text-slate-500 font-bold">Por: {item.suggested_by}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Details & Action Panel */}
          <div className="lg:col-span-2">
            {selectedQueueItem ? (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedQueueItem.title}</h3>
                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                      <span>Hotel Relacionado:</span>
                      <span className="text-slate-200 font-bold">{selectedQueueItem.hotel_name}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedQueueItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-lg text-[10px] font-bold text-slate-300 flex items-center gap-1 transition"
                    >
                      Ver Original <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => handleDiscard(selectedQueueItem.id)}
                      className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-lg text-[10px] font-bold text-rose-400 flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Descartar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left column: Video preview simulation */}
                  <div className="md:col-span-1 space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Previsualización Branded</label>
                    <div className="aspect-[9/16] bg-slate-950 rounded-2xl border border-slate-850 relative overflow-hidden flex flex-col justify-between p-4 group">
                      <div className="absolute inset-0 bg-cover bg-center opacity-70 group-hover:scale-105 transition duration-500" style={{ backgroundImage: `url(${selectedQueueItem.thumbnail})` }}></div>
                      
                      {/* Top metadata */}
                      <div className="relative z-10 flex justify-between items-start">
                        <div className="bg-slate-950/80 px-2 py-0.5 rounded text-[8px] font-black uppercase text-emerald-400 border border-emerald-500/20">
                          Branding OK (FFmpeg)
                        </div>
                      </div>

                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <button className="w-12 h-12 bg-rose-600/90 text-white rounded-full flex items-center justify-center hover:bg-rose-500 transition shadow-lg shadow-rose-600/20 hover:scale-110">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </button>
                      </div>

                      {/* Bottom overlay simulating branding logo position */}
                      <div className="relative z-10 w-full flex justify-between items-end">
                        <span className="text-[10px] font-mono text-white/80 drop-shadow">aliuntravel.com</span>
                        <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded border border-white/20 text-[9px] font-black text-white">
                          ALIUN TRAVEL
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right column: Edit caption & Schedule */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Copy optimizado para Ventas (Generado por IA)
                        </label>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                          Doctrina atlas_sales
                        </span>
                      </div>
                      <textarea
                        rows="7"
                        value={editedCaption}
                        onChange={(e) => setEditedCaption(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 rounded-xl px-4 py-3 text-xs text-slate-300 font-medium focus:outline-none transition leading-relaxed resize-none"
                      />
                      <div className="text-[10px] text-slate-500 flex items-start gap-1 p-2 bg-slate-950 rounded-lg border border-slate-850">
                        <AlertCircle className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span>
                          Cada copy incluye un llamado a la acción directo con link rastreable y escasez de cupos para incentivar el flujo de caja inmediato.
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fecha y Hora de Publicación</label>
                        <input
                          type="datetime-local"
                          value={editedSchedule}
                          onChange={(e) => setEditedSchedule(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 rounded-xl px-4 py-2 text-xs text-white font-medium focus:outline-none transition font-mono"
                        />
                      </div>

                      <div className="flex items-end gap-2">
                        <button
                          onClick={handleSaveCaption}
                          className="flex-1 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-xl text-xs font-bold text-slate-300 transition flex items-center justify-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" /> Guardar Cambios
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-850 flex gap-4">
                      <button
                        onClick={() => handleApprove(selectedQueueItem.id)}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-sm transition shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Aprobar y Programar (Blotato)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
                <div className="text-5xl">🎬</div>
                <h4 className="font-extrabold text-white text-lg">No hay video seleccionado</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Selecciona una de las tarjetas de la cola de la izquierda para auditar el contenido, optimizar el caption y programar su distribución unificada.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard label="Engagement Promedio" value={statsData.engagementRate} target={statsData.engagementTarget} icon={<Users className="w-4 h-4 text-rose-400" />} color="rose" />
            <KpiCard label="Crecimiento Seguidores" value={statsData.followerGrowth} target={statsData.followerTarget} icon={<TrendingUp className="w-4 h-4 text-indigo-400" />} color="indigo" />
            <KpiCard label="Tráfico Web desde Redes" value={statsData.webTraffic} target={statsData.webTrafficTarget} icon={<Globe className="w-4 h-4 text-blue-400" />} color="blue" />
            <KpiCard label="Conversiones Directas" value={statsData.conversions} target="Meta: +15/mes" icon={<Check className="w-4 h-4 text-emerald-400" />} color="emerald" />
            <KpiCard label="Costo por Lead (CPL)" value={statsData.costPerLead} target={statsData.costPerLeadTarget} icon={<DollarSign className="w-4 h-4 text-amber-400" />} color="amber" />
            <KpiCard label="Tasa de Re-reserva" value={statsData.rebookingRate} target={statsData.rebookingTarget} icon={<Repeat className="w-4 h-4 text-purple-400" />} color="purple" />
          </div>

          {/* ROI & Conversion Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <h3 className="font-bold text-white text-md">Reservas Atribuidas al Contenido</h3>
                <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-3 py-1 rounded-full">
                  ROAS Promedio: {statsData.estimatedRoas}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 uppercase tracking-widest font-black text-[9px] pb-3">
                      <th className="py-2.5 px-3">Video Publicado</th>
                      <th className="py-2.5 px-3 text-center">Impresiones</th>
                      <th className="py-2.5 px-3 text-center">Plataforma</th>
                      <th className="py-2.5 px-3 text-center">Conversión UTM</th>
                      <th className="py-2.5 px-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 font-medium">
                    <tr className="hover:bg-slate-950/40">
                      <td className="py-3 px-3 text-white font-bold">10 Secretos de Cayo Levantado</td>
                      <td className="py-3 px-3 text-center text-slate-300 font-mono">48,920</td>
                      <td className="py-3 px-3 text-center text-rose-400 font-mono uppercase">TikTok</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-mono">12 reservas</td>
                      <td className="py-3 px-3 text-right text-white font-mono font-bold">$14,800 USD</td>
                    </tr>
                    <tr className="hover:bg-slate-950/40">
                      <td className="py-3 px-3 text-white font-bold">Habitación Familiar Lopesan Tour</td>
                      <td className="py-3 px-3 text-center text-slate-300 font-mono">34,110</td>
                      <td className="py-3 px-3 text-center text-purple-400 font-mono uppercase">Instagram</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-mono">18 reservas</td>
                      <td className="py-3 px-3 text-right text-white font-mono font-bold">$22,450 USD</td>
                    </tr>
                    <tr className="hover:bg-slate-950/40">
                      <td className="py-3 px-3 text-white font-bold">Atardecer Perfecto en Occidental Caribe</td>
                      <td className="py-3 px-3 text-center text-slate-300 font-mono">12,500</td>
                      <td className="py-3 px-3 text-center text-blue-400 font-mono uppercase font-bold">Facebook</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-mono">5 reservas</td>
                      <td className="py-3 px-3 text-right text-white font-mono font-bold">$5,200 USD</td>
                    </tr>
                    <tr className="hover:bg-slate-950/40">
                      <td className="py-3 px-3 text-white font-bold">Toboganes en Lopesan Shorts</td>
                      <td className="py-3 px-3 text-center text-slate-300 font-mono">22,300</td>
                      <td className="py-3 px-3 text-center text-red-500 font-mono uppercase">YT Shorts</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-mono">7 reservas</td>
                      <td className="py-3 px-3 text-right text-white font-mono font-bold">$5,800 USD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Platform Comparison */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-md">Distribución por Red (Alcance)</h3>
              
              <div className="space-y-4 pt-2">
                <PlatformProgress label="TikTok" percentage={45} count="55,000 views" color="bg-indigo-500" />
                <PlatformProgress label="Instagram" percentage={35} count="45,000 views" color="bg-pink-500" />
                <PlatformProgress label="Facebook" percentage={12} count="15,000 views" color="bg-blue-600" />
                <PlatformProgress label="YouTube Shorts" percentage={8} count="10,000 views" color="bg-red-600" />
              </div>

              <div className="pt-4 border-t border-slate-850">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-start gap-2">
                  <span className="text-lg">📢</span>
                  <div className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    <span className="font-bold text-white block">Nota de Conversión (Directrices atlas_sales)</span>
                    Todos los clics desde Instagram Bio o enlaces de TikTok se redirigen a un embudo conversacional de Kommo CRM automatizado vía n8n, lo que permite asegurar una alta tasa de contacto inicial.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const StatusRow = ({ label, status }) => (
  <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded-xl">
    <span className="text-xs font-bold text-slate-400 font-mono">{label}</span>
    <span className="px-2 py-0.5 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
      {status}
    </span>
  </div>
);

const KpiCard = ({ label, value, target, icon, color }) => {
  const borderColors = {
    rose: 'hover:border-rose-500/30',
    indigo: 'hover:border-indigo-500/30',
    blue: 'hover:border-blue-500/30',
    emerald: 'hover:border-emerald-500/30',
    amber: 'hover:border-amber-500/30',
    purple: 'hover:border-purple-500/30'
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:scale-[1.02] transition-all duration-300 group flex flex-col justify-between h-32 ${borderColors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider leading-none">{label}</span>
        <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-850">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-lg font-black text-white font-mono">{value}</div>
        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Meta: {target}</div>
      </div>
    </div>
  );
};

const PlatformProgress = ({ label, percentage, count, color }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs font-semibold">
      <span className="text-slate-300">{label}</span>
      <span className="text-slate-400 font-mono text-[10px]">{count}</span>
    </div>
    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-850">
      <div 
        className={`${color} h-full rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  </div>
);

export default ContentFactory;
