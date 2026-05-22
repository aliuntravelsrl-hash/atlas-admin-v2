
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, FileJson, XCircle } from 'lucide-react';
import { validateHotelSchema } from '@/utils/validateHotelSchema';
import { auditHotelSchema } from '@/utils/auditHotelSchema';

const AdminAuditPage = () => {
    const [auditResults, setAuditResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, healthy: 0, warnings: 0, critical: 0 });

    const runAudit = async () => {
        setLoading(true);
        try {
            // 1. Fetch via Service to get clean objects
            const { data: hotels, error } = await supabase.from('hotels_master').select('*');
            if (error) throw error;

            const results = hotels.map(hotel => {
                // Parse JSONB if string (defensive)
                ['gallery_data', 'rooms_data', 'services_data'].forEach(k => {
                   if (typeof hotel[k] === 'string') {
                       try { hotel[k] = JSON.parse(hotel[k]); } catch(e) {}
                   } 
                });

                const validation = validateHotelSchema(hotel);
                return {
                    id: hotel.id,
                    name: hotel.name,
                    slug: hotel.slug,
                    ...validation
                };
            });

            setAuditResults(results);

            // Calculate stats
            setStats({
                total: results.length,
                healthy: results.filter(r => r.score === 100).length,
                warnings: results.filter(r => r.score < 100 && r.score > 70).length,
                critical: results.filter(r => r.score <= 70).length
            });
            
            // Also run console auditor
            auditHotelSchema();

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        runAudit();
    }, []);

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">Auditoría de Datos (Supabase First)</h1>
                <Button onClick={runAudit} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Ejecutar Auditoría
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Hoteles</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-600">Saludables</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-700">{stats.healthy}</div></CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-yellow-600">Advertencias</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-yellow-700">{stats.warnings}</div></CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-600">Críticos</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-700">{stats.critical}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Resultados Detallados</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3">Hotel</th>
                                    <th className="text-left p-3">Puntuación</th>
                                    <th className="text-left p-3">Estado</th>
                                    <th className="text-left p-3">Detalles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditResults.map(res => (
                                    <tr key={res.id} className="border-b hover:bg-slate-50">
                                        <td className="p-3 font-medium">{res.name}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                res.score === 100 ? 'bg-green-100 text-green-800' :
                                                res.score > 70 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {res.score}%
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {res.valid ? 
                                                <span className="flex items-center text-green-600"><CheckCircle className="w-4 h-4 mr-1"/> Válido</span> :
                                                <span className="flex items-center text-red-600"><XCircle className="w-4 h-4 mr-1"/> Errores</span>
                                            }
                                        </td>
                                        <td className="p-3 max-w-md">
                                            {res.errors.length > 0 && (
                                                <div className="text-red-600 text-xs mb-1">
                                                    <strong>Errores:</strong> {res.errors.join(', ')}
                                                </div>
                                            )}
                                            {res.warnings.length > 0 && (
                                                <div className="text-yellow-600 text-xs">
                                                    <strong>Alertas:</strong> {res.warnings.slice(0, 3).join(', ')}{res.warnings.length > 3 ? '...' : ''}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminAuditPage;
