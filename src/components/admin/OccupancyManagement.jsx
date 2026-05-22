import React, { useState, useEffect } from 'react';
import { hotelService } from '@/services/hotelService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Plus, Users } from 'lucide-react';

const OccupancyManagement = ({ hotelId }) => {
  const [occupancies, setOccupancies] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newOcc, setNewOcc] = useState({ 
    room_type_id: '', 
    min_adults: 1, 
    max_adults: 2, 
    max_children: 1, 
    max_total: 3 
  });
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oData, rtData] = await Promise.all([
        hotelService.getOccupancy(hotelId),
        hotelService.getRoomTypes(hotelId)
      ]);
      setOccupancies(oData || []);
      setRoomTypes(rtData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hotelId]);

  const handleAdd = async () => {
    if (!newOcc.room_type_id) {
      toast({ title: 'Selecciona una habitación', variant: 'destructive' });
      return;
    }
    try {
      await hotelService.saveOccupancy({ ...newOcc, hotel_id: hotelId });
      fetchData();
      toast({ title: 'Regla guardada' });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar regla?')) return;
    try {
      await hotelService.deleteOccupancy(id);
      fetchData();
    } catch (e) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
        <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2"><Users className="w-4 h-4"/> Reglas de Ocupación</h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div className="col-span-2 md:col-span-2">
            <Label>Habitación</Label>
            <Select value={newOcc.room_type_id} onValueChange={v => setNewOcc({...newOcc, room_type_id: v})}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                {roomTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
                </SelectContent>
            </Select>
            </div>
            <div>
            <Label>Min Ad.</Label>
            <Input type="number" min="1" value={newOcc.min_adults} onChange={e => setNewOcc({...newOcc, min_adults: e.target.value})} />
            </div>
            <div>
            <Label>Max Ad.</Label>
            <Input type="number" min="1" value={newOcc.max_adults} onChange={e => setNewOcc({...newOcc, max_adults: e.target.value})} />
            </div>
            <div>
            <Label>Max Niños</Label>
            <Input type="number" min="0" value={newOcc.max_children} onChange={e => setNewOcc({...newOcc, max_children: e.target.value})} />
            </div>
            <Button onClick={handleAdd} className="bg-orange-600 hover:bg-orange-700"><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold mb-2">Reglas Vigentes</h4>
        {loading ? <p>Cargando...</p> : occupancies.map(o => (
          <div key={o.id} className="flex justify-between items-center p-3 border rounded bg-white hover:bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <span className="font-medium text-gray-800">{o.room_types?.name || 'N/A'}</span>
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded w-fit">
                 Min Ad: <b>{o.min_adults}</b> | Max Ad: <b>{o.max_adults}</b> | Max Niños: <b>{o.max_children}</b>
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(o.id)} className="text-red-500 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {occupancies.length === 0 && !loading && <p className="text-gray-500 italic text-center py-8">No hay reglas de ocupación.</p>}
      </div>
    </div>
  );
};

export default OccupancyManagement;