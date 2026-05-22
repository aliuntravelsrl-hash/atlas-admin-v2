import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, AlertTriangle, CheckCircle, PlusCircle, Trash2, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

const AdminTransportPage = () => {
  const [transportOptions, setTransportOptions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [transportRes, hotelsRes] = await Promise.all([
      supabase.from('transport_options').select('*').order('created_at', { ascending: false }),
      supabase.from('hotel_pricing').select('hotel_id, hotel_name').order('hotel_name')
    ]);

    if (transportRes.error || hotelsRes.error) {
      const errorMessage = transportRes.error?.message || hotelsRes.error?.message;
      console.error('Error fetching data:', errorMessage);
      setError('No se pudieron cargar los datos. Por favor, inténtelo de nuevo.');
      toast({ title: "Error de Carga", description: errorMessage, variant: "destructive" });
    } else {
      setTransportOptions(transportRes.data);
      setHotels(hotelsRes.data);
      setError(null);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateOption = (id, field, value) => {
    setTransportOptions(currentOptions =>
      currentOptions.map(opt => (opt.id === id ? { ...opt, [field]: value } : opt))
    );
  };

  const handleSaveChanges = async (option) => {
    const { id, name, description, price_per_vehicle, capacity, hotel_slug } = option;

    if (!name || !price_per_vehicle || !capacity || !hotel_slug) {
      toast({ title: "Error de Validación", description: "Nombre, Precio, Capacidad y Hotel son requeridos.", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('transport_options')
      .update({ name, description, price_per_vehicle, capacity, hotel_slug })
      .eq('id', id);

    if (error) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: `Opción "${name}" actualizada.` });
    }
  };

  const handleAddNewOption = async () => {
    const newOption = {
      name: "Nuevo Transporte",
      description: "",
      price_per_vehicle: 0,
      capacity: 1,
      hotel_slug: hotels.length > 0 ? hotels[0].hotel_id : ''
    };

    const { data, error } = await supabase
      .from('transport_options')
      .insert(newOption)
      .select()
      .single();

    if (error) {
      toast({ title: "Error al Añadir", description: error.message, variant: "destructive" });
    } else {
      setTransportOptions(prev => [data, ...prev]);
      toast({ title: "Éxito", description: "Nueva opción de transporte añadida." });
    }
  };

  const handleDeleteOption = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la opción "${name}"?`)) return;

    const { error } = await supabase
      .from('transport_options')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } else {
      setTransportOptions(prev => prev.filter(opt => opt.id !== id));
      toast({ title: "Eliminado", description: `La opción "${name}" ha sido eliminada.` });
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin | Gestión de Transporte</title>
        <meta name="description" content="Dashboard para gestionar las opciones de transporte para los hoteles." />
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Transporte</h1>
            <p className="mt-2 text-lg text-gray-600">Crea, edita y elimina las opciones de transporte para cada hotel.</p>
          </div>
          <Button onClick={handleAddNewOption}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Opción</Button>
        </div>

        {loading && <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>}
        
        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <AnimatePresence>
              {transportOptions.map(option => (
                <motion.div key={option.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Car /> {option.name}</CardTitle>
                      <CardDescription>ID: {option.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label>Hotel Asociado</Label>
                        <select
                          value={option.hotel_slug}
                          onChange={(e) => handleUpdateOption(option.id, 'hotel_slug', e.target.value)}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {hotels.map(hotel => <option key={hotel.hotel_id} value={hotel.hotel_id}>{hotel.hotel_name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nombre del Servicio</Label>
                        <Input value={option.name} onChange={(e) => handleUpdateOption(option.id, 'name', e.target.value)} />
                      </div>
                      <div className="space-y-2 md:col-span-2 lg:col-span-1">
                        <Label>Descripción</Label>
                        <Input value={option.description || ''} onChange={(e) => handleUpdateOption(option.id, 'description', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Precio por Vehículo ($)</Label>
                        <Input type="number" value={option.price_per_vehicle} onChange={(e) => handleUpdateOption(option.id, 'price_per_vehicle', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Capacidad (personas)</Label>
                        <Input type="number" value={option.capacity} onChange={(e) => handleUpdateOption(option.id, 'capacity', e.target.value)} />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteOption(option.id, option.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleSaveChanges(option)}>
                        <Save className="mr-2 h-4 w-4" /> Guardar
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminTransportPage;