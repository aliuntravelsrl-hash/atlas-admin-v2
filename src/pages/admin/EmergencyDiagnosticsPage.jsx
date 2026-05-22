
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const EmergencyDiagnosticsPage = () => {
    const [status, setStatus] = useState({
        connection: 'checking',
        hotelsTable: null,
        hotelsMasterTable: null,
        occidentalCheck: null
    });
    const [loading, setLoading] = useState(false);

    const runDiagnostics = async () => {
        setLoading(true);
        const report = {
            connection: 'checking',
            hotelsTable: { count: 0, sample: null, error: null },
            hotelsMasterTable: { count: 0, sample: null, error: null },
            occidentalCheck: { found: false, data: null }
        };

        try {
            // 1. Check Legacy Table 'hotels'
            const { count: hCount, data: hData, error: hError } = await supabase
                .from('hotels')
                .select('*', { count: 'exact' })
                .limit(1);
            
            report.hotelsTable = {
                count: hCount || 0,
                sample: hData?.[0],
                error: hError?.message
            };

            // 2. Check Master Table 'hotels_master'
            const { count: hmCount, data: hmData, error: hmError } = await supabase
                .from('hotels_master')
                .select('*', { count: 'exact' })
                .limit(1);

            report.hotelsMasterTable = {
                count: hmCount || 0,
                sample: hmData?.[0],
                error: hmError?.message
            };

            // 3. Check Specific Hotel (Occidental Punta Cana) in Master
            const { data: occData } = await supabase
                .from('hotels_master')
                .select('id, name, slug, rooms_data, services_data')
                .eq('slug', 'occidental-punta-cana')
                .maybeSingle();

            report.occidentalCheck = {
                found: !!occData,
                data: occData,
                hasRooms: occData?.rooms_data && Array.isArray(occData.rooms_data) && occData.rooms_data.length > 0
            };

            report.connection = (!hError && !hmError) ? 'healthy' : 'degraded';

        } catch (e) {
            console.error(e);
            report.connection = 'failed';
        } finally {
            setStatus(report);
            setLoading(false);
        }
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Activity className="text-blue-600" />
                    Diagnóstico de Conexión Productiva
                </h1>
                <Button onClick={runDiagnostics} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Ejecutar Diagnóstico
                </Button>
            </div>

            {/* Connection Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Estado de Conexión Supabase</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className={`text-lg font-bold flex items-center gap-2 ${
                            status.connection === 'healthy' ? 'text-green-600' : 
                            status.connection === 'failed' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                            {status.connection === 'healthy' && <CheckCircle />}
                            {status.connection === 'failed' && <XCircle />}
                            {status.connection === 'checking' && <RefreshCw className="animate-spin" />}
                            {status.connection.toUpperCase()}
                        </div>
                        <p className="text-gray-500 text-sm">
                            Conectado a proyecto: {import.meta.env.VITE_SUPABASE_URL || 'No definido'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tabla HOTELS (Legacy) */}
                <Card className="border-l-4 border-l-gray-400">
                    <CardHeader>
                        <CardTitle className="flex justify-between">
                            Tabla 'hotels' (Legacy)
                            <Badge variant="outline">Count: {status.hotelsTable?.count}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {status.hotelsTable?.error ? (
                            <div className="text-red-500 text-sm">Error: {status.hotelsTable.error}</div>
                        ) : (
                            <div className="bg-slate-100 p-3 rounded text-xs font-mono overflow-auto max-h-40">
                                {status.hotelsTable?.sample ? 
                                    JSON.stringify(status.hotelsTable.sample, null, 2) : 
                                    "Tabla vacía"}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tabla HOTELS_MASTER (Target) */}
                <Card className="border-l-4 border-l-blue-600">
                    <CardHeader>
                        <CardTitle className="flex justify-between text-blue-800">
                            Tabla 'hotels_master' (Active)
                            <Badge className="bg-blue-600">Count: {status.hotelsMasterTable?.count}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                         {status.hotelsMasterTable?.error ? (
                            <div className="text-red-500 text-sm">Error: {status.hotelsMasterTable.error}</div>
                        ) : (
                            <div className="bg-blue-50 p-3 rounded text-xs font-mono overflow-auto max-h-40">
                                {status.hotelsMasterTable?.sample ? 
                                    JSON.stringify(status.hotelsMasterTable.sample, null, 2) : 
                                    "Tabla vacía"}
                            </div>
                        )}
                        <p className="text-xs text-blue-600 font-medium mt-2">
                            * Esta es la tabla que usa el Admin Panel actual.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Occidental Validation */}
            <Card className={status.occidentalCheck?.found ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                <CardHeader>
                    <CardTitle className="text-lg">Verificación Específica: Occidental Punta Cana</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="font-bold block text-sm">Encontrado en hotels_master:</span>
                            {status.occidentalCheck?.found ? 
                                <span className="text-green-700 flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> SI</span> : 
                                <span className="text-red-700 flex items-center"><XCircle className="w-4 h-4 mr-1"/> NO</span>
                            }
                        </div>
                        <div>
                            <span className="font-bold block text-sm">Datos de Habitaciones:</span>
                            {status.occidentalCheck?.hasRooms ? 
                                <span className="text-green-700 flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Presentes ({status.occidentalCheck.data.rooms_data.length})</span> : 
                                <span className="text-red-700 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> Vacíos o Inválidos</span>
                            }
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EmergencyDiagnosticsPage;
