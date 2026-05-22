
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageUpload from '@/components/ui/ImageUpload';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { hotelService } from '@/services/hotelService';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const COMMON_AMENITIES = [
  "Aire acondicionado", "Wifi gratis", "TV Cable", "Minibar", 
  "Caja fuerte", "Balcón", "Vista al mar", "Baño privado", 
  "Secador de pelo", "Cafetera"
];

const RoomFormModal = ({ isOpen, onClose, hotelId, roomToEdit, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    capacity_adults: 2,
    capacity_kids: 0,
    base_price: 0,
    size_sqm: 0,
    image_url: '',
    description: '',
    amenities: []
  });

  useEffect(() => {
    if (roomToEdit) {
      setFormData({
        name: roomToEdit.name || '',
        capacity_adults: roomToEdit.capacity_adults || roomToEdit.capacity || 2,
        capacity_kids: roomToEdit.capacity_kids || 0,
        base_price: roomToEdit.base_price || roomToEdit.price || 0,
        size_sqm: roomToEdit.size_sqm || 0,
        image_url: roomToEdit.image_url || roomToEdit.image || '',
        description: roomToEdit.description || '',
        amenities: Array.isArray(roomToEdit.amenities) ? roomToEdit.amenities : []
      });
    } else {
      setFormData({
        name: '',
        capacity_adults: 2,
        capacity_kids: 0,
        base_price: 0,
        size_sqm: 0,
        image_url: '',
        description: '',
        amenities: []
      });
    }
  }, [roomToEdit, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity) => {
    setFormData(prev => {
      const current = prev.amenities || [];
      if (current.includes(amenity)) {
        return { ...prev, amenities: current.filter(a => a !== amenity) };
      } else {
        return { ...prev, amenities: [...current, amenity] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast({ title: "Nombre requerido", variant: "destructive" });
    
    setLoading(true);
    try {
      if (roomToEdit) {
        await hotelService.updateRoom(roomToEdit.id, formData);
        toast({ title: "Habitación actualizada", description: "Cambios sincronizados exitosamente" });
      } else {
        await hotelService.createRoom(hotelId, formData);
        toast({ title: "Habitación creada", description: "Nueva habitación agregada y sincronizada" });
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{roomToEdit ? 'Editar Habitación' : 'Nueva Habitación'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de Habitación</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ej. Junior Suite Tropical"
                  className="bg-white text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity_adults">Adultos</Label>
                  <Input 
                    id="capacity_adults" 
                    type="number" 
                    min="1"
                    value={formData.capacity_adults} 
                    onChange={(e) => handleChange('capacity_adults', e.target.value)}
                    className="bg-white text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity_kids">Niños</Label>
                  <Input 
                    id="capacity_kids" 
                    type="number" 
                    min="0"
                    value={formData.capacity_kids} 
                    onChange={(e) => handleChange('capacity_kids', e.target.value)}
                    className="bg-white text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Precio Base (USD)</Label>
                  <Input 
                    id="base_price" 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.base_price} 
                    onChange={(e) => handleChange('base_price', e.target.value)}
                    className="bg-white text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size_sqm">Tamaño (m²)</Label>
                  <Input 
                    id="size_sqm" 
                    type="number" 
                    min="0"
                    value={formData.size_sqm} 
                    onChange={(e) => handleChange('size_sqm', e.target.value)}
                    className="bg-white text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Detalles de la habitación..."
                  className="h-32 bg-white text-gray-900"
                />
              </div>
            </div>

            {/* Right Column: Image & Amenities */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Imagen Principal</Label>
                <ImageUpload 
                  value={formData.image_url} 
                  onChange={(url) => handleChange('image_url', url)} 
                  folderPath="rooms"
                />
              </div>

              <div className="space-y-2">
                <Label>Amenidades</Label>
                <div className="grid grid-cols-2 gap-2 border p-3 rounded-lg bg-slate-50 h-48 overflow-y-auto">
                  {COMMON_AMENITIES.map(amenity => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`amenity-${amenity}`} 
                        checked={formData.amenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      <label 
                        htmlFor={`amenity-${amenity}`} 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Selecciona las características principales.</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              {roomToEdit ? 'Guardar Cambios' : 'Crear Habitación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoomFormModal;
