import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HotelPricingRow = ({ hotel, onSave, onUpdate }) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    // Validaciones
    const numericFields = [
      'base_price_per_night', 'price_per_guest', 'child_price', 
      'max_children_per_room', 'max_child_age', 
      'service_1_price', 'service_2_price', 'service_3_price'
    ];

    for (const field of numericFields) {
      const value = hotel[field];
      if (value !== null && value !== '' && (isNaN(Number(value)) || Number(value) < 0)) {
        toast({
          title: "Error de Validación",
          description: `El campo '${field}' debe ser un número positivo.`,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
    }
    
    await onSave(hotel.hotel_id);
    setIsSaving(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onUpdate(hotel.hotel_id, name, value);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
        <Card>
            <CardHeader>
                <CardTitle>{hotel.hotel_name}</CardTitle>
                <CardDescription>ID: {hotel.hotel_id}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 border-b pb-2">Precios Base</h4>
                    <div className="space-y-2">
                        <Label htmlFor={`base_price_${hotel.hotel_id}`}>Precio Base / Noche</Label>
                        <Input id={`base_price_${hotel.hotel_id}`} name="base_price_per_night" value={hotel.base_price_per_night || ''} onChange={handleInputChange} type="number" min="0" placeholder="e.g., 250" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor={`guest_price_${hotel.hotel_id}`}>Precio / Huésped Extra</Label>
                        <Input id={`guest_price_${hotel.hotel_id}`} name="price_per_guest" value={hotel.price_per_guest || ''} onChange={handleInputChange} type="number" min="0" placeholder="e.g., 125" />
                    </div>
                </div>

                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 border-b border-blue-200 pb-2">Configuración de Niños</h4>
                     <div className="space-y-2">
                        <Label htmlFor={`child_price_${hotel.hotel_id}`}>Precio / Niño</Label>
                        <Input id={`child_price_${hotel.hotel_id}`} name="child_price" value={hotel.child_price || ''} onChange={handleInputChange} type="number" min="0" placeholder="e.g., 50" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor={`max_children_${hotel.hotel_id}`}>Máx. Niños / Habitación</Label>
                        <Input id={`max_children_${hotel.hotel_id}`} name="max_children_per_room" value={hotel.max_children_per_room || ''} onChange={handleInputChange} type="number" min="0" placeholder="e.g., 2" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor={`max_age_${hotel.hotel_id}`}>Edad Máx. de Niño</Label>
                        <Input id={`max_age_${hotel.hotel_id}`} name="max_child_age" value={hotel.max_child_age || ''} onChange={handleInputChange} type="number" min="0" placeholder="e.g., 12" />
                    </div>
                </div>

                 <div className="space-y-4 p-4 bg-green-50 rounded-lg md:col-span-2 lg:col-span-1">
                    <h4 className="font-semibold text-green-800 border-b border-green-200 pb-2">Servicios Adicionales</h4>
                     <div className="grid grid-cols-2 gap-x-2 gap-y-4">
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label htmlFor={`s1_name_${hotel.hotel_id}`}>Servicio 1</Label>
                            <Input id={`s1_name_${hotel.hotel_id}`} name="service_1_name" value={hotel.service_1_name || ''} onChange={handleInputChange} placeholder="Nombre" />
                        </div>
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                           <Label htmlFor={`s1_price_${hotel.hotel_id}`}>Precio</Label>
                           <Input id={`s1_price_${hotel.hotel_id}`} name="service_1_price" value={hotel.service_1_price || ''} onChange={handleInputChange} type="number" min="0" placeholder="0.00" />
                        </div>

                         <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label htmlFor={`s2_name_${hotel.hotel_id}`}>Servicio 2</Label>
                            <Input id={`s2_name_${hotel.hotel_id}`} name="service_2_name" value={hotel.service_2_name || ''} onChange={handleInputChange} placeholder="Nombre" />
                        </div>
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                           <Label htmlFor={`s2_price_${hotel.hotel_id}`}>Precio</Label>
                           <Input id={`s2_price_${hotel.hotel_id}`} name="service_2_price" value={hotel.service_2_price || ''} onChange={handleInputChange} type="number" min="0" placeholder="0.00" />
                        </div>

                         <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label htmlFor={`s3_name_${hotel.hotel_id}`}>Servicio 3</Label>
                            <Input id={`s3_name_${hotel.hotel_id}`} name="service_3_name" value={hotel.service_3_name || ''} onChange={handleInputChange} placeholder="Nombre" />
                        </div>
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                           <Label htmlFor={`s3_price_${hotel.hotel_id}`}>Precio</Label>
                           <Input id={`s3_price_${hotel.hotel_id}`} name="service_3_price" value={hotel.service_3_price || ''} onChange={handleInputChange} type="number" min="0" placeholder="0.00" />
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Cambios
                </Button>
            </CardFooter>
        </Card>
    </motion.div>
  );
};

const AdminPricingPage = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('hotel_pricing').select('*').order('hotel_name', { ascending: true });

      if (error) {
        console.error('Error fetching hotels:', error);
        setError('No se pudieron cargar los datos de los hoteles. Por favor, inténtelo de nuevo.');
        toast({
          title: "Error de Carga",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setHotels(data);
        setError(null);
      }
      setLoading(false);
    };

    fetchHotels();
  }, [toast]);

  const handleUpdateHotel = (hotelId, field, value) => {
    setHotels(currentHotels =>
      currentHotels.map(h => {
        if (h.hotel_id === hotelId) {
          return { ...h, [field]: value };
        }
        return h;
      })
    );
  };

  const handleSaveChanges = async (hotelId) => {
    const hotelToUpdate = hotels.find(h => h.hotel_id === hotelId);

    if (!hotelToUpdate) return;
    
    const parseNumeric = (value) => {
        if (value === '' || value === null || value === undefined) return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
    }

    const updateData = {
        base_price_per_night: parseNumeric(hotelToUpdate.base_price_per_night),
        price_per_guest: parseNumeric(hotelToUpdate.price_per_guest),
        child_price: parseNumeric(hotelToUpdate.child_price),
        max_children_per_room: parseNumeric(hotelToUpdate.max_children_per_room),
        max_child_age: parseNumeric(hotelToUpdate.max_child_age),
        service_1_name: hotelToUpdate.service_1_name,
        service_1_price: parseNumeric(hotelToUpdate.service_1_price),
        service_2_name: hotelToUpdate.service_2_name,
        service_2_price: parseNumeric(hotelToUpdate.service_2_price),
        service_3_name: hotelToUpdate.service_3_name,
        service_3_price: parseNumeric(hotelToUpdate.service_3_price),
    };


    const { error } = await supabase
      .from('hotel_pricing')
      .update(updateData)
      .eq('hotel_id', hotelId);

    if (error) {
      console.error('Error updating hotel:', error);
      toast({
        title: "Error al Guardar",
        description: `No se pudieron guardar los cambios para ${hotelToUpdate.hotel_name}. ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: (
          <div className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            <span>Los precios para <strong>{hotelToUpdate.hotel_name}</strong> se han actualizado correctamente.</span>
          </div>
        ),
        className: "bg-green-100 border-green-300",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin | Gestión de Precios de Hoteles</title>
        <meta name="description" content="Dashboard para gestionar y actualizar los precios y servicios de los hoteles." />
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Precios de Hoteles</h1>
            <p className="mt-2 text-lg text-gray-600">Edita los precios, políticas y servicios adicionales para cada hotel.</p>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        )}
        
        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <div className="flex">
              <div className="py-1"><AlertTriangle className="h-6 w-6 text-red-500 mr-4" /></div>
              <div>
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <AnimatePresence>
                {hotels.map(hotel => (
                    <HotelPricingRow
                        key={hotel.hotel_id}
                        hotel={hotel}
                        onSave={handleSaveChanges}
                        onUpdate={handleUpdateHotel}
                    />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminPricingPage;