
import React, { useState, useEffect, useMemo } from 'react';
import { ratesService } from '@/services/ratesService';
import { hotelService } from '@/services/hotelService';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, Trash2, Edit, Loader2, RefreshCw, AlertTriangle, CalendarRange, DollarSign, Filter, Baby } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import RateEditorModal from './RateEditorModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminRatesManager = () => {
  // --- 4. ESTADO LOCAL ---
  const [rates, setRates] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AUDIT FIX: Dinamización del año actual
  const currentYear = new Date().getFullYear().toString();
  const nextYear = (new Date().getFullYear() + 1).toString();

  // Filtros
  const [filters, setFilters] = useState({ 
    hotelId: 'all', 
    searchTerm: '', 
    year: currentYear 
  });

  // Modales
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [rateToEdit, setRateToEdit] = useState(null);
  const [deleteId, setDeleteId] = useState(null); 

  const { toast } = useToast();

  // --- 1. COMPONENTE RATESMANAGEMENT: Fetch & Join ---
  const loadHotels = async () => {
    try {
      const data = await hotelService.getHotels();
      setHotels(data || []);
    } catch (e) {
      console.error("Error loading hotels", e);
    }
  };

  const loadRates = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      console.time("fetchRates");
      // Fetches rates + joined hotels + joined rooms (manually joined in service)
      // Task 5: Ensure hotelId is used for filtering
      const data = await ratesService.getAllRatesExtended(filters.hotelId);
      setRates(data || []);
      console.timeEnd("fetchRates");
    } catch (e) {
      console.error("Fetch rates failed:", e);
      toast({ title: "Error", description: "No se pudieron cargar las tarifas.", variant: "destructive" });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // --- 3. USEEFFECT HOOK: Mount & Realtime ---
  useEffect(() => {
    loadHotels();
    loadRates(true);

    // --- 2. SUPABASE REALTIME ---
    console.log("🔌 [RatesManager] Initializing Realtime Subscription...");
    const channel = supabase
      .channel('rates-realtime-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rates' },
        (payload) => {
          console.log(`⚡ [Realtime] Event: ${payload.eventType} on ID: ${payload.new?.id || payload.old?.id}`);
          // Disparar fetchRates() sin full reload
          loadRates(false); 
          
          // Toast notification for background updates
          toast({
            title: "Sincronización en Tiempo Real",
            description: "Las tarifas se han actualizado automáticamente.",
            className: "bg-blue-50 border-blue-200"
          });
        }
      )
      .subscribe((status) => {
        console.log(`📡 [Realtime] Subscription status: ${status}`);
      });

    // Cleanup listener
    return () => {
      console.log("🔌 [RatesManager] Cleaning up Realtime...");
      supabase.removeChannel(channel);
    };
  }, []); // Dependencias vacías [] para montar solo una vez

  // --- 2. Handlers ---
  const handleEdit = (rate) => {
    setRateToEdit(rate);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setRateToEdit(null);
    setIsEditorOpen(true);
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const executeDelete = async () => {
    try {
      await ratesService.deleteRate(deleteId);
      toast({ title: "Eliminado", description: "La tarifa ha sido eliminada correctamente." });
      setDeleteId(null);
      // loadRates(false); // Realtime will handle this!
    } catch (e) {
      toast({ title: "Error", description: "No se pudo eliminar la tarifa.", variant: "destructive" });
    }
  };

  // --- 9. OPTIMIZACIÓN: Memoized Filtering ---
  const filteredRates = useMemo(() => {
    return rates.filter(r => {
      // 6. FILTROS DINÁMICOS
      
      // A) Filtro por Hotel (Local filter logic if 'all' was fetched, or verifying match)
      // Task 5: Ensure hotel_id is used for filtering (mapped from rooms.hotel_id)
      if (filters.hotelId !== 'all' && r.hotel_id !== filters.hotelId) return false;
      
      // B) Filtro por Search Term (Hotel name, Room name, Season name)
      const term = filters.searchTerm.toLowerCase();
      const hotelName = r.hotels?.name?.toLowerCase() || '';
      // FIX: Ensure we access the mapped name property correctly
      const roomName = r.rooms?.name?.toLowerCase() || '';
      const seasonName = r.season_name?.toLowerCase() || '';
      
      const matchesSearch = !term || (hotelName.includes(term) || roomName.includes(term) || seasonName.includes(term));
      
      // C) Filtro por Año (Start Date) - Manejo dinámico
      let matchesYear = true;
      if (filters.year !== 'all' && r.start_date) {
         matchesYear = r.start_date.startsWith(filters.year);
      }

      return matchesSearch && matchesYear;
    }).sort((a, b) => {
       // 5a. Agrupar por Hotel -> 5b. Habitación -> Start Date
       const hotelA = a.hotels?.name || '';
       const hotelB = b.hotels?.name || '';
       if (hotelA !== hotelB) return hotelA.localeCompare(hotelB);

       const roomA = a.rooms?.name || '';
       const roomB = b.rooms?.name || '';
       if (roomA !== roomB) return roomA.localeCompare(roomB);

       return new Date(a.start_date) - new Date(b.start_date);
    });
  }, [rates, filters]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    Gestión de Tarifas <Badge variant="outline" className="text-sm font-normal ml-2">Realtime Active 🟢</Badge>
                </h2>
                <p className="text-gray-500 mt-1">Configuración centralizada de precios y temporadas ({currentYear}-{nextYear}).</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" onClick={() => loadRates(true)} className="border-gray-200" disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}/> Actualizar
                </Button>
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200">
                    <Plus className="w-4 h-4 mr-2"/> Nueva Tarifa
                </Button>
            </div>
        </div>

        {/* Filters Panel */}
        <Card className="border-none shadow-sm bg-slate-50/50">
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Filtro Hotel */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Filter className="w-3 h-3"/> Hotel
                    </label>
                    <Select value={filters.hotelId} onValueChange={(v) => {
                        setFilters(prev => ({...prev, hotelId: v}));
                    }}>
                        <SelectTrigger className="bg-white border-gray-200"><SelectValue placeholder="Todos los Hoteles" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Hoteles</SelectItem>
                            {hotels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* Filtro Año */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <CalendarRange className="w-3 h-3"/> Año Vigencia
                    </label>
                    <Select value={filters.year} onValueChange={(v) => setFilters(prev => ({...prev, year: v}))}>
                        <SelectTrigger className="bg-white border-gray-200"><SelectValue placeholder="Año" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los años</SelectItem>
                            <SelectItem value={currentYear}>{currentYear}</SelectItem>
                            <SelectItem value={nextYear}>{nextYear} (Próximo)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Search */}
                <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Búsqueda Rápida</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
                        <Input 
                            className="pl-9 bg-white border-gray-200" 
                            placeholder="Buscar por hotel, habitación o temporada..." 
                            value={filters.searchTerm}
                            onChange={(e) => setFilters(prev => ({...prev, searchTerm: e.target.value}))}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* 7. TABLA TARIFAS */}
        <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="border-b bg-white px-6 py-4 flex flex-row justify-between items-center">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-500"/> Listado de Precios
                    <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredRates.length} registros</span>
                </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            {/* 7a. Columna hotel */}
                            <TableHead className="w-[200px] font-bold text-gray-700">Hotel</TableHead>
                            {/* 7b. Columna habitación */}
                            <TableHead className="w-[200px] font-bold text-gray-700">Habitación</TableHead>
                            {/* 7c/d. Columnas fecha */}
                            <TableHead className="font-bold text-gray-700">Temporada & Vigencia</TableHead>
                            {/* 7e. Columna base_price_adult */}
                            <TableHead className="text-center font-bold text-gray-700">Adulto</TableHead>
                            {/* 7f. Columna base_price_child */}
                            <TableHead className="text-center font-bold text-gray-700">Niño</TableHead>
                            {/* 7g. Columna base_price_infant */}
                            <TableHead className="text-center font-bold text-gray-700">Infante</TableHead>
                            {/* 7h. Columna acciones */}
                            <TableHead className="text-right font-bold text-gray-700 pr-6">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="animate-spin inline mr-2 text-blue-600"/> Cargando tarifas...</TableCell></TableRow>
                        ) : filteredRates.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-48 text-center text-gray-500 flex-col items-center justify-center">
                                <div className="flex flex-col items-center justify-center h-full gap-2">
                                    <Search className="w-8 h-8 text-gray-300"/>
                                    <p>No se encontraron tarifas con los filtros actuales.</p>
                                    <Button variant="link" onClick={handleCreate}>Crear la primera tarifa</Button>
                                </div>
                            </TableCell></TableRow>
                        ) : (
                            filteredRates.map((rate) => (
                                <TableRow key={rate.id} className="hover:bg-blue-50/30 transition-colors group border-b border-gray-100">
                                    {/* Hotel */}
                                    <TableCell className="font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-8 bg-blue-500 rounded-full mr-1 opacity-0 group-hover:opacity-100 transition-all"/>
                                            {rate.hotels?.name || '---'}
                                        </div>
                                    </TableCell>
                                    
                                    {/* Room */}
                                    <TableCell className="text-gray-600 font-medium text-xs">
                                        {/* FIX: Use mapped name property */}
                                        {rate.rooms?.name || 'Estándar'}
                                    </TableCell>
                                    
                                    {/* Season & Dates */}
                                    <TableCell>
                                        <div className="space-y-1">
                                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100">
                                                {rate.season_name}
                                            </Badge>
                                            <div className="text-xs text-gray-500 flex items-center gap-1 font-mono">
                                                <CalendarRange className="w-3 h-3"/>
                                                {rate.start_date && rate.end_date ? (
                                                    `${format(parseISO(rate.start_date), 'dd MMM yy', { locale: es })} ➝ ${format(parseISO(rate.end_date), 'dd MMM yy', { locale: es })}`
                                                ) : (
                                                    <span className="text-gray-400">Fechas no disponibles</span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    
                                    {/* Adult Price */}
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700 border border-green-100 font-bold font-mono text-xs">
                                            ${Number(rate.base_price_adult).toFixed(2)}
                                        </div>
                                    </TableCell>
                                    
                                    {/* Child Price */}
                                    <TableCell className="text-center">
                                         <div className="inline-flex items-center px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-100 font-mono text-xs">
                                            ${Number(rate.base_price_child || 0).toFixed(2)}
                                        </div>
                                    </TableCell>
                                    
                                    {/* Infant Price */}
                                    <TableCell className="text-center">
                                         <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-100 font-mono text-xs">
                                            <Baby className="w-3 h-3"/> ${Number(rate.base_price_infant || 0).toFixed(2)}
                                        </div>
                                    </TableCell>
                                    
                                    {/* Actions */}
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700" onClick={() => handleEdit(rate)}>
                                                <Edit className="w-4 h-4"/>
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700" onClick={() => confirmDelete(rate.id)}>
                                                <Trash2 className="w-4 h-4"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>

        {/* Modal de Edición/Creación */}
        <RateEditorModal 
            isOpen={isEditorOpen} 
            onClose={() => setIsEditorOpen(false)}
            rateToEdit={rateToEdit}
            onSave={() => {
                // No action needed really, Realtime or direct update will handle it. 
                // loadRates(false); // Optional fallback
            }}
        />

        {/* Modal de Confirmación de Eliminación */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5"/> ¿Eliminar esta tarifa?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. La tarifa dejará de estar disponible para futuras reservas inmediatamente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">
                        Sí, eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};

export default AdminRatesManager;
