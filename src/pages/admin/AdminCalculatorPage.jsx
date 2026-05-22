import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Save, AlertTriangle, DollarSign, BedDouble, Baby, Car, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const HOTEL_SLUG = 'bahia-principe-fantasia-punta-cana';

const AdminCalculatorPage = () => {
    const [pricingData, setPricingData] = useState(null);
    const [transportOptions, setTransportOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [pricingRes, transportRes] = await Promise.all([
            supabase.from('hotel_pricing').select('*').eq('hotel_id', HOTEL_SLUG).single(),
            supabase.from('transport_options').select('*').eq('hotel_slug', HOTEL_SLUG).order('price_per_vehicle', { ascending: true })
        ]);

        if (pricingRes.error || !pricingRes.data) {
            toast({ title: "Error", description: `No se pudieron cargar los precios para ${HOTEL_SLUG}.`, variant: "destructive" });
        } else {
            setPricingData(pricingRes.data);
        }

        if (transportRes.error) {
            toast({ title: "Error", description: "No se pudieron cargar las opciones de transporte.", variant: "destructive" });
        } else {
            setTransportOptions(transportRes.data);
        }

        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStateChange = (setter, name, value) => {
        // Allow empty string for clearing input, otherwise parse as number for numeric fields
        const isNumericField = name.includes('price') || name.includes('age') || name.includes('guest') || name.includes('children') || name.includes('multiplier') || name.includes('price_per_vehicle');
        
        if (isNumericField) {
            if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                setter(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setter(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePricingChange = (e) => {
        handleStateChange(setPricingData, e.target.name, e.target.value);
    };
    
    const handleRoomChange = (id, field, value) => {
        setPricingData(prev => {
            const newRoomTypes = { ...prev.room_types };
            const currentRoom = { ...newRoomTypes[id] };
            
            const isNumericField = field.includes('multiplier');
            if (isNumericField) {
                 if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                    currentRoom[field] = value;
                 }
            } else {
                currentRoom[field] = value;
            }

            newRoomTypes[id] = currentRoom;
            return { ...prev, room_types: newRoomTypes };
        });
    };

    const handleTransportChange = (id, field, value) => {
        setTransportOptions(prev => prev.map(opt => {
            if (opt.id !== id) return opt;
            
            const newOpt = { ...opt };
            const isNumericField = field.includes('price');
            if (isNumericField) {
                if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                    newOpt[field] = value;
                }
            } else {
                newOpt[field] = value;
            }
            return newOpt;
        }));
    };

    const handleSave = async () => {
        setSaving(true);

        // --- Validation ---
        const numericFields = [
            'base_price_per_night', 'price_per_guest', 'child_price', 
            'max_children_per_room', 'max_child_age', 
            'service_1_price', 'service_2_price', 'service_3_price'
        ];

        for (const field of numericFields) {
            if (pricingData[field] === '' || pricingData[field] === null || isNaN(parseFloat(pricingData[field]))) {
                toast({ title: "Error de Validación", description: `El campo '${field}' no puede estar vacío y debe ser un número.`, variant: "destructive" });
                setSaving(false);
                return;
            }
        }
        // --- End Validation ---

        const { error: pricingError } = await supabase
            .from('hotel_pricing')
            .update({
                base_price_per_night: parseFloat(pricingData.base_price_per_night),
                price_per_guest: parseFloat(pricingData.price_per_guest),
                child_price: parseFloat(pricingData.child_price),
                max_children_per_room: parseInt(pricingData.max_children_per_room, 10),
                max_child_age: parseInt(pricingData.max_child_age, 10),
                room_types: Object.fromEntries(Object.entries(pricingData.room_types).map(([k,v]) => [k, {...v, price_multiplier: parseFloat(v.price_multiplier)}])),
                service_1_name: pricingData.service_1_name,
                service_1_price: parseFloat(pricingData.service_1_price),
                service_2_name: pricingData.service_2_name,
                service_2_price: parseFloat(pricingData.service_2_price),
                service_3_name: pricingData.service_3_name,
                service_3_price: parseFloat(pricingData.service_3_price),
            })
            .eq('hotel_id', HOTEL_SLUG);
        
        const transportPromises = transportOptions.map(opt => 
            supabase.from('transport_options').update({
                name: opt.name,
                price_per_vehicle: parseFloat(opt.price_per_vehicle),
            }).eq('id', opt.id)
        );
        
        const transportResults = await Promise.all(transportPromises);
        const transportError = transportResults.some(res => res.error);

        setSaving(false);

        if (pricingError || transportError) {
            toast({ title: "Error al Guardar", description: `Ocurrió un error: ${pricingError?.message || 'Error en transporte'}`, variant: "destructive" });
        } else {
            toast({ title: "¡Éxito!", description: "Los datos de la calculadora han sido actualizados." });
            fetchData();
        }
    };


    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="w-16 h-16 animate-spin text-blue-600" /></div>;
    }

    if (!pricingData) {
        return <div className="text-center p-8 bg-red-50 rounded-lg"><AlertTriangle className="mx-auto w-12 h-12 text-red-500" /><p className="mt-4 text-xl text-red-700 font-semibold">No se encontraron datos para el hotel especificado.</p></div>;
    }

    return (
        <>
            <Helmet>
                <title>Admin | Calculadora de Precios</title>
            </Helmet>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto px-4 py-8 space-y-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Calculadora de Precios</h1>
                        <p className="mt-2 text-lg text-gray-600">Editor de valores para: <span className="font-bold">{pricingData.hotel_name}</span></p>
                    </div>
                     <Button onClick={handleSave} disabled={saving} size="lg">
                        {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                        Guardar Todo
                    </Button>
                </div>

                {/* --- SECCIONES DE EDICIÓN --- */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign /> Precios Base</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="base_price_per_night">Precio Base por Noche ($)</Label>
                            <Input id="base_price_per_night" name="base_price_per_night" type="number" value={pricingData.base_price_per_night} onChange={handlePricingChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price_per_guest">Precio por Huésped Adulto Adicional ($)</Label>
                            <Input id="price_per_guest" name="price_per_guest" type="number" value={pricingData.price_per_guest} onChange={handlePricingChange} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Baby /> Política de Niños</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="child_price">Precio por Niño ($)</Label>
                            <Input id="child_price" name="child_price" type="number" value={pricingData.child_price} onChange={handlePricingChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max_children_per_room">Máx. Niños por Habitación</Label>
                            <Input id="max_children_per_room" name="max_children_per_room" type="number" value={pricingData.max_children_per_room} onChange={handlePricingChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max_child_age">Edad Máxima de Niño</Label>
                            <Input id="max_child_age" name="max_child_age" type="number" value={pricingData.max_child_age} onChange={handlePricingChange} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><BedDouble /> Tipos de Habitación</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {pricingData.room_types && Object.entries(pricingData.room_types).map(([id, room]) => (
                            <div key={id} className="grid grid-cols-[2fr_1fr] md:grid-cols-[1fr_2fr_1fr] gap-4 p-3 bg-slate-50 rounded-lg items-center">
                                <Input value={room.name} onChange={(e) => handleRoomChange(id, 'name', e.target.value)} placeholder="Nombre de Habitación" />
                                <Input value={room.description} onChange={(e) => handleRoomChange(id, 'description', e.target.value)} placeholder="Descripción corta" />
                                <div>
                                    <Label className="text-xs">Multiplicador</Label>
                                    <Input type="number" step="0.1" value={room.price_multiplier} onChange={(e) => handleRoomChange(id, 'price_multiplier', e.target.value)} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Car /> Opciones de Transporte</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {transportOptions.map(opt => (
                            <div key={opt.id} className="grid grid-cols-[2fr_1fr] gap-4 p-3 bg-slate-50 rounded-lg items-center">
                                <Input value={opt.name} onChange={e => handleTransportChange(opt.id, 'name', e.target.value)} placeholder="Nombre del transporte" />
                                <div>
                                    <Label className="text-xs">Precio ($)</Label>
                                    <Input type="number" value={opt.price_per_vehicle} onChange={e => handleTransportChange(opt.id, 'price_per_vehicle', e.target.value)} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Settings /> Servicios Adicionales</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="grid grid-cols-[2fr_1fr] gap-4 p-3 bg-slate-50 rounded-lg items-center">
                                <Input name={`service_${i}_name`} value={pricingData[`service_${i}_name`] || ''} onChange={handlePricingChange} placeholder={`Nombre Servicio ${i}`} />
                                <div>
                                    <Label className="text-xs">Precio ($)</Label>
                                    <Input name={`service_${i}_price`} type="number" value={pricingData[`service_${i}_price`] || ''} onChange={handlePricingChange} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                 <CardFooter className="flex justify-end">
                     <Button onClick={handleSave} disabled={saving} size="lg">
                        {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                        Guardar Todo
                    </Button>
                </CardFooter>

            </motion.div>
        </>
    );
};

export default AdminCalculatorPage;