
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Hotel, DollarSign, BedDouble } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import AdminHotelsPanel from '@/components/admin/AdminHotelsPanel';
import AdminRatesPage from '@/pages/admin/AdminRatesPage'; 

/**
 * AdminHotelsPage v4.0
 * Panel de administración con Realtime Listeners activos.
 * Consulta exclusivamente hotels_master.
 */
const AdminHotelsPage = () => {
  const { toast } = useToast();
  
  // Estados para datos
  const [hotels, setHotels] = useState([]);
  const [rates, setRates] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial Fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Task 1 & 4: Query hotels_master (Source of Truth)
        const [hRes, rRes, rmRes] = await Promise.all([
           supabase.from('hotels_master').select('*').order('name'),
           supabase.from('rates').select('*').limit(50), 
           supabase.from('rooms').select('*').limit(50)
        ]);
        
        if (hRes.data) {
            // Map about_image to image_url for compatibility
            const mappedHotels = hRes.data.map(h => ({
                ...h,
                image_url: h.about_image || (Array.isArray(h.gallery_data) && h.gallery_data[0]) || null
            }));
            setHotels(mappedHotels);
        }
        if (rRes.data) setRates(rRes.data);
        if (rmRes.data) setRooms(rmRes.data);
        
      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Realtime Listeners ---

  // 1. Hotels Master Listener
  useRealtimeSubscription('hotels_master', (payload) => {
    console.log("🔥 [Admin REALTIME] Hotels Master Update:", payload);
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT') {
        const mapped = { ...newRecord, image_url: newRecord.about_image };
        setHotels(prev => [...prev, mapped]);
        toast({ title: "Hotel Creado", description: newRecord.name });
    } else if (eventType === 'UPDATE') {
        const mapped = { ...newRecord, image_url: newRecord.about_image };
        setHotels(prev => prev.map(h => h.id === mapped.id ? mapped : h));
        toast({ title: "Hotel Actualizado", description: newRecord.name });
    } else if (eventType === 'DELETE') {
        setHotels(prev => prev.filter(h => h.id !== oldRecord.id));
        toast({ title: "Hotel Eliminado", variant: "destructive" });
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Admin | Hoteles y Tarifas v4.0</title>
      </Helmet>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-green-600 animate-pulse" />
            Panel Maestro v4.0
        </h1>
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Tabla Maestra: <span className="text-blue-600 font-bold">hotels_master</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Hoteles Maestros</CardTitle>
                <Hotel className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{hotels.length}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Tarifas Registradas</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{rates.length}+</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Habitaciones</CardTitle>
                <BedDouble className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{rooms.length}+</div>
            </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hotels" className="w-full">
        <TabsList className="mb-4 bg-gray-100 p-1">
            <TabsTrigger value="hotels" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Gestión Hoteles</TabsTrigger>
            <TabsTrigger value="rates" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Gestión Tarifas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hotels">
            <AdminHotelsPanel hotels={hotels} loading={loading} />
        </TabsContent>
        
        <TabsContent value="rates">
            <AdminRatesPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminHotelsPage;
