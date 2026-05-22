import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { hotelService } from '@/services/hotelService';
import SeasonsManagement from '@/components/admin/SeasonsManagement';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Building2 } from 'lucide-react';

const AdminSeasonsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const data = await hotelService.getHotels();
        setHotels(data || []);
      } catch (error) {
        console.error("Error fetching hotels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  return (
    <>
      <Helmet>
        <title>Admin | Gestión de Temporadas</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Temporadas</h1>
              <p className="text-gray-500 mt-1">Define los periodos de tiempo para aplicar tarifas diferenciadas.</p>
           </div>
           
           <Card className="w-full md:w-auto min-w-[300px] border-l-4 border-l-blue-500 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                 <Building2 className="text-blue-500 h-8 w-8" />
                 <div className="w-full">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Seleccionar Hotel</label>
                    <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Elige un hotel..." />
                        </SelectTrigger>
                        <SelectContent>
                            {hotels.map(h => (
                                <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
              </CardContent>
           </Card>
        </div>

        {selectedHotelId ? (
            <SeasonsManagement hotelId={selectedHotelId} />
        ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <CalendarDays className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Selecciona un hotel</h3>
                <p className="text-gray-500">Debes elegir un hotel para gestionar sus temporadas.</p>
            </div>
        )}
      </div>
    </>
  );
};

export default AdminSeasonsPage;