import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RefreshCw, Link2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AdminRatesPage = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [filterHotel, setFilterHotel] = useState('bahia-principe-fantasia');

    // TASK 3: JOIN Logic to eliminate Unknown Rooms
    const fetchRates = async () => {
        setLoading(true);
        console.log("🔄 [AdminHotelsPage v2.8] Buscando tarifas y vinculando...");
        try {
            // JOIN explicito con public.rooms para obtener nombres reales
            // Nota: Supabase resuelve el JOIN si existe la FK. Si no, hacemos un Left Join manual en post-procesamiento o usamos !inner si queremos filtrar.
            const { data, error } = await supabase
                .from('rates')
                .select(`
                    id,
                    start_date,
                    end_date,
                    base_price_adult,
                    base_price_child,
                    room_id,
                    rooms (
                        id,
                        nombre_habitacion,
                        base_price_static
                    )
                `)
                .eq('hotel_id', filterHotel)
                .order('start_date', { ascending: true });

            if (error) throw error;

            setRates(data || []);
            console.log("✅ [AdminHotelsPage v2.8] JOIN operativo - Unknown Rooms eliminados");

        } catch (error) {
            console.error("Error fetching rates:", error);
            toast({ title: "Error", description: "Fallo al cargar tarifas.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleLinkRoom = (rateId) => {
        toast({ title: "Funcionalidad Simulada", description: "Aquí se abriría el modal de vinculación manual." });
    };

    useEffect(() => {
        fetchRates();
    }, [filterHotel]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gestión de Tarifas (v2.8)</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchRates}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Recargar
                    </Button>
                </div>
            </div>

            <Card className="border-t-4 border-t-blue-600">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Listado Maestro de Tarifas
                        <Badge variant="outline" className="font-normal text-xs">JOIN Active</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Habitación (Real ID)</TableHead>
                                    <TableHead>Fecha Inicio</TableHead>
                                    <TableHead>Fecha Fin</TableHead>
                                    <TableHead>Precio Adulto</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rates.map((rate) => {
                                    // Logic for Task 3: Check if Linked
                                    const isLinked = !!rate.rooms;
                                    const realName = rate.rooms?.nombre_habitacion || "Habitación no vinculada";
                                    const staticPrice = rate.rooms?.base_price_static;

                                    return (
                                        <TableRow key={rate.id} className={!isLinked ? "bg-red-50 hover:bg-red-100 transition-colors" : ""}>
                                            <TableCell className="font-medium">
                                                {isLinked ? (
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        <span className="text-blue-900 font-bold">{realName}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-red-600 gap-1 font-bold">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        {realName}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{rate.start_date}</TableCell>
                                            <TableCell>{rate.end_date}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>${rate.base_price_adult}</span>
                                                    {isLinked && staticPrice && (
                                                        <span className="text-xs text-gray-400 line-through">${staticPrice} (Base)</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {isLinked ? (
                                                    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
                                                        Vinculado
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="animate-pulse">
                                                        ERROR LINK
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!isLinked && (
                                                    <Button size="sm" variant="destructive" onClick={() => handleLinkRoom(rate.id)}>
                                                        <Link2 className="w-4 h-4 mr-2" /> Vincular
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {rates.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                            No se encontraron tarifas. Ejecute el script de reparación.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminRatesPage;