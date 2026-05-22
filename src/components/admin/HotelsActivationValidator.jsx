
import React, { useState, useEffect } from 'react';
import { hotelService } from '@/services/hotelService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Eye, Database } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const HotelsActivationValidator = () => {
    const [stats, setStats] = useState({ total: 0, published: 0, hidden: 0, missingData: 0 });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchStats = async () => {
        setLoading(true);
        try {
            const hotels = await hotelService.getHotelsForAdmin();
            const total = hotels.length;
            const published = hotels.filter(h => h.publish).length;
            const hidden = total - published;
            const missingData = hotels.filter(h => !h.location || !h.stars).length;
            
            setStats({ total, published, hidden, missingData });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const runActivationScript = async () => {
        setLoading(true);
        try {
            // We simulate the script execution via client-side updates as we can't run raw SQL from client easily without edge function
            // But we can iterate and update.
            const { data: hotels } = await supabase.from('hotels_master').select('id, publish');
            
            const updates = hotels.map(h => {
                if (!h.publish) {
                    return supabase.from('hotels_master').update({ publish: true }).eq('id', h.id);
                }
                return null;
            }).filter(Boolean);

            await Promise.all(updates);
            
            toast({ title: "Activation Complete", description: "All hotels marked as published." });
            fetchStats();
        } catch (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const percentage = stats.total > 0 ? (stats.published / stats.total) * 100 : 0;

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600"/>
                    Estado de Activación de Hoteles
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Progreso de Publicación</span>
                        <span className="font-bold">{Math.round(percentage)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex flex-col items-center">
                            <span className="text-2xl font-bold text-green-700">{stats.published}</span>
                            <span className="text-xs text-green-600 flex items-center gap-1">
                                <Eye className="w-3 h-3"/> Publicados
                            </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col items-center">
                            <span className="text-2xl font-bold text-slate-700">{stats.hidden}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <XCircle className="w-3 h-3"/> Ocultos
                            </span>
                        </div>
                    </div>

                    {stats.missingData > 0 && (
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-yellow-800 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4"/>
                            {stats.missingData} hoteles les falta ubicación o estrellas.
                        </div>
                    )}

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} className="w-full">
                            <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`}/> Actualizar
                        </Button>
                        <Button size="sm" onClick={runActivationScript} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                            Activar Todos (114)
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default HotelsActivationValidator;
