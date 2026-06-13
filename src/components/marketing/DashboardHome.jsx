import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { marketingService } from '../../services/marketingService';

export const DashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    marketing: null,
    financial: null,
    loading: true
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Cargar estadísticas de marketing
      const marketingStats = await marketingService.getMarketingStats();
      
      // Cargar estadísticas financieras desde RPC de Supabase
      const { data: financialData, error: financialError } = await supabase
        .rpc('rpc_get_atlas_dashboard', {
          p_fiscal_period: new Date().toISOString().slice(0, 7) // YYYY-MM
        });

      if (financialError) {
        console.error('Error loading financial dashboard RPC:', financialError);
      }

      setStats({
        marketing: marketingStats,
        financial: financialData || {
          projected_income: 0,
          confirmed_income: 0,
          fees_absorbed: 0,
          net_margin: 0
        },
        loading: false
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Horizons</h1>
        <p className="text-gray-600 mt-1">
          Panel de control - Atlas Motor 2
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <h2 className="text-lg font-bold mb-4 text-gray-800">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <button
            onClick={() => navigate('/marketing/offers/new')}
            className="p-4 border-2 border-blue-100 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition text-left"
          >
            <div className="text-3xl mb-2">📢</div>
            <div className="font-semibold text-gray-800">Nueva Oferta Marketing</div>
            <div className="text-xs text-gray-500 mt-1">Crea campañas con validación financiera.</div>
          </button>
          
          <button
            onClick={() => navigate('/sales/offers')}
            className="p-4 border-2 border-green-100 rounded-lg hover:border-green-500 hover:bg-green-50/50 transition text-left"
          >
            <div className="text-3xl mb-2">💰</div>
            <div className="font-semibold text-gray-800">Nueva Venta</div>
            <div className="text-xs text-gray-500 mt-1">Registra reservas y cotizaciones directamente.</div>
          </button>
          
          <button
            onClick={() => navigate('/financial/dashboard')}
            className="p-4 border-2 border-purple-100 rounded-lg hover:border-purple-500 hover:bg-purple-50/50 transition text-left"
          >
            <div className="text-3xl mb-2">💵</div>
            <div className="font-semibold text-gray-800">Ver Financiero</div>
            <div className="text-xs text-gray-500 mt-1">Revisa ingresos netos y comisiones cobradas.</div>
          </button>
          
          <button
            onClick={() => navigate('/intelligence/scores')}
            className="p-4 border-2 border-orange-100 rounded-lg hover:border-orange-500 hover:bg-orange-50/50 transition text-left"
          >
            <div className="text-3xl mb-2">🧠</div>
            <div className="font-semibold text-gray-800">Análisis Intelligence</div>
            <div className="text-xs text-gray-500 mt-1">Ver atractividad del inventario de hoteles.</div>
          </button>

          <button
            onClick={() => navigate('/admin/excursions')}
            className="p-4 border-2 border-teal-100 rounded-lg hover:border-teal-500 hover:bg-teal-50/50 transition text-left"
          >
            <div className="text-3xl mb-2">🌴</div>
            <div className="font-semibold text-gray-800">Gestión Excursiones</div>
            <div className="text-xs text-gray-500 mt-1">Inventario y reservas manuales.</div>
          </button>
        </div>
      </div>

      {/* Marketing Stats */}
      {stats.marketing && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Marketing</h2>
            <button
              onClick={() => navigate('/marketing/offers')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todas →
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Ofertas"
              value={stats.marketing.total_offers}
              icon="📊"
              color="blue"
            />
            <StatCard
              label="Ofertas Activas"
              value={stats.marketing.active_offers}
              icon="✅"
              color="green"
            />
            <StatCard
              label="Revenue Total"
              value={`$${stats.marketing.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon="💰"
              color="purple"
            />
            <StatCard
              label="Stock Disponible"
              value={stats.marketing.total_stock_available}
              icon="📦"
              color="orange"
            />
          </div>
        </div>
      )}

      {/* Financial Stats */}
      {stats.financial && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Financiero - Atlas</h2>
            <button
              onClick={() => navigate('/financial/dashboard')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver dashboard completo →
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Ingresos Proyectados"
              value={`$${(stats.financial.projected_income || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon="📈"
              color="blue"
            />
            <StatCard
              label="Ingresos Confirmados"
              value={`$${(stats.financial.confirmed_income || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon="✅"
              color="green"
            />
            <StatCard
              label="Fees Absorbidos"
              value={`$${(stats.financial.fees_absorbed || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon="💸"
              color="red"
            />
            <StatCard
              label="Margen Neto"
              value={`$${(stats.financial.net_margin || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon="💵"
              color="purple"
            />
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <h2 className="text-lg font-bold mb-4 text-gray-800">Actividad Reciente</h2>
        <div className="space-y-3">
          <ActivityItem
            icon="📢"
            title="Nueva oferta creada"
            description="Hot Sale Febrero - Occidental Caribe"
            time="Hace 2 horas"
            color="blue"
          />
          <ActivityItem
            icon="✅"
            title="Venta confirmada"
            description="ATLAS-Q-20260131-001 - $2,450"
            time="Hace 4 horas"
            color="green"
          />
          <ActivityItem
            icon="💰"
            title="Pago recibido"
            description="PayPal - $2,450 (Fee: $107.80)"
            time="Hace 5 horas"
            color="purple"
          />
          <ActivityItem
            icon="⚠️"
            title="Oferta próxima a agotar"
            description="Early Bird Marzo - Solo 2 disponibles"
            time="Hace 6 horas"
            color="orange"
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    red: 'bg-red-50 text-red-700 border-red-100'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} flex flex-col justify-between h-28 shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold opacity-80">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-xl md:text-2xl font-black">{value}</div>
    </div>
  );
};

const ActivityItem = ({ icon, title, description, time, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700'
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
      <div className={`w-10 h-10 rounded-full ${colorClasses[color]} flex items-center justify-center text-lg flex-shrink-0 font-bold`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-800">{title}</div>
        <div className="text-sm text-gray-600 truncate">{description}</div>
      </div>
      <div className="text-xs text-gray-400 flex-shrink-0 font-medium">{time}</div>
    </div>
  );
};

export default DashboardHome;
