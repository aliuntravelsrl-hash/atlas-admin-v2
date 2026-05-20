import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export const DashboardV26 = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeHotels: 0,
    validatedSlugs: 0,
    hotelsWithRooms: 0,
    hotelsWithServices: 0,
    totalRates: 0,
    lastUpdate: '',
    loading: true
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 30000); // Actualiza cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (showLoading = true) => {
    if (showLoading) {
      setStats(prev => ({ ...prev, loading: true }));
    }
    try {
      // 1. Hoteles Activos
      const { count: activeCount } = await supabase
        .from('hotels_master')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      // 2. Slugs Validados
      const { count: slugCount } = await supabase
        .from('hotels_master')
        .select('id', { count: 'exact', head: true })
        .not('slug', 'is', null)
        .eq('is_active', true);

      // 3. Hoteles con Habitaciones (distinct hotel_id de rooms)
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('hotel_id');
      
      const uniqueHotelsWithRooms = new Set(
        roomsData?.map(r => r.hotel_id).filter(Boolean)
      );
      const roomsCount = uniqueHotelsWithRooms.size;

      // 4. Hoteles con Servicios (services_data no nulo/vacío)
      const { data: servicesData } = await supabase
        .from('hotels_master')
        .select('id, services_data')
        .eq('is_active', true);
      
      const servicesCount = servicesData?.filter(h => 
        h.services_data && Array.isArray(h.services_data) && h.services_data.length > 0
      ).length || 0;

      // 5. Total Tarifas Activas (Rates)
      const { count: ratesCount } = await supabase
        .from('rates')
        .select('id', { count: 'exact', head: true });

      const now = new Date();
      const timeString = now.toTimeString().split(' ')[0];

      setStats({
        activeHotels: activeCount || 0,
        validatedSlugs: slugCount || 0,
        hotelsWithRooms: roomsCount || 0,
        hotelsWithServices: servicesCount || 0,
        totalRates: ratesCount || 0,
        lastUpdate: timeString,
        loading: false
      });
    } catch (error) {
      console.error('Error loading Dashboard V2.6 data:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  if (stats.loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-400 font-medium animate-pulse">Consultando base de datos maestra...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Dashboard V2.6
          </h1>
          <p className="text-slate-400 mt-1 font-medium">
            Monitorización en tiempo real del ecosistema Aliun.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
          <span>Última actualización: {stats.lastUpdate}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Hoteles Activos */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 group flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-500">Hoteles Activos</span>
            <div className="text-4xl font-black text-white group-hover:scale-105 transition-transform duration-300">
              {stats.activeHotels}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>

        {/* Slugs Validados */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 group flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-500">Slugs Validados (KB)</span>
            <div className="text-4xl font-black text-white group-hover:scale-105 transition-transform duration-300">
              {stats.validatedSlugs}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
        </div>

        {/* Hoteles con Habitaciones */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 group flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-500">Hoteles c/ Habitaciones</span>
            <div className="text-4xl font-black text-white group-hover:scale-105 transition-transform duration-300">
              {stats.hotelsWithRooms}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        {/* Hoteles con Servicios */}
        <div className={`bg-slate-900 border rounded-2xl p-6 transition-all duration-300 group flex items-start justify-between ${
          stats.hotelsWithServices === 0 ? 'border-rose-500/30 hover:border-rose-500/50' : 'border-slate-800/80 hover:border-emerald-500/30'
        }`}>
          <div className="space-y-2">
            <span className={`text-xs uppercase tracking-wider font-bold ${
              stats.hotelsWithServices === 0 ? 'text-rose-500' : 'text-emerald-500'
            }`}>Hoteles c/ Servicios</span>
            <div className={`text-4xl font-black group-hover:scale-105 transition-transform duration-300 ${
              stats.hotelsWithServices === 0 ? 'text-rose-400' : 'text-white'
            }`}>
              {stats.hotelsWithServices}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            stats.hotelsWithServices === 0 ? 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20'
          }`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Estado KB Slugs */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-lg">Estado KB Slugs</h3>
              <p className="text-xs text-slate-400 mt-0.5">Hoteles mapeados correctamente en base de datos maestra.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-400">{stats.validatedSlugs}</span>
              <span className="text-slate-500 font-semibold text-sm"> / {stats.activeHotels}</span>
            </div>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${Math.min(100, (stats.validatedSlugs / (stats.activeHotels || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Estado Room Links */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-lg">Estado Room Links</h3>
              <p className="text-xs text-slate-400 mt-0.5">Hoteles con inventario de habitaciones vinculado.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-purple-400">{stats.hotelsWithRooms}</span>
              <span className="text-slate-500 font-semibold text-sm"> / {stats.activeHotels}</span>
            </div>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${Math.min(100, (stats.hotelsWithRooms / (stats.activeHotels || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Total Tarifas Activas (Rates) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group shadow-lg">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Total Tarifas Activas (Rates)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Total de registros de precios en el sistema de cotizaciones.</p>
          </div>
        </div>
        <div className="text-4xl sm:text-5xl font-black text-white relative z-10 font-mono tracking-wider group-hover:scale-105 transition-transform duration-300">
          {stats.totalRates.toLocaleString()}
        </div>
      </div>

    </div>
  );
};

export default DashboardV26;
