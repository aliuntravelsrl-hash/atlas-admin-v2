
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Loader2, TrendingUp, DollarSign, CheckCircle, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/components/ui/use-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboardQuotations = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [kpis, setKpis] = useState({
      totalWon: 0,
      revenue: 0,
      conversionRate: 0,
      totalCount: 0
  });

  const [monthlyData, setMonthlyData] = useState([]);
  const [conversionData, setConversionData] = useState([]);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    console.log("[DashboardQuotations] 📡 Fetching data from Supabase...");
    
    try {
        // Table 'quotations' -> 'atlas_quotes'
        const { data, error } = await supabase
            .from('atlas_quotes')
            .select('*');

        if (error) throw error;

        console.log(`[DashboardQuotations] ✅ Loaded ${data.length} records.`);
        processData(data);
        setQuotations(data);

    } catch (error) {
        console.error("Fetch error:", error);
        toast({ title: t('common.error'), description: "Error loading dashboard data.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const processData = (data) => {
      // Filter Won
      // 'status_ganado_ia' is not in atlas_quotes. Using 'status' === 'won' or similar logic.
      // Assuming 'status' column exists in atlas_quotes.
      const won = data.filter(q => q.status === 'won' || q.status === 'confirmed');
      // 'total_price' -> 'total_amount'
      const totalRevenue = won.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);
      const conversion = data.length > 0 ? ((won.length / data.length) * 100).toFixed(1) : 0;

      setKpis({
          totalWon: won.length,
          revenue: totalRevenue,
          conversionRate: conversion,
          totalCount: data.length
      });

      // Monthly Chart Data
      const months = {};
      data.forEach(q => {
          const date = new Date(q.created_at);
          const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
          if (!months[key]) months[key] = 0;
          months[key]++;
      });

      const chartData = Object.keys(months).map(key => ({
          name: key,
          quotations: months[key]
      })).slice(-6); // Last 6 months

      setMonthlyData(chartData);

      // Pie Chart Data
      setConversionData([
          { name: 'Ganadas', value: won.length },
          { name: 'Pendientes/Perdidas', value: data.length - won.length }
      ]);
  };

  if (loading) {
      return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
        <h2 className="text-2xl font-bold text-gray-800">Analytics de Cotizaciones</h2>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full"><CheckCircle className="w-6 h-6 text-green-600"/></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Cotizaciones Ganadas</p>
                        <h3 className="text-2xl font-bold">{kpis.totalWon}</h3>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full"><DollarSign className="w-6 h-6 text-blue-600"/></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Ingresos Estimados</p>
                        <h3 className="text-2xl font-bold">${kpis.revenue.toLocaleString()}</h3>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-full"><TrendingUp className="w-6 h-6 text-purple-600"/></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Tasa de Conversión</p>
                        <h3 className="text-2xl font-bold">{kpis.conversionRate}%</h3>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>Volumen Mensual</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="quotations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Distribución de Éxito</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={conversionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {conversionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : '#e2e8f0'} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 text-sm">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Ganadas</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 rounded-full"></div> Otras</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
};

export default AdminDashboardQuotations;
