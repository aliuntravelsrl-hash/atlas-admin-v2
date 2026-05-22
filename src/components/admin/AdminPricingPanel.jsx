import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AdminPricingPanel = ({ hotelSlug }) => {
    const [pricing, setPricing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const fetchPricing = useCallback(async () => {
        if (!hotelSlug) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('hotel_pricing')
                .select('*')
                .eq('hotel_id', hotelSlug)
                .maybeSingle(); // Changed from single() to maybeSingle()

            if (error) throw error;
            
            if (!data) {
                // If no data exists, we can initialize with default structure or null
                // For now, let's set a basic structure so the form can be used to create it
                setPricing({
                    hotel_id: hotelSlug,
                    hotel_name: '',
                    base_price_per_night: 0,
                    price_per_guest: 0,
                    room_types: {},
                    excursions: {}
                });
            } else {
                setPricing(data);
            }
        } catch (error) {
            console.error("Error fetching pricing:", error);
            toast({ title: 'Error de conexión', description: 'No se pudieron cargar los precios. Revisa tu conexión.', variant: 'destructive' });
            setPricing(null);
        } finally {
            setLoading(false);
        }
    }, [hotelSlug, toast]);

    useEffect(() => {
        fetchPricing();
    }, [fetchPricing]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'hotel_name') {
            setPricing(prev => ({ ...prev, [name]: value }));
            return;
        }
        
        if (value === '' || (Number(value) >= 0 && !isNaN(parseFloat(value)))) {
           setPricing(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleJsonChange = (category, id, field, value) => {
        setPricing(prev => {
            if (!prev) return null;
            const updatedCategory = { ...(prev[category] || {}) };
            
            // Ensure the object exists before setting property
            if (!updatedCategory[id]) updatedCategory[id] = {};

            if (field === 'price' || field === 'price_multiplier') {
                if (value === '' || (Number(value) >= 0 && !isNaN(parseFloat(value)))) {
                    updatedCategory[id][field] = value;
                } else {
                    return prev;
                }
            } else {
                updatedCategory[id][field] = value;
            }
            return { ...prev, [category]: updatedCategory };
        });
    };
    

    const handleSaveChanges = async () => {
        setSaving(true);
        
        try {
            const parseValue = (value) => {
                if (value === null || value === undefined || value === '') return null;
                const parsed = parseFloat(value);
                return isNaN(parsed) ? null : parsed;
            };

            const updateData = {
                hotel_id: hotelSlug, // Ensure ID is present for upsert
                base_price_per_night: parseValue(pricing.base_price_per_night),
                price_per_guest: parseValue(pricing.price_per_guest),
                room_types: pricing.room_types,
                excursions: pricing.excursions,
                hotel_name: pricing.hotel_name,
                max_children_per_room: parseValue(pricing.max_children_per_room),
                child_price: parseValue(pricing.child_price),
                max_child_age: parseValue(pricing.max_child_age),
            };

            // Use upsert to handle both create and update scenarios
            const { error } = await supabase
                .from('hotel_pricing')
                .upsert(updateData, { onConflict: 'hotel_id' });
            
            if (error) throw error;

            toast({ title: '¡Guardado!', description: 'Los precios han sido actualizados.' });
            fetchPricing(); 
        } catch (error) {
            console.error("Error saving pricing:", error);
            toast({ title: 'Error al guardar', description: error.message || 'Falló la conexión.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>;
    }

    if (!pricing) {
        return (
            <div className="text-center text-red-600 p-8 bg-red-50 rounded-lg flex flex-col items-center gap-4">
                <AlertCircle className="w-12 h-12" />
                <h3 className="text-xl font-bold">Datos no disponibles</h3>
                <p>No se pudieron cargar los precios para <code className="font-mono bg-red-100 px-1 rounded">{hotelSlug}</code>.</p>
                <Button variant="outline" onClick={fetchPricing}>Reintentar</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                 <div className='flex-grow'>
                    <Label htmlFor="hotel_name" className="text-sm font-semibold">Nombre del Hotel</Label>
                    <Input id="hotel_name" name="hotel_name" type="text" value={pricing.hotel_name || ''} onChange={handleInputChange} className="h-11 text-base"/>
                </div>
                <p className="text-sm text-gray-500 text-right shrink-0">
                    Última actualización: <br/> {pricing.updated_at ? format(new Date(pricing.updated_at), "dd MMM yyyy, h:mm a", { locale: es }) : 'N/A'}
                </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 border p-6 rounded-lg">
                <div className="space-y-2">
                    <Label htmlFor="base_price_per_night" className="font-semibold">Precio Base por Noche ($)</Label>
                    <Input id="base_price_per_night" name="base_price_per_night" type="number" value={pricing.base_price_per_night ?? ''} onChange={handleInputChange} className="h-11 text-base" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price_per_guest" className="font-semibold">Precio por Huésped Adulto Adicional ($)</Label>
                    <Input id="price_per_guest" name="price_per_guest" type="number" value={pricing.price_per_guest ?? ''} onChange={handleInputChange} className="h-11 text-base"/>
                </div>
            </div>

            <div className="border p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Configuración de Niños</h3>
                <div className="grid md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="child_price" className="font-semibold">Precio por Niño ($)</Label>
                        <Input id="child_price" name="child_price" type="number" value={pricing.child_price ?? ''} onChange={handleInputChange} className="h-11 text-base"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="max_children_per_room" className="font-semibold">Máximo de Niños por Habitación</Label>
                        <Input id="max_children_per_room" name="max_children_per_room" type="number" value={pricing.max_children_per_room ?? ''} onChange={handleInputChange} className="h-11 text-base"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="max_child_age" className="font-semibold">Edad Máxima del Niño (años)</Label>
                        <Input id="max_child_age" name="max_child_age" type="number" value={pricing.max_child_age ?? ''} onChange={handleInputChange} className="h-11 text-base"/>
                    </div>
                </div>
            </div>

            <div className='border p-6 rounded-lg'>
                <h3 className="text-xl font-bold mb-4">Tipos de Habitación</h3>
                <div className="space-y-4">
                    {pricing.room_types && Object.entries(pricing.room_types).map(([id, room]) => (
                        <div key={id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-4 items-center bg-gray-50 p-3 rounded-md">
                           <p className="font-mono text-sm text-gray-500 truncate">ID: {id}</p>
                           <Input value={room.name || ''} onChange={(e) => handleJsonChange('room_types', id, 'name', e.target.value)} placeholder="Nombre" />
                           <Input type="number" step="0.1" value={room.price_multiplier ?? ''} onChange={(e) => handleJsonChange('room_types', id, 'price_multiplier', e.target.value)} placeholder="Multiplicador" />
                        </div>
                    ))}
                    {(!pricing.room_types || Object.keys(pricing.room_types).length === 0) && (
                        <p className="text-gray-500 italic">No hay tipos de habitación configurados. Agrega habitaciones en la sección de gestión de hoteles.</p>
                    )}
                </div>
            </div>

            <div className='border p-6 rounded-lg'>
                <h3 className="text-xl font-bold mb-4">Excursiones (Precios Base)</h3>
                <div className="space-y-4">
                    {pricing.excursions && Object.entries(pricing.excursions).map(([id, excursion]) => (
                         <div key={id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-4 items-center bg-gray-50 p-3 rounded-md">
                            <p className="font-mono text-sm text-gray-500 truncate">ID: {id}</p>
                            <Input value={excursion.name || ''} onChange={(e) => handleJsonChange('excursions', id, 'name', e.target.value)} placeholder="Nombre" />
                            <Input type="number" value={excursion.price ?? ''} onChange={(e) => handleJsonChange('excursions', id, 'price', e.target.value)} placeholder="Precio ($)" />
                        </div>
                    ))}
                     {(!pricing.excursions || Object.keys(pricing.excursions).length === 0) && (
                        <p className="text-gray-500 italic">No hay excursiones configuradas.</p>
                    )}
                </div>
            </div>

            <div className="text-right mt-8">
                <Button onClick={handleSaveChanges} disabled={saving} size="lg">
                    {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    Guardar Cambios
                </Button>
            </div>
        </div>
    );
};

export default AdminPricingPanel;