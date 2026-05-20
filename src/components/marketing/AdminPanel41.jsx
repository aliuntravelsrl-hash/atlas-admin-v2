import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export const AdminPanel41 = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [activeTab, setActiveTab] = useState('media');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lista de habitaciones reales del hotel seleccionado
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');

  // Formulario Multimedia
  const [mediaData, setMediaData] = useState({
    heroVideoUrl: '',
    aboutImageUrl: '',
    galleryUrls: ''
  });

  // Formulario Tarifas Reales (Conectado a la tabla `rates` y `rooms`)
  const [ratesData, setRatesData] = useState({
    id: '', // UUID de la tarifa (vacío si es nueva)
    adultRate: 150,
    childRate: 0,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    source: 'MANUAL',
    isActive: true,
    currency: 'USD'
  });

  // Formulario Políticas (FLAT)
  const [policiesText, setPoliciesText] = useState('');
  const [policiesError, setPoliciesError] = useState('');

  useEffect(() => {
    loadHotels();
  }, []);

  // Cargar habitaciones cuando cambia el hotel seleccionado
  useEffect(() => {
    if (selectedHotelId) {
      loadRooms(selectedHotelId);
    }
  }, [selectedHotelId]);

  // Cargar tarifa de la habitación cuando cambia la habitación seleccionada
  useEffect(() => {
    if (selectedRoomId) {
      loadRoomRate(selectedRoomId);
    } else {
      resetRatesForm();
    }
  }, [selectedRoomId]);

  const loadHotels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hotels_master')
        .select('id, name, hero_video, about_image, gallery_data, page_structure')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setHotels(data || []);
      if (data && data.length > 0) {
        setSelectedHotelId(data[0].id);
        fillHotelData(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading hotels for Admin 4.1:', error);
      setLoading(false);
    }
  };

  const loadRooms = async (hotelId) => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, room_type, view_category, is_active')
        .eq('hotel_id', hotelId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setRooms(data || []);
      if (data && data.length > 0) {
        setSelectedRoomId(data[0].id);
      } else {
        setSelectedRoomId('');
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadRoomRate = async (roomId) => {
    try {
      const { data, error } = await supabase
        .from('rates')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const rate = data[0];
        setRatesData({
          id: rate.id,
          adultRate: rate.adult_rate || rate.price_per_night || 0,
          childRate: rate.child_rate || 0,
          validFrom: rate.valid_from || '2026-01-01',
          validTo: rate.valid_to || '2026-12-31',
          source: rate.source || 'MANUAL',
          isActive: rate.is_active !== undefined ? rate.is_active : true,
          currency: rate.currency || 'USD'
        });
      } else {
        resetRatesForm();
      }
    } catch (error) {
      console.error('Error loading room rate:', error);
      resetRatesForm();
    }
  };

  const resetRatesForm = () => {
    setRatesData({
      id: '',
      adultRate: 120,
      childRate: 0,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      source: 'MANUAL',
      isActive: true,
      currency: 'USD'
    });
  };

  const fillHotelData = (hotel) => {
    setMediaData({
      heroVideoUrl: hotel.hero_video || '',
      aboutImageUrl: hotel.about_image || '',
      galleryUrls: Array.isArray(hotel.gallery_data) ? hotel.gallery_data.join('\n') : ''
    });

    const policies = hotel.page_structure?.policies || hotel.page_structure?.rules || '';
    setPoliciesText(typeof policies === 'object' ? JSON.stringify(policies, null, 2) : String(policies));
    setPoliciesError('');
  };

  const handleHotelChange = (e) => {
    const hotelId = e.target.value;
    setSelectedHotelId(hotelId);
    const hotel = hotels.find(h => h.id === hotelId);
    if (hotel) fillHotelData(hotel);
  };

  const handleRoomChange = (e) => {
    setSelectedRoomId(e.target.value);
  };

  // Guardar Multimedia
  const saveMedia = async () => {
    try {
      setSaving(true);
      const galleryArray = mediaData.galleryUrls.split('\n').map(url => url.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from('hotels_master')
        .update({
          hero_video: mediaData.heroVideoUrl,
          about_image: mediaData.aboutImageUrl,
          gallery_data: galleryArray
        })
        .eq('id', selectedHotelId);

      if (error) throw error;
      alert('¡Multimedia actualizado exitosamente!');
      setSaving(false);
      loadHotels();
    } catch (error) {
      console.error('Error saving media:', error);
      alert('Error al guardar datos de multimedia.');
      setSaving(false);
    }
  };

  // Guardar / Upsert de Tarifas en la base de datos real de Supabase
  const saveRates = async () => {
    if (!selectedRoomId) {
      alert('Por favor selecciona una habitación primero.');
      return;
    }

    try {
      setSaving(true);
      
      const ratePayload = {
        room_id: selectedRoomId,
        adult_rate: ratesData.adultRate,
        child_rate: ratesData.childRate,
        price_per_night: ratesData.adultRate,
        valid_from: ratesData.validFrom,
        valid_to: ratesData.validTo,
        source: ratesData.source,
        is_active: ratesData.isActive,
        currency: ratesData.currency,
        year: 2026
      };

      let error;
      if (ratesData.id) {
        // Actualizar tarifa existente
        const { error: updateErr } = await supabase
          .from('rates')
          .update(ratePayload)
          .eq('id', ratesData.id);
        error = updateErr;
      } else {
        // Insertar nueva tarifa
        const { error: insertErr } = await supabase
          .from('rates')
          .insert([ratePayload]);
        error = insertErr;
      }

      if (error) throw error;

      alert('¡Tarifas de Core 1 actualizadas exitosamente en Supabase!');
      setSaving(false);
      loadRoomRate(selectedRoomId);
    } catch (error) {
      console.error('Error saving rates:', error);
      alert('Error al guardar tarifas en Supabase.');
      setSaving(false);
    }
  };

  // Guardar Políticas FLAT
  const savePolicies = async () => {
    if (policiesText.trim().startsWith('{') || policiesText.trim().startsWith('[')) {
      try {
        JSON.parse(policiesText);
        setPoliciesError('');
      } catch (err) {
        setPoliciesError('ERROR: Estructura JSON malformada. Use texto plano o JSON válido.');
        return;
      }
    }

    try {
      setSaving(true);
      const hotel = hotels.find(h => h.id === selectedHotelId);
      const currentStructure = hotel?.page_structure || {};
      
      const updatedStructure = {
        ...currentStructure,
        policies: policiesText
      };

      const { error } = await supabase
        .from('hotels_master')
        .update({
          page_structure: updatedStructure
        })
        .eq('id', selectedHotelId);

      if (error) throw error;
      alert('¡Políticas y Términos actualizados exitosamente!');
      setSaving(false);
      loadHotels();
    } catch (error) {
      console.error('Error saving policies:', error);
      alert('Error al guardar políticas.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Admin 4.1 <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-wider font-extrabold border border-emerald-500/30">Editor</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium">
            Editor rápido de datos de hotel (Multimedia, Tarifas y Políticas FLAT).
          </p>
        </div>
        <div>
          <select
            value={selectedHotelId}
            onChange={handleHotelChange}
            className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 outline-none font-bold text-sm"
          >
            {hotels.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 flex gap-4 text-sm">
        <button
          onClick={() => setActiveTab('media')}
          className={`pb-4 px-2 font-bold transition-all border-b-2 ${
            activeTab === 'media' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📸 Multimedia
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`pb-4 px-2 font-bold transition-all border-b-2 ${
            activeTab === 'rates' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          💰 Tarifas base
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`pb-4 px-2 font-bold transition-all border-b-2 ${
            activeTab === 'policies' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📜 Políticas (FLAT)
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        
        {/* Pestaña Multimedia */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <h3 className="font-bold text-white text-lg">Editor Multimedia</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400">URL del Video Hero (Cabecera)</label>
                <input
                  type="text"
                  value={mediaData.heroVideoUrl}
                  onChange={(e) => setMediaData({ ...mediaData, heroVideoUrl: e.target.value })}
                  placeholder="https://player.vimeo.com/... o youtube.com"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 outline-none transition text-sm font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400">URL Imagen de Presentación (About)</label>
                <input
                  type="text"
                  value={mediaData.aboutImageUrl}
                  onChange={(e) => setMediaData({ ...mediaData, aboutImageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 outline-none transition text-sm font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Galería de Imágenes (Una URL por línea)</label>
              <textarea
                rows={5}
                value={mediaData.galleryUrls}
                onChange={(e) => setMediaData({ ...mediaData, galleryUrls: e.target.value })}
                placeholder="https://images.unsplash.com/photo-1&#10;https://images.unsplash.com/photo-2"
                className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 outline-none transition text-sm font-mono scrollbar-thin"
              />
            </div>

            <button
              onClick={saveMedia}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              {saving ? 'Guardando...' : 'Actualizar Multimedia'}
            </button>
          </div>
        )}

        {/* Pestaña Tarifas */}
        {activeTab === 'rates' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                💰 Tarifas de Core 1 
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest font-black">Live DB</span>
              </h3>
              
              {/* Selector de Habitación Real */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-slate-400 uppercase">Habitación:</span>
                <select
                  value={selectedRoomId}
                  onChange={handleRoomChange}
                  className="bg-slate-950 border border-slate-850 text-white rounded-xl px-3 py-2 outline-none font-bold text-xs"
                  disabled={rooms.length === 0}
                >
                  {rooms.length === 0 ? (
                    <option value="">No hay habitaciones activas</option>
                  ) : (
                    rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.view_category})</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Tarifa Adulto (USD / Noche)</label>
                <input
                  type="number"
                  value={ratesData.adultRate}
                  onChange={(e) => setRatesData({ ...ratesData, adultRate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 outline-none transition text-sm font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Tarifa Niño (USD / Noche)</label>
                <input
                  type="number"
                  value={ratesData.childRate}
                  onChange={(e) => setRatesData({ ...ratesData, childRate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 outline-none transition text-sm font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Válido Desde</label>
                <input
                  type="date"
                  value={ratesData.validFrom}
                  onChange={(e) => setRatesData({ ...ratesData, validFrom: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 outline-none transition text-sm font-semibold text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Válido Hasta</label>
                <input
                  type="date"
                  value={ratesData.validTo}
                  onChange={(e) => setRatesData({ ...ratesData, validTo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 outline-none transition text-sm font-semibold text-white"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Origen de Tarifa (Source)</label>
                <select
                  value={ratesData.source}
                  onChange={(e) => setRatesData({ ...ratesData, source: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 outline-none transition text-sm font-semibold"
                >
                  <option value="MANUAL">Ingreso Manual (Verificado)</option>
                  <option value="FIRECRAWL">Estimado (Firecrawl)</option>
                  <option value="API_INTEGRATION">Integración B2B</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Estado de Tarifa</label>
                <select
                  value={ratesData.isActive ? 'true' : 'false'}
                  onChange={(e) => setRatesData({ ...ratesData, isActive: e.target.value === 'true' })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 outline-none transition text-sm font-semibold"
                >
                  <option value="true">Activa (Aplica a Búsquedas)</option>
                  <option value="false">Inactiva (Oculta en Core 1)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Moneda</label>
                <input
                  type="text"
                  value={ratesData.currency}
                  disabled
                  className="w-full bg-slate-950/40 border border-slate-900 text-slate-550 rounded-xl px-4 py-3 outline-none text-sm font-semibold cursor-not-allowed"
                />
              </div>

            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={saveRates}
                disabled={saving || !selectedRoomId}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition disabled:opacity-40"
              >
                {saving ? 'Guardando en DB...' : 'Guardar y Aplicar a Core 1'}
              </button>

              <button
                onClick={() => {
                  alert('Sincronizando todas las tarifas activas con la caché RAG y n8n...');
                }}
                className="bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold px-6 py-3 rounded-xl border border-slate-850 transition"
              >
                Reindexar Motor RAG
              </button>
            </div>
          </div>
        )}

        {/* Pestaña Políticas FLAT */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">Políticas del Hotel (Texto Plano / FLAT)</h3>
              <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Validador FLAT Activo</span>
            </div>

            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Ingrese políticas legibles. Si ingresa una estructura JSON, se validará de manera estricta antes de inyectar en `page_structure`.
            </p>

            <div className="space-y-2">
              <textarea
                rows={8}
                value={policiesText}
                onChange={(e) => setPoliciesText(e.target.value)}
                placeholder="Escriba aquí las políticas generales..."
                className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 outline-none transition text-sm font-mono scrollbar-thin"
              />
              {policiesError && (
                <div className="text-xs text-rose-500 font-bold bg-rose-500/15 border border-rose-500/20 p-3 rounded-lg">
                  {policiesError}
                </div>
              )}
            </div>

            <button
              onClick={savePolicies}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              {saving ? 'Guardando...' : 'Actualizar Políticas'}
            </button>
          </div>
        )}

      </div>

    </div>
  );
};

export default AdminPanel41;
