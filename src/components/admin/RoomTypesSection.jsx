import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Save, Loader2, Edit } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import { useToast } from '@/components/ui/use-toast';
import { hotelService } from '@/services/hotelService';

const RoomTypesSection = ({ hotelId, hotelSlug }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);
  const { toast } = useToast();

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await hotelService.getRoomTypes(hotelId);
      setRooms(data || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudieron cargar los tipos de habitación.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(hotelId) fetchRooms();
  }, [hotelId]);

  const handleUpdate = async (roomId, field, value) => {
    // Optimistic update locally
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, [field]: value } : r));
  };

  const handleSaveRoom = async (room) => {
    setSaving(room.id);
    try {
      // Sync multimedia: Image, Name, Desc
      await hotelService.saveRoomType({
        id: room.id,
        hotel_id: room.hotel_id,
        name: room.name,
        description: room.description,
        image_url: room.image_url,
        // Mantener otros campos intactos si la API de UI no los expone todos aquí
      });
      toast({ title: "Guardado", description: `Habitación "${room.name}" actualizada.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Gestión Visual de Habitaciones (SQL Sync)</h3>
        <p className="text-sm text-slate-500">Estas imágenes se sincronizan directamente con el motor de reservas.</p>
      </div>

      <div className="grid gap-6">
         {rooms.length === 0 && (
             <div className="text-center p-8 bg-slate-50 rounded border border-dashed text-slate-400">
                No hay habitaciones activas en la base de datos SQL. Ve a la pestaña "Habitaciones" para crear la estructura técnica primero.
             </div>
         )}
         
         {rooms.map((room) => (
           <Card key={room.id} className="overflow-hidden">
             <CardContent className="p-0">
               <div className="grid grid-cols-1 md:grid-cols-12">
                 
                 {/* Image Column */}
                 <div className="md:col-span-4 lg:col-span-3 bg-slate-100 h-64 md:h-auto relative group">
                    <ImageUpload 
                        value={room.image_url} 
                        onChange={(url) => handleUpdate(room.id, 'image_url', url)}
                        folderPath={`${hotelSlug || 'general'}/rooms`}
                        className="h-full w-full"
                    />
                    {/* Badge de Sync */}
                    <div className="absolute top-2 left-2 bg-green-500/90 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow">
                       SYNC ON
                    </div>
                 </div>

                 {/* Details Column */}
                 <div className="md:col-span-8 lg:col-span-9 p-6 space-y-4">
                    <div className="flex justify-between items-start">
                       <div className="space-y-1 flex-1 mr-4">
                           <label className="text-xs font-semibold text-slate-500">Nombre Público</label>
                           <Input 
                             value={room.name} 
                             onChange={(e) => handleUpdate(room.id, 'name', e.target.value)} 
                             className="font-bold text-lg"
                           />
                       </div>
                       <Button 
                         size="sm" 
                         onClick={() => handleSaveRoom(room)} 
                         disabled={saving === room.id}
                         className={saving === room.id ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"}
                       >
                          {saving === room.id ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4 mr-2"/>}
                          Guardar
                       </Button>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-slate-500">Descripción Pública</label>
                       <Textarea 
                          value={room.description || ''} 
                          onChange={(e) => handleUpdate(room.id, 'description', e.target.value)}
                          className="h-20"
                       />
                    </div>
                    
                    <div className="flex gap-4 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                        <span>Capacidad: <strong>{room.capacity_adults || '?'}A + {room.capacity_children || '?'}N</strong></span>
                        <span>Tamaño: <strong>{room.size_sqm ? `${room.size_sqm}m²` : 'N/A'}</strong></span>
                    </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         ))}
      </div>
    </div>
  );
};

export default RoomTypesSection;