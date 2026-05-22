
import React, { useState, useEffect } from 'react';
import { hotelService } from '@/services/hotelService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Plus, Edit2, Save, X, Database, Loader2, BedDouble, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import ImageUpload from '@/components/ui/ImageUpload';
import { Badge } from '@/components/ui/badge';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

// RoomsManagement v2.0 - With Realtime Sync & Robust Error Handling
const RoomsManagement = ({ hotelId }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [hotelSlug, setHotelSlug] = useState(''); 
  const { toast } = useToast();

  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    capacity: 2, 
    image_url: '',
    base_price: 0
  });

  const fetchRooms = async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const [data, hotelData] = await Promise.all([
          hotelService.getRoomsByHotelId(hotelId), // Updated to use direct method
          hotelService.getHotelById(hotelId)
      ]);
      setRooms(data || []);
      if(hotelData) setHotelSlug(hotelData.slug);
    } catch (e) {
      console.error("Fetch rooms error:", e);
      toast({ title: 'Error cargando habitaciones', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (hotelId) fetchRooms(); }, [hotelId]);

  // Realtime Subscription
  useRealtimeSubscription('rooms', (payload) => {
    if (!hotelId) return;
    // Basic filter to ensure we only react to changes for this hotel
    const record = payload.new || payload.old;
    if (record && record.hotel_id === hotelId) {
        console.log("⚡ [RoomsManagement] Realtime update detected");
        fetchRooms(); // Refresh list to ensure strict consistency
    }
  });

  const handleEdit = (room) => {
    setEditingRoom(room.id);
    setFormData({
      name: room.name || '',
      description: room.description || '',
      capacity: room.capacity_adults || room.capacity || 2,
      image_url: room.image_url || '',
      base_price: room.base_price || 0
    });
  };

  const handleSave = async () => {
    if (!formData.name) return toast({ title: 'El nombre es obligatorio', variant: 'destructive' });

    try {
      const payload = {
        hotel_id: hotelId,
        name: formData.name,
        description: formData.description,
        capacity_adults: parseInt(formData.capacity),
        image_url: formData.image_url,
        base_price: parseFloat(formData.base_price)
      };

      if (editingRoom) {
        await hotelService.updateRoom(editingRoom, payload);
      } else {
        await hotelService.createRoom(hotelId, payload);
      }
      
      toast({ 
          title: 'Guardado & Sincronizado', 
          description: 'SQL actualizado y JSONB regenerado automáticamente.', 
          className: "bg-green-50 border-green-200"
      });
      
      setEditingRoom(null);
      setFormData({ name: '', description: '', capacity: 2, image_url: '', base_price: 0 });
      // Fetch is triggered by Realtime or can be called manually here
      fetchRooms();
    } catch (e) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar habitación? Esta acción no se puede deshacer.')) return;
    try {
      await hotelService.deleteRoom(id);
      toast({ title: 'Eliminado y Sincronizado' });
      fetchRooms();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleCancel = () => {
    setEditingRoom(null);
    setFormData({ name: '', description: '', capacity: 2, image_url: '', base_price: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
        <Badge className="absolute top-2 right-2 bg-blue-100 text-blue-800 hover:bg-blue-100 border-0 flex gap-1 cursor-help" title="Los cambios en SQL se reflejan automáticamente en el JSONB">
             <Database className="w-3 h-3"/> SQL + JSONB Sync
        </Badge>
        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          {editingRoom ? <Edit2 className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
          {editingRoom ? 'Editar Habitación' : 'Nueva Habitación'}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
              <div className="space-y-2">
                  <Label>Nombre de Habitación</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Junior Suite"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label>Capacidad (Adultos)</Label>
                      <Input type="number" min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})}/>
                  </div>
                  <div className="space-y-2">
                      <Label>Precio Base (USD)</Label>
                      <Input type="number" min="0" value={formData.base_price} onChange={e => setFormData({...formData, base_price: e.target.value})}/>
                  </div>
              </div>
              <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[100px]" placeholder="Detalles de la habitación..."/>
              </div>
          </div>
          <div className="space-y-2">
            <Label>Imagen Principal</Label>
            <ImageUpload value={formData.image_url} onChange={(url) => setFormData({...formData, image_url: url})} folderPath={`${hotelSlug || 'general'}/rooms`} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-200">
          {editingRoom && (
              <Button variant="outline" onClick={handleCancel}> 
                  <X className="w-4 h-4 mr-2" /> Cancelar 
              </Button>
          )}
          <Button onClick={handleSave} className="bg-slate-900 text-white hover:bg-slate-800">
            <Save className="w-4 h-4 mr-2" /> {editingRoom ? 'Actualizar Habitación' : 'Crear Habitación'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Inventario Actual</h4>
        
        {loading ? (
           <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-slate-300"/></div>
        ) : rooms.length === 0 ? (
           <div className="text-center py-10 border-2 border-dashed rounded-lg bg-slate-50/50">
               <BedDouble className="w-10 h-10 text-slate-300 mx-auto mb-2"/>
               <p className="text-slate-500 font-medium">No hay habitaciones registradas en SQL</p>
               <p className="text-xs text-slate-400 mt-1">Crea una nueva habitación arriba para comenzar.</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 gap-4">
            {rooms.map(room => (
              <Card key={room.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative border">
                    {room.image_url ? (
                        <img src={room.image_url} alt={room.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-50">Sin foto</div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-bold text-lg truncate">{room.name}</h5>
                        {!room.is_active && <Badge variant="destructive" className="h-5 text-[10px] px-1.5">Inactivo</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{room.description || 'Sin descripción'}</p>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="font-normal text-xs">
                            <Users className="w-3 h-3 mr-1"/> {room.capacity_adults} Adultos
                        </Badge>
                        {room.base_price > 0 && (
                            <Badge variant="outline" className="font-medium text-xs border-green-200 text-green-700 bg-green-50">
                                ${room.base_price} USD
                            </Badge>
                        )}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(room)} className="hover:bg-blue-50 hover:text-blue-600"><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(room.id)} className="hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default RoomsManagement;
