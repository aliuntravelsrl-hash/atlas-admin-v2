import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export const AdminPanel41 = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [activeTab, setActiveTab] = useState('media');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Formulario Multimedia
  const [mediaData, setMediaData] = useState({
    heroVideoUrl: '',
    aboutImageUrl: '',
    galleryUrls: ''
  });

  // Formulario Tarifas
  const [ratesData, setRatesData] = useState({
    roomType: 'Estándar',
    basePrice: 150,
    priceHighSeason: 220,
    currency: 'USD'
  });

  // Formulario Políticas (FLAT)
  const [policiesText, setPoliciesText] = useState('');
  const [policiesError, setPoliciesError] = useState('');

  useEffect(() => {
    loadHotels();
  }, []);

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

  // Guardar Políticas FLAT
  const savePolicies = async () => {
    // Validador FLAT: No permitir JSON malformados ni inyecciones raras.
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
    <div className="space-y-8 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-100">
      
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
          📷 Multimedia
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
                placeholder="https://images.unsplash.com/photo-1
https://images.unsplash.com/photo-2"
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
            <h3 className="font-bold text-white text-lg">Ajustador de Tarifas Base (Simulado)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Tipo de Habitación</label>
                <select
                  value={ratesData.roomType}
                  onChange={(e) => setRatesData({ ...ratesData, roomType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 outline-none transition text-sm font-semibold"
                >
                  <option>Estándar</option>
                  <option>Junior Suite</option>
                  <option>Deluxe Ocean View</option>
                  <option>Family Room</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Precio Base de Venta (USD)</label>
                <input
                  type="number"
                  value={ratesData.basePrice}
                  onChange={(e) => setRatesData({ ...ratesData, basePrice: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 outline-none transition text-sm font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Precio Temporada Alta (USD)</label>
                <input
                  type="number"
                  value={ratesData.priceHighSeason}
                  onChange={(e) => setRatesData({ ...ratesData, priceHighSeason: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 outline-none transition text-sm font-semibold"
                />
              </div>
            </div>

            <button
              onClick={() => alert('Actualización de tarifas enviada al Workflow D en n8n')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              Enviar a n8n (Workflow D)
            </button>
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
