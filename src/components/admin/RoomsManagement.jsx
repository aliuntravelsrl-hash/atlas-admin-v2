
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, Users, DollarSign, Calendar, Home, Loader2, RefreshCw, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import CloudSyncBadge from '@/components/admin/CloudSyncBadge';
import ImageUpload from '@/components/ui/ImageUpload';
import { cn } from '@/lib/utils';

const RoomsManagement = ({ hotelId }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({});
  const { toast } = useToast();

  // 1. Fetch Rooms (UUID Safe)
  const fetchRooms = async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false }); // Sort by newest

      if (error) throw error;
      setRooms(data || []);
    } catch (err) {
      toast({ title: "Error fetching rooms", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // 2. Realtime Subscription
  useEffect(() => {
    if (!hotelId) return;
    fetchRooms();

    const channel = supabase.channel(`rooms-${hotelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `hotel_id=eq.${hotelId}` }, (payload) => {
          console.log('Realtime Room Change:', payload);
          fetchRooms();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hotelId]);

  // 3. CRUD Operations
  const handleSave = async () => {
    if (!formData.name) return toast({ title: "Nombre requerido", variant: "destructive" });

    try {
      const payload = {
        hotel_id: hotelId,
        name: formData.name,
        description: formData.description,
        capacity_adults: parseInt(formData.capacity_adults || 2),
        base_price: parseFloat(formData.base_price || 0),
        image_url: formData.image_url,
        is_active: formData.is_active !== false
      };

      let error;
      if (editingRoom) {
        // Update
        const { error: updateError } = await supabase
          .from('rooms')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingRoom.id);
        error = updateError;
      } else {
        // Create
        const { error: insertError } = await supabase
          .from('rooms')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      toast({ title: editingRoom ? "Actualizado" : "Creado", className: "bg-green-50 border-green-200" });
      setEditingRoom(null);
      setFormData({});
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
      if (!confirm("¿Eliminar habitación?")) return;
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Eliminado" });
  };

  // Form Handlers
  const startEdit = (room) => {
      setEditingRoom(room);
      setFormData({ ...room });
  };
  const cancelEdit = () => {
      setEditingRoom(null);
      setFormData({});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
            <Home className="w-5 h-5"/> Gestión de Habitaciones
        </h2>
        <CloudSyncBadge tableName="rooms" />
      </div>

      {/* Editor Card */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
                {editingRoom ? <Edit2 className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                {editingRoom ? "Editar Habitación" : "Nueva Habitación"}
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Junior Suite"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Capacidad</Label>
                        <div className="relative">
                            <Users className="absolute left-2 top-2.5 w-4 h-4 text-slate-400"/>
                            <Input type="number" className="pl-8" value={formData.capacity_adults || ''} onChange={e => setFormData({...formData, capacity_adults: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Precio Base</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-slate-400"/>
                            <Input type="number" className="pl-8" value={formData.base_price || ''} onChange={e => setFormData({...formData, base_price: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="space-y-2">
                <Label>Imagen</Label>
                <ImageUpload value={formData.image_url} onChange={(url) => setFormData({...formData, image_url: url})} />
            </div>

            <div className="flex justify-end gap-2">
                {editingRoom && <Button variant="outline" onClick={cancelEdit}><X className="w-4 h-4 mr-2"/>Cancelar</Button>}
                <Button onClick={handleSave} className="bg-slate-900 text-white"><Save className="w-4 h-4 mr-2"/>Guardar</Button>
            </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {loading && <div className="col-span-full flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400"/></div>}
         
         {!loading && rooms.map(room => (
             <Card key={room.id} className="overflow-hidden group hover:shadow-md transition-all">
                 <div className="aspect-video bg-slate-100 relative">
                     {room.image_url ? (
                         <img src={room.image_url} alt={room.name} className="w-full h-full object-cover"/>
                     ) : (
                         <div className="flex items-center justify-center h-full text-slate-300"><Image className="w-8 h-8"/></div>
                     )}
                     <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => startEdit(room)}><Edit2 className="w-4 h-4"/></Button>
                         <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(room.id)}><Trash2 className="w-4 h-4"/></Button>
                     </div>
                 </div>
                 <CardContent className="p-4">
                     <h4 className="font-bold truncate">{room.name}</h4>
                     <p className="text-sm text-slate-500 line-clamp-2 mb-2">{room.description}</p>
                     <div className="flex gap-2">
                         <Badge variant="secondary"><Users className="w-3 h-3 mr-1"/>{room.capacity_adults}</Badge>
                         <Badge variant="outline"><DollarSign className="w-3 h-3 mr-1"/>{room.base_price}</Badge>
                     </div>
                 </CardContent>
             </Card>
         ))}
      </div>
    </div>
  );
};

export default RoomsManagement;
