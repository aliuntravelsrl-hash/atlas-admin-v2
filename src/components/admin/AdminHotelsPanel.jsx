
import React, { useState, useEffect } from 'react';
import { hotelService } from '@/services/hotelService';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Edit, Eye, EyeOff, MapPin, Globe, Star, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import HotelDetailsModal from './HotelDetailsModal';
import { Link } from 'react-router-dom';

const AdminHotelsPanel = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchHotels = async () => {
    console.log('🔄 [AdminHotelsPanel] Refrescando lista de hoteles...');
    setLoading(true);
    try {
      const data = await hotelService.getHotelsForAdmin();
      console.log('✅ [AdminHotelsPanel] Datos recibidos en componente:', data);
      setHotels(data || []);
      
      if (data && data.length === 0) {
          toast({
              title: "Alerta de Datos",
              description: "La consulta retornó 0 hoteles. Verifique Diagnósticos.",
              variant: "warning"
          });
      }
    } catch (error) {
      console.error('✗ [AdminHotelsPanel] Error:', error);
      toast({ 
        title: 'Error de Conexión', 
        description: 'No se pudo conectar con hotels_master.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleEdit = (hotel) => {
    setSelectedHotel(hotel);
    setIsModalOpen(true);
  };

  const togglePublish = async (hotel) => {
      try {
          const newStatus = !hotel.publish;
          const { error } = await supabase
            .from('hotels_master')
            .update({ publish: newStatus })
            .eq('id', hotel.id);
            
          if(error) throw error;
          
          setHotels(prev => prev.map(h => h.id === hotel.id ? { ...h, publish: newStatus } : h));
          toast({ 
              title: newStatus ? "Hotel Publicado" : "Hotel Oculto", 
              description: `Estado actualizado para ${hotel.name}` 
          });
      } catch (err) {
          toast({ title: "Error", description: err.message, variant: "destructive" });
      }
  };

  const filteredHotels = hotels.filter(h => 
    h.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Gestión Maestra</h2>
           <div className="flex items-center gap-2 mt-1">
               <Badge variant="outline" className="text-xs font-normal">
                   Tabla: <span className="font-mono font-bold ml-1">hotels_master</span>
               </Badge>
               <span className="text-sm text-gray-500">
                   {loading ? 'Sincronizando...' : `${hotels.length} registros recuperados`}
               </span>
           </div>
        </div>
        <div className="flex gap-2">
            <Link to="/admin/diagnostics">
                <Button variant="outline" className="gap-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50">
                    <Database className="w-4 h-4" /> Diagnóstico DB
                </Button>
            </Link>
            <Button onClick={fetchHotels} variant="outline" size="icon">
                <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Buscar hotel..." 
          className="pl-9 max-w-md bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && hotels.length === 0 ? (
         <div className="flex flex-col items-center justify-center p-12 space-y-4">
             <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
             <p className="text-gray-500">Conectando con Supabase...</p>
         </div>
      ) : filteredHotels.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No se encontraron hoteles</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2">
                  Si esto es inesperado, verifica la conexión en la página de Diagnóstico.
              </p>
              <Link to="/admin/diagnostics" className="mt-4 inline-block">
                  <Button variant="link">Ir a Diagnósticos</Button>
              </Link>
          </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map(hotel => (
               <Card key={hotel.id} className={`group transition-all hover:shadow-lg bg-white border-l-4 ${hotel.publish ? 'border-l-green-500' : 'border-l-slate-300'}`}>
                  <CardHeader className="pb-3">
                     <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base font-bold truncate flex-1" title={hotel.name}>
                            {hotel.name}
                        </CardTitle>
                        <Badge variant={hotel.publish ? "default" : "secondary"} className={hotel.publish ? "bg-green-600" : ""}>
                            {hotel.publish ? 'Visible' : 'Oculto'}
                        </Badge>
                     </div>
                     <div className="font-mono text-xs text-gray-400 truncate">{hotel.slug}</div>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center"><MapPin className="w-3 h-3 mr-2 text-blue-500"/> Ubicación:</span>
                            <span className="font-medium truncate max-w-[120px]">{hotel.location || hotel.zone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center"><Star className="w-3 h-3 mr-2 text-yellow-500"/> Estrellas:</span>
                            <span className="font-medium">{hotel.stars || hotel.rating || '-'}</span>
                        </div>
                        
                        {/* Status Indicators */}
                        <div className="flex gap-2 pt-2 mt-2 border-t border-dashed">
                             <div className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${hotel.rooms_data?.length > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                 <span className={`w-2 h-2 rounded-full ${hotel.rooms_data?.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                 Rooms
                             </div>
                             <div className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${hotel.services_data?.length > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                 <span className={`w-2 h-2 rounded-full ${hotel.services_data?.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                 Services
                             </div>
                        </div>
                     </div>

                     <div className="flex justify-between items-center mt-4 pt-3 border-t gap-2">
                        <div className="flex items-center space-x-2">
                            <Switch 
                                id={`pub-${hotel.id}`}
                                checked={!!hotel.publish}
                                onCheckedChange={() => togglePublish(hotel)}
                            />
                            <Label htmlFor={`pub-${hotel.id}`} className="sr-only">Publicar</Label>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(hotel)} className="w-full">
                            <Edit className="w-3 h-3 mr-2" /> Gestionar
                        </Button>
                     </div>
                  </CardContent>
               </Card>
            ))}
         </div>
      )}

      {selectedHotel && (
        <HotelDetailsModal 
           hotel={selectedHotel} 
           isOpen={isModalOpen} 
           onClose={() => setIsModalOpen(false)} 
           onUpdate={fetchHotels}
        />
      )}
    </div>
  );
};

export default AdminHotelsPanel;
