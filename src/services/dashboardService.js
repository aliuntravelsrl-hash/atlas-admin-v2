
import { supabase } from '@/lib/customSupabaseClient';
import { startOfMonth, endOfMonth, subDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const dashboardService = {

  /**
   * Obtiene métricas principales para los KPIs
   */
  async getMainKPIs() {
    try {
      const today = new Date();
      const firstDay = startOfMonth(today).toISOString();
      const lastDay = endOfMonth(today).toISOString();

      // 1. Ventas Potenciales (Suma de cotizaciones activas del mes)
      // Table 'quotes' -> 'atlas_quotes'
      const { data: quotesData, error: quotesError } = await supabase
        .from('atlas_quotes')
        .select('total_amount')
        .gte('created_at', firstDay)
        .lte('created_at', lastDay);

      if (quotesError) throw quotesError;

      const potentialRevenue = quotesData.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
      const totalQuotations = quotesData.length;

      // 2. Tasa de Conversión (Bookings vs Quotes)
      const { count: bookingsCount, error: bookingsError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDay);
      
      if (bookingsError) throw bookingsError;

      const conversionRate = totalQuotations > 0 
        ? ((bookingsCount / totalQuotations) * 100).toFixed(1) 
        : 0;

      return {
        potentialRevenue,
        totalQuotations,
        conversionRate,
        bookingsCount
      };
    } catch (error) {
      console.error("[DashboardService] Error fetching KPIs:", error);
      return { potentialRevenue: 0, totalQuotations: 0, conversionRate: 0, bookingsCount: 0 };
    }
  },

  /**
   * Obtiene datos para el gráfico de línea de los últimos 7 días
   */
  async getLast7DaysStats() {
    try {
      const today = new Date();
      const last7Days = [];
      
      // Generar array de fechas
      for (let i = 6; i >= 0; i--) {
        last7Days.push(format(subDays(today, i), 'yyyy-MM-dd'));
      }

      const startDate = subDays(today, 6).toISOString();

      // Table 'quotes' -> 'atlas_quotes'
      const { data, error } = await supabase
        .from('atlas_quotes')
        .select('created_at, total_amount')
        .gte('created_at', startDate);

      if (error) throw error;

      // Agrupar por fecha
      const grouped = last7Days.map(date => {
        const dayQuotes = data.filter(q => q.created_at.startsWith(date));
        return {
          date: format(parseISO(date), 'dd MMM', { locale: es }),
          count: dayQuotes.length,
          amount: dayQuotes.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0)
        };
      });

      return grouped;
    } catch (error) {
      console.error("[DashboardService] Error fetching 7 days stats:", error);
      return [];
    }
  },

  /**
   * Obtiene estadísticas de hoteles más cotizados
   */
  async getTopHotels() {
    try {
      // Table 'quotes' -> 'atlas_quotes'
      // Note: atlas_quotes uses 'hotel_slug', not 'hotel_id' with FK to hotels.
      // We will group by hotel_slug directly.
      const { data, error } = await supabase
        .from('atlas_quotes')
        .select('hotel_slug')
        .limit(100); 

      if (error) throw error;

      const hotelCounts = {};
      
      data.forEach(item => {
        const name = item.hotel_slug || "Hotel Desconocido";
        hotelCounts[name] = (hotelCounts[name] || 0) + 1;
      });

      return Object.entries(hotelCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); 
        
    } catch (error) {
      console.error("[DashboardService] Error fetching top hotels:", error);
      return [];
    }
  },

  /**
   * Obtiene actividad reciente (tabla)
   */
  async getRecentActivity(filters = {}) {
    try {
      // Table 'quotes' -> 'atlas_quotes'
      // Adjusted columns to match atlas_quotes schema
      let query = supabase
        .from('atlas_quotes')
        .select(`
          id, 
          created_at, 
          client_name,
          total_amount, 
          status,
          hotel_slug
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros dinámicos
      if (filters.hotelId && filters.hotelId !== 'all') {
        // Assuming filters.hotelId is actually a slug or we need to map it
        query = query.eq('hotel_slug', filters.hotelId);
      }
      
      if (filters.dateFrom) {
         query = query.gte('created_at', filters.dateFrom.toISOString());
      }
      
      if (filters.dateTo) {
         query = query.lte('created_at', filters.dateTo.toISOString());
      }
      
      query = query.limit(50);

      const { data, error } = await query;

      if (error) throw error;
      
      // Map data to expected format for UI
      return data.map(item => ({
          ...item,
          guest_name: item.client_name,
          total_price: item.total_amount,
          hotel: { name: item.hotel_slug, slug: item.hotel_slug } // Mock hotel object
      }));
    } catch (error) {
      console.error("[DashboardService] Error fetching recent activity:", error);
      return [];
    }
  },

  /**
   * Actualiza el estado de una cotización
   */
  async updateQuotationStatus(id, newStatus) {
    try {
      // Table 'quotes' -> 'atlas_quotes'
      const { data, error } = await supabase
        .from('atlas_quotes')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("[DashboardService] Error updating status:", error);
      throw error;
    }
  }
};
