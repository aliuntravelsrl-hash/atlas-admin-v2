import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Save, Building2, Calendar, DollarSign, FileText, Image, Users, MapPin, Star, Globe, Eye } from 'lucide-react';
import { hotelService } from '@/services/hotelService';

// Import sub-components
import RoomsManagement from './RoomsManagement';
import SeasonsManagement from './SeasonsManagement';
import RatesManagement from './RatesManagement';
import BookingRulesManagement from './BookingRulesManagement';
import HotelMultimediaTab from './HotelMultimediaTab'; 
import OccupancyManagement from './OccupancyManagement';

const HotelDetailsModal = ({ hotel, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({ 
      name: '', 
      slug: '', 
      stars: 4,
      location: '',
      zone: '',
      publish: false
  });
  const { toast } = useToast();

  useEffect(() => {
     if(hotel) {
        setFormData({
            name: hotel.name || '',
            slug: hotel.slug || '',
            stars: hotel.stars || 4,
            location: hotel.location || '',
            zone: hotel.zone || '',
            publish: hotel.publish || false
        });
     }
  }, [hotel]);

  const handleSaveGeneral = async () => {
     if (!formData.name || !formData.slug) {
         toast({ title: 'Error', description: 'Nombre y Slug son requeridos.', variant: 'destructive' });
         return;
     }

     try {
        await hotelService.updateHotel(hotel.id, {
           name: formData.name,
           slug: formData.slug,
           stars: parseInt(formData.stars),
           location: formData.location,
           zone: formData.zone,
           publish: formData.publish
        });
        toast({ title: 'Guardado', description: 'Información general actualizada.' });
        if (onUpdate) onUpdate();
     } catch (e) {
        toast({ title: 'Error', description: e.message, variant: 'destructive' });
     }
  };

  if (!hotel) return null;
  const hotelId = hotel.id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-slate-50">
        <DialogHeader className="bg-white p-6 -mx-6 -mt-6 border-b sticky top-0 z-10">
          <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-blue-600"/> {hotel.name}
                </DialogTitle>
                <DialogDescription className="text-slate-500 mt-1 flex items-center gap-2">
                    {formData.publish ? (
                        <span className="flex items-center text-green-600 text-xs font-semibold px-2 py-0.5 bg-green-100 rounded-full"><Eye className="w-3 h-3 mr-1"/> Publicado en Web</span>
                    ) : (
                        <span className="flex items-center text-slate-500 text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full"><Eye className="w-3 h-3 mr-1"/> Oculto (Borrador)</span>
                    )}
                    <span className="text-xs font-mono text-slate-400">ID: {hotelId}</span>
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>Cerrar</Button>
              </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-6 bg-white border shadow-sm p-1">
             <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Users className="w-4 h-4"/> General
            </TabsTrigger>
            <TabsTrigger value="rooms" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Building2 className="w-4 h-4"/> Habitaciones
            </TabsTrigger>
            <TabsTrigger value="seasons" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Calendar className="w-4 h-4"/> Temporadas
            </TabsTrigger>
            <TabsTrigger value="rates" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <DollarSign className="w-4 h-4"/> Tarifas
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <FileText className="w-4 h-4"/> Políticas
            </TabsTrigger>
            <TabsTrigger value="multimedia" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Image className="w-4 h-4"/> Multimedia
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 bg-white p-6 rounded-lg border shadow-sm min-h-[500px]">
            <TabsContent value="general" className="space-y-8 m-0 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 border-b pb-2">
                            <Building2 className="w-5 h-5 text-blue-500"/> Información Básica
                        </h3>
                        <div className="space-y-3">
                            <Label>Nombre del Hotel</Label>
                            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Grand Hotel Punta Cana" />
                        </div>
                        <div className="space-y-3">
                            <Label>Slug (URL Amigable)</Label>
                            <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="ej: grand-hotel-punta-cana" />
                            <p className="text-xs text-slate-400">Identificador único usado en la dirección web.</p>
                        </div>
                        
                        <div className="pt-4 flex items-center space-x-4 border-t mt-4">
                            <div className="flex-1">
                                <Label className="mb-2 block">Visibilidad en Web</Label>
                                <div className="flex items-center space-x-2">
                                    <Switch 
                                        checked={formData.publish}
                                        onCheckedChange={(c) => setFormData({...formData, publish: c})}
                                    />
                                    <span className={`text-sm font-medium ${formData.publish ? 'text-green-600' : 'text-slate-500'}`}>
                                        {formData.publish ? 'Publicado (Visible)' : 'Borrador (Oculto)'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location & Details */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 border-b pb-2">
                            <MapPin className="w-5 h-5 text-blue-500"/> Ubicación y Detalles
                        </h3>
                        
                        <div className="space-y-3">
                            <Label>Ubicación (Dirección/Area)</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input className="pl-9" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ej: Playa Bávaro, Punta Cana" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Zona (Región General)</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input className="pl-9" value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} placeholder="Ej: punta-cana" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Categoría (Estrellas)</Label>
                            <div className="relative">
                                <Star className="absolute left-3 top-3 h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <Input 
                                    className="pl-9" 
                                    type="number" 
                                    min="1" 
                                    max="5" 
                                    value={formData.stars} 
                                    onChange={e => setFormData({...formData, stars: e.target.value})} 
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 pt-6">
                        <Button onClick={handleSaveGeneral} className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-lg">
                            <Save className="w-5 h-5 mr-2" /> Guardar Cambios Generales
                        </Button>
                    </div>
                </div>
                
                <div className="mt-8 pt-8 border-t">
                     <OccupancyManagement hotelId={hotelId} />
                </div>
            </TabsContent>

            <TabsContent value="rooms" className="m-0">
                <RoomsManagement hotelId={hotelId} />
            </TabsContent>
            <TabsContent value="seasons" className="m-0">
                <SeasonsManagement hotelId={hotelId} />
            </TabsContent>
            <TabsContent value="rates" className="m-0">
                <RatesManagement hotelId={hotelId} />
            </TabsContent>
            <TabsContent value="policies" className="m-0">
                <BookingRulesManagement hotelId={hotelId} />
            </TabsContent>
            <TabsContent value="multimedia" className="m-0">
                 <HotelMultimediaTab hotelId={hotelId} hotelName={hotel.name} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default HotelDetailsModal;