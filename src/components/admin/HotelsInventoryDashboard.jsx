import React, { useState, useEffect } from 'react';
import { hotelService } from '@/services/hotelService';
import { hotelDetailService } from '@/services/hotelDetailService';
import { n8nService } from '@/services/n8nService';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { productionLogger } from '@/utils/productionLogger';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Search, RefreshCw, AlertTriangle, Database, MapPin, Phone, WifiOff, FileText, Bed, Calendar, CreditCard, Image as ImageIcon, Shield, Power } from 'lucide-react';
import InventoryStats from './InventoryStats';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { productionLogger.logError('HotelsInventoryDashboard', error); }
  render() {
    if (this.state.hasError) return <div className="p-8 text-center text-red-600">Error crítico en el dashboard. <Button onClick={() => window.location.reload()}>Recargar</Button></div>;
    return this.props.children;
  }
}

const SectionCard = ({ title, icon: Icon, data, loading }) => (
  <Card className="mb-4 shadow-sm border-slate-200">
    <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-100 flex flex-row items-center gap-2">
       <Icon className="w-4 h-4 text-blue-600" />
       <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">{title}</h4>
       {data?.hasData && <Badge variant="outline" className="ml-auto text-xs bg-green-50 text-green-700 border-green-200">Completo</Badge>}
    </CardHeader>
    <CardContent className="p-4">
       {loading ? <Skeleton className="h-20 w-full" /> : (
         data?.hasData ? (
           <div className="space-y-2 text-sm text-slate-600">
             {/* Dynamic Render based on section type would go here, simplified for brevity */}
             {data.items ? (
                 <div className="grid grid-cols-2 gap-2">
                     {data.items.slice(0, 4).map((item, i) => (
                         <div key={i} className="bg-slate-50 p-2 rounded text-xs truncate border">{item.name || item.id}</div>
                     ))}
                     {data.items.length > 4 && <div className="text-xs text-blue-500">+{data.items.length - 4} más...</div>}
                 </div>
             ) : (
                <pre className="whitespace-pre-wrap font-mono text-xs bg-slate-50 p-2 rounded border overflow-x-auto">
                    {JSON.stringify(data, (key, value) => (key === 'hasData' || key === 'items' ? undefined : value), 2)}
                </pre>
             )}
           </div>
         ) : <div className="text-sm text-gray-400 italic flex items-center gap-2"><AlertTriangle className="w-3 h-3" /> Sin datos registrados</div>
       )}
    </CardContent>
  </Card>
);

const HotelsInventoryDashboard = () => {
  const { toast } = useToast();
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [hotelDetails, setHotelDetails] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [n8nStatus, setN8nStatus] = useState(null);
  const [lastSynced, setLastSynced] = useState(new Date());

  // --- Initial Load ---
  const fetchInventory = async () => {
    setLoadingList(true);
    try {
      const [hotelsData, n8nDiag] = await Promise.all([
         hotelService.getHotelsWithStats(),
         n8nService.diagnoseAllWorkflows()
      ]);
      setHotels(hotelsData);
      setN8nStatus(n8nDiag);
      
      // Auto-select first
      if (hotelsData.length > 0 && !selectedHotelId) {
          handleSelectHotel(hotelsData[0].id);
      }
    } catch (e) {
      toast({ title: "Error loading inventory", description: e.message, variant: "destructive" });
    } finally {
      setLoadingList(false);
      setLastSynced(new Date());
    }
  };

  useEffect(() => {
    fetchInventory();
    
    // Shortcut Ctrl+R
    const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            fetchInventory();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Realtime ---
  useRealtimeSubscription('hotels_master', () => {
      toast({ title: "Sync Update", description: "Cambio detectado en hoteles_master" });
      setLastSynced(new Date()); 
      // Optionally re-fetch list here, but debatable UX to auto-refresh list while user is interacting
  });

  // --- Handlers ---
  const handleSelectHotel = async (id) => {
    setSelectedHotelId(id);
    setLoadingDetails(true);
    setHotelDetails(null);
    try {
      const details = await hotelDetailService.getHotelComplete(id);
      setHotelDetails(details);
    } catch (e) {
      toast({ title: "Error loading details", description: e.message, variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredHotels = hotels.filter(h => 
     h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     h.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ErrorBoundary>
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      {/* Top Bar: Stats & Controls */}
      <div>
         <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Inventario Maestro de Hoteles</h1>
            <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">Última sinc: {lastSynced.toLocaleTimeString()}</span>
                <Button variant="outline" size="sm" onClick={fetchInventory} disabled={loadingList}>
                   <RefreshCw className={`w-4 h-4 mr-2 ${loadingList ? 'animate-spin' : ''}`} /> Actualizar
                </Button>
            </div>
         </div>
         <InventoryStats hotels={hotels} n8nStatus={n8nStatus} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Panel: List (3 cols) */}
        <div className="col-span-12 md:col-span-3 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-4 border-b border-slate-100">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <Input 
                   placeholder="Buscar hotel..." 
                   className="pl-9 bg-slate-50" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>
           <ScrollArea className="flex-1 p-2">
              {loadingList ? (
                 <div className="space-y-2 p-2">
                    {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                 </div>
              ) : (
                 <div className="space-y-1">
                    {filteredHotels.map(hotel => (
                       <div 
                         key={hotel.id}
                         onClick={() => handleSelectHotel(hotel.id)}
                         className={`p-3 rounded-lg cursor-pointer transition-all border ${
                            selectedHotelId === hotel.id 
                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                            : 'hover:bg-gray-50 border-transparent'
                         }`}
                       >
                          <div className="flex justify-between items-start">
                             <h4 className={`font-medium text-sm ${selectedHotelId === hotel.id ? 'text-blue-700' : 'text-gray-900'}`}>{hotel.name}</h4>
                             {hotel.is_active ? (
                                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                             ) : (
                                <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5" />
                             )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                             <Badge variant="secondary" className="text-[10px] h-5">{hotel.code}</Badge>
                             <span className="text-xs text-gray-500 truncate">{hotel.city}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </ScrollArea>
           <div className="p-2 border-t border-slate-100 bg-slate-50 text-xs text-center text-gray-500">
              {filteredHotels.length} hoteles encontrados
           </div>
        </div>

        {/* Right Panel: Details (9 cols - 3x grid) */}
        <div className="col-span-12 md:col-span-9 flex flex-col">
           {n8nStatus?.globalStatus === 'ALL_OFFLINE' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-800 text-sm shadow-sm">
                 <WifiOff className="w-4 h-4" />
                 <strong>Modo Offline:</strong> Mostrando datos directamente de Supabase (La Verdad de Hierro). n8n no está disponible para actualizaciones.
              </div>
           )}

           {!selectedHotelId ? (
              <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                 <p className="text-gray-400">Seleccione un hotel para ver detalles completos</p>
              </div>
           ) : (
             <ScrollArea className="h-full pr-4">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* Column 1 */}
                  <div className="space-y-4">
                     <SectionCard title="Información General" icon={FileText} data={hotelDetails?.sections.general} loading={loadingDetails} />
                     <SectionCard title="Ubicación" icon={MapPin} data={hotelDetails?.sections.location} loading={loadingDetails} />
                     <SectionCard title="Contacto" icon={Phone} data={hotelDetails?.sections.contact} loading={loadingDetails} />
                     <SectionCard title="Estado Operativo" icon={Power} data={hotelDetails?.sections.operative} loading={loadingDetails} />
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-4">
                     <SectionCard title="Habitaciones" icon={Bed} data={hotelDetails?.sections.rooms} loading={loadingDetails} />
                     <SectionCard title="Temporadas" icon={Calendar} data={hotelDetails?.sections.seasons} loading={loadingDetails} />
                     <SectionCard title="Tarifas" icon={CreditCard} data={hotelDetails?.sections.rates} loading={loadingDetails} />
                  </div>

                  {/* Column 3 */}
                  <div className="space-y-4">
                     <SectionCard title="Multimedia" icon={ImageIcon} data={hotelDetails?.sections.multimedia} loading={loadingDetails} />
                     <SectionCard title="Amenidades" icon={Database} data={hotelDetails?.sections.amenities} loading={loadingDetails} />
                     <SectionCard title="Políticas" icon={Shield} data={hotelDetails?.sections.policies} loading={loadingDetails} />
                  </div>

               </div>
             </ScrollArea>
           )}
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default HotelsInventoryDashboard;