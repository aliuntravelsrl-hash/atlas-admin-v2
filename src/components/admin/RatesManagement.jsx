
import React, { useState, useEffect } from 'react';
import { ratesService } from '@/services/ratesService';
import { seasonService } from '@/services/seasonService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Plus, Zap, Save, Loader2, Calendar, Edit2, DollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const RatesManagement = ({ hotelId }) => {
  const [rates, setRates] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [newRate, setNewRate] = useState({
    room_id: '',
    season_id: '', 
    valid_from: '',
    valid_to: '',
    adult_rate: '',
    child_rate: ''
  });

  const loadData = async (silent = false) => {
    if (!hotelId) return;
    if (!silent) setLoading(true);
    try {
      const [fetchedRates, fetchedRooms, fetchedSeasons] = await Promise.all([
        ratesService.getAllRates(hotelId),
        ratesService.getRoomsByHotel(hotelId),
        seasonService.getSeasons(hotelId)
      ]);
      setRates(fetchedRates || []);
      setRoomTypes(fetchedRooms || []);
      setSeasons(fetchedSeasons || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [hotelId]);

  const handleSaveRate = async () => {
    // Validation
    if (!newRate.room_id) {
        toast({ title: 'Error', description: 'Selecciona una habitación.', variant: 'destructive' });
        return;
    }
    if (!newRate.valid_from || !newRate.valid_to) {
        toast({ title: 'Error', description: 'Define el rango de fechas.', variant: 'destructive' });
        return;
    }
    if (new Date(newRate.valid_from) > new Date(newRate.valid_to)) {
        toast({ title: 'Error', description: 'Fecha inicio mayor que fin.', variant: 'destructive' });
        return;
    }
    if (!newRate.adult_rate) {
        toast({ title: 'Error', description: 'Precio adulto requerido.', variant: 'destructive' });
        return;
    }

    setSaving(true);
    try {
        // If season not explicitly selected, try to find matching season from list
        let seasonIdToUse = newRate.season_id;
        if (!seasonIdToUse) {
            // Simple logic: pick first season that overlaps or just the first available to satisfy constraint
            const matchingSeason = seasons.find(s => 
                (s.start_date <= newRate.valid_from && s.end_date >= newRate.valid_from)
            );
            if (matchingSeason) seasonIdToUse = matchingSeason.id;
            else if (seasons.length > 0) seasonIdToUse = seasons[0].id; // Fallback
        }

        if (!seasonIdToUse) {
             toast({ title: 'Error', description: 'No se encontró temporada válida para vincular.', variant: 'destructive' });
             setSaving(false);
             return;
        }

        await ratesService.createRate(
            newRate.room_id,
            newRate.valid_from,
            newRate.valid_to,
            newRate.adult_rate,
            newRate.child_rate || 0,
            seasonIdToUse
        );

        toast({ title: 'Tarifa Guardada', description: 'Rango de fechas registrado exitosamente.' });
        setNewRate({ room_id: '', season_id: '', valid_from: '', valid_to: '', adult_rate: '', child_rate: '' });
        loadData(true);

    } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar tarifa?')) return;
    try {
      await ratesService.deleteRate(id);
      toast({ title: 'Tarifa Eliminada' });
      loadData(true);
    } catch (error) {
       toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm">
         <div className="flex justify-between items-center mb-4">
             <h4 className="font-semibold text-slate-800 flex items-center gap-2">
               <Plus className="w-5 h-5 text-blue-600" /> Nueva Tarifa (2026 Ready)
             </h4>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
               <Label>Habitación</Label>
               <Select onValueChange={(val) => setNewRate({...newRate, room_id: val})} value={newRate.room_id}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{roomTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}</SelectContent>
               </Select>
            </div>
            
            <div className="space-y-1.5">
                <Label>Desde</Label>
                <Input type="date" className="bg-white" value={newRate.valid_from} onChange={e => setNewRate({...newRate, valid_from: e.target.value})} />
            </div>

            <div className="space-y-1.5">
                <Label>Hasta</Label>
                <Input type="date" className="bg-white" value={newRate.valid_to} onChange={e => setNewRate({...newRate, valid_to: e.target.value})} />
            </div>

            <div className="space-y-1.5">
               <Label>Temporada (Opcional)</Label>
               <Select onValueChange={(val) => setNewRate({...newRate, season_id: val})} value={newRate.season_id}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Auto-detectar..." /></SelectTrigger>
                  <SelectContent>{seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
               </Select>
            </div>

            <div className="space-y-1.5"><Label>Adulto ($)</Label><Input type="number" step="0.01" className="bg-white" value={newRate.adult_rate} onChange={e => setNewRate({...newRate, adult_rate: e.target.value})} /></div>
            <div className="space-y-1.5"><Label>Niño ($)</Label><Input type="number" step="0.01" className="bg-white" value={newRate.child_rate} onChange={e => setNewRate({...newRate, child_rate: e.target.value})} /></div>
            
            <Button onClick={handleSaveRate} disabled={saving} className="lg:col-span-2 w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 mr-2" />} Guardar Tarifa
            </Button>
         </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white shadow-sm ring-1 ring-slate-100">
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-100/50 border-b text-slate-500 uppercase text-xs font-semibold">
                   <tr>
                      <th className="px-4 py-3">Habitación</th>
                      <th className="px-4 py-3">Vigencia</th>
                      <th className="px-4 py-3 text-right">Adulto</th>
                      <th className="px-4 py-3 text-right">Niño</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {rates.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">
                            {r.rooms?.name}
                            <div className="text-xs text-slate-400 font-normal">{r.season_name}</div>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-xs">
                                <Calendar className="w-3 h-3 text-slate-400"/> 
                                {r.valid_from ? `${format(new Date(r.valid_from), 'dd/MM/yyyy')} - ${format(new Date(r.valid_to), 'dd/MM/yyyy')}` : 'N/A'}
                            </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">${Number(r.base_price_adult).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">${Number(r.base_price_child || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4 text-red-400"/></Button></td>
                      </tr>
                   ))}
                </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};

export default RatesManagement;
