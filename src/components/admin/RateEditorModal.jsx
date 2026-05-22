import React, { useState, useEffect } from 'react';
import { ratesService } from '@/services/ratesService';
import { hotelService } from '@/services/hotelService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Calendar, DollarSign, Hotel, Edit, Plus, BedDouble, Sun, Baby } from 'lucide-react';

const RateEditorModal = ({ isOpen, onClose, rateToEdit, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  
  // Dependencias del Hotel seleccionado
  const [rooms, setRooms] = useState([]);
  const [seasons, setSeasons] = useState([]);

  const { toast } = useToast();

  const [formData, setFormData] = useState({
    hotel_id: '',
    room_id: '',
    season_name: '',
    start_date: '',
    end_date: '',
    base_price_adult: '',
    base_price_child: '0',
    base_price_infant: '0', // New 2026 requirement
    is_active: true
  });

  // 1. Cargar Lista de Hoteles al abrir
  useEffect(() => {
    if (isOpen) {
        hotelService.getHotels().then(data => setHotels(data || []));
    }
  }, [isOpen]);

  // 2. Cargar Datos si es Edición o Reset si es Nuevo
  useEffect(() => {
    if (isOpen) {
        if (rateToEdit) {
            // MODE: EDIT
            setFormData({
                id: rateToEdit.id,
                hotel_id: rateToEdit.hotel_id, // Task 5: Ensure hotel_id is used
                room_id: rateToEdit.room_id,
                season_name: rateToEdit.season_name,
                start_date: rateToEdit.start_date,
                end_date: rateToEdit.end_date,
                base_price_adult: rateToEdit.base_price_adult,
                base_price_child: rateToEdit.base_price_child || '0',
                base_price_infant: rateToEdit.base_price_infant || '0',
                is_active: true
            });
            // Cargar dependencias (habitaciones/temporadas) para este hotel específico
            loadDependencies(rateToEdit.hotel_id);
        } else {
            // MODE: CREATE
            setFormData({
                hotel_id: '',
                room_id: '',
                season_name: '',
                start_date: '',
                end_date: '',
                base_price_adult: '',
                base_price_child: '0',
                base_price_infant: '0',
                is_active: true
            });
            setRooms([]);
            setSeasons([]);
        }
    }
  }, [isOpen, rateToEdit]);

  // Helper para cargar habitaciones y temporadas
  const loadDependencies = async (hotelId) => {
    if (!hotelId) return;
    try {
        const deps = await ratesService.getHotelDependencies(hotelId);
        setRooms(deps.rooms || []);
        setSeasons(deps.seasons || []);
    } catch (e) {
        console.error("Error loading dependencies", e);
    }
  };

  // Handler cambio de hotel
  const handleHotelChange = (hotelId) => {
    setFormData(prev => ({ 
        ...prev, 
        hotel_id: hotelId, 
        room_id: '', 
        season_name: '',
        start_date: '',
        end_date: ''
    }));
    loadDependencies(hotelId);
  };

  // Handler selección de temporada
  const handleSeasonSelect = (seasonId) => {
    const season = seasons.find(s => s.id === seasonId);
    if (season) {
        setFormData(prev => ({
            ...prev,
            season_name: season.name,
            start_date: season.start_date,
            end_date: season.end_date
        }));
    }
  };

  // Guardar Cambios
  const handleSave = async () => {
    // Validaciones
    if (!formData.hotel_id || !formData.room_id || !formData.season_name || formData.base_price_adult === '') {
        toast({ title: "Datos incompletos", description: "Selecciona hotel, habitación, temporada y precio adulto.", variant: "destructive" });
        return;
    }
    if (Number(formData.base_price_adult) < 0) {
        toast({ title: "Precio inválido", description: "El precio no puede ser negativo.", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
        const payload = {
            hotel_id: formData.hotel_id, // Task 5: Ensure hotel_id is used
            room_id: formData.room_id,
            season_name: formData.season_name,
            start_date: formData.start_date,
            end_date: formData.end_date,
            base_price_adult: Number(formData.base_price_adult),
            base_price_child: Number(formData.base_price_child || 0),
            base_price_infant: Number(formData.base_price_infant || 0),
            is_active: true
        };

        if (rateToEdit?.id) {
            await ratesService.updateRate(rateToEdit.id, payload);
            toast({ title: "Tarifa Actualizada", description: "Los cambios se guardaron correctamente." });
        } else {
            await ratesService.createRate(payload);
            toast({ title: "Tarifa Creada", description: "La nueva tarifa está activa y visible." });
        }
        
        onSave(); // Refrescar tabla padre
        onClose(); // Cerrar modal
    } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Hubo un problema al guardar la tarifa.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                    <div className="bg-blue-100 p-2 rounded-full">
                        {rateToEdit ? <Edit className="w-5 h-5 text-blue-600"/> : <Plus className="w-5 h-5 text-blue-600"/>}
                    </div>
                    {rateToEdit ? "Editar Tarifa Existente" : "Configurar Nueva Tarifa"}
                </DialogTitle>
                <DialogDescription className="text-gray-500 pt-1">
                    Define precios base por adulto, niño e infante para una combinación de Hotel, Habitación y Temporada.
                </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-6 py-4">
                {/* 1. SELECCIÓN DE HOTEL */}
                <div className="col-span-2 space-y-2">
                    <Label className="flex items-center gap-2 font-bold text-gray-700">
                        <Hotel className="w-4 h-4 text-blue-500"/> Selección de Hotel
                    </Label>
                    <Select value={formData.hotel_id} onValueChange={handleHotelChange} disabled={loading}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Selecciona un Hotel" /></SelectTrigger>
                        <SelectContent>
                            {hotels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* 2. SELECCIÓN DE HABITACIÓN */}
                <div className="col-span-2 md:col-span-1 space-y-2">
                    <Label className="flex items-center gap-2 font-bold text-gray-700">
                        <BedDouble className="w-4 h-4 text-blue-500"/> Habitación
                    </Label>
                    <Select value={formData.room_id} onValueChange={(v) => setFormData(prev => ({...prev, room_id: v}))} disabled={!formData.hotel_id || loading}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Tipo de Habitación" /></SelectTrigger>
                        <SelectContent>
                            {rooms.length === 0 ? (
                                <SelectItem value="disabled" disabled>Sin habitaciones configuradas</SelectItem>
                            ) : (
                                rooms.map(r => <SelectItem key={r.id} value={r.id}>
                                    {/* FIX: Use mapped name property */}
                                    {r.name}
                                </SelectItem>)
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* 3. SELECCIÓN DE TEMPORADA */}
                <div className="col-span-2 md:col-span-1 space-y-2">
                    <Label className="flex items-center gap-2 font-bold text-gray-700">
                        <Sun className="w-4 h-4 text-blue-500"/> Temporada
                    </Label>
                    <Select onValueChange={handleSeasonSelect} disabled={!formData.hotel_id || loading}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder={formData.season_name || "Selecciona Temporada"} />
                        </SelectTrigger>
                        <SelectContent>
                             {seasons.length === 0 ? (
                                <SelectItem value="disabled" disabled>Sin temporadas configuradas</SelectItem>
                            ) : (
                                seasons.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* 4. PREVISUALIZACIÓN DE FECHAS */}
                {formData.start_date && (
                    <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4"/>
                            <span>Vigencia de la Temporada:</span>
                        </div>
                        <div className="font-mono font-medium text-slate-800">
                            {formData.start_date} <span className="text-gray-400 mx-1">➜</span> {formData.end_date}
                        </div>
                    </div>
                )}

                {/* 5. PRECIOS */}
                <div className="col-span-2 border-t pt-4 mt-2">
                    <Label className="block mb-4 text-gray-500 font-semibold uppercase text-xs tracking-wider">Definición de Precios</Label>
                    <div className="grid grid-cols-3 gap-4">
                        {/* Adulto */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1 text-green-700 font-bold">
                                <DollarSign className="w-4 h-4"/> Adulto *
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                                <Input 
                                    type="number" 
                                    min="0"
                                    className="pl-7 font-bold text-lg bg-green-50/50 border-green-200 focus:border-green-500 focus:ring-green-500"
                                    value={formData.base_price_adult}
                                    onChange={e => setFormData(prev => ({...prev, base_price_adult: e.target.value}))}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        {/* Niño */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1 text-orange-600 font-bold">
                                <DollarSign className="w-4 h-4"/> Niño
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                                <Input 
                                    type="number" 
                                    min="0"
                                    className="pl-7 bg-white"
                                    value={formData.base_price_child}
                                    onChange={e => setFormData(prev => ({...prev, base_price_child: e.target.value}))}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        {/* Infante */}
                         <div className="space-y-2">
                            <Label className="flex items-center gap-1 text-gray-500 font-bold">
                                <Baby className="w-4 h-4"/> Infante
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                                <Input 
                                    type="number" 
                                    min="0"
                                    className="pl-7 bg-white"
                                    value={formData.base_price_infant}
                                    onChange={e => setFormData(prev => ({...prev, base_price_infant: e.target.value}))}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">Cancelar</Button>
                <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto shadow-sm">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
                    {rateToEdit ? "Guardar Cambios" : "Guardar Nueva Tarifa"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
};

export default RateEditorModal;