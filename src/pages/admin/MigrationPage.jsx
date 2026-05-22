import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { hotelService } from '@/services/hotelService';
import { getAllHotels } from '@/lib/hotelData'; // Local data source
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Database, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * PAGE: /admin/migration
 * POBLADO RELACIONAL MASIVO
 * Allows admin to trigger script-like logic from the frontend to populate DB.
 */
const MigrationPage = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const { toast } = useToast();

  const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const runMigration = async () => {
    if (!window.confirm("¿Estás seguro de ejecutar la MIGRACIÓN MASIVA? Esto insertará datos en la base de datos.")) return;
    
    setLoading(true);
    setLogs([]);
    addLog("🚀 Iniciando migración masiva...");

    try {
        // 1. Get all local hotels
        const localHotels = getAllHotels();
        addLog(`📂 Encontrados ${localHotels.length} hoteles locales.`);

        for (const localHotel of localHotels) {
            addLog(`-----------------------------------`);
            addLog(`🔹 Procesando: ${localHotel.name} (${localHotel.slug})`);

            // 2. Find or Create Hotel in DB
            let { data: dbHotel, error } = await supabase
                .from('hotels')
                .select('id')
                .eq('slug', localHotel.slug)
                .maybeSingle();

            if (!dbHotel) {
                addLog(`⚠️ Hotel no existe en DB. Creando...`);
                const { data: newHotel, error: createError } = await supabase
                    .from('hotels')
                    .insert([{
                        slug: localHotel.slug,
                        name: localHotel.name,
                        location: localHotel.destinationName,
                        destination: localHotel.destinationSlug,
                        description: localHotel.description,
                        image_url: localHotel.image,
                        stars: localHotel.rating || 4,
                        is_active: true
                    }])
                    .select()
                    .single();
                
                if (createError) {
                    addLog(`❌ Error creando hotel: ${createError.message}`);
                    continue;
                }
                dbHotel = newHotel;
                addLog(`✅ Hotel creado con ID: ${dbHotel.id}`);
            } else {
                addLog(`ℹ️ Hotel ya existe (ID: ${dbHotel.id}).`);
            }

            // 3. Populate Rooms (Relational)
            // If local data has 'rooms' (some do in our mock data structure, mostly we synthesize)
            // Since local data in `hotelData.js` is minimal, we might need to synthesize default rooms if none exist
            const roomsToInsert = [
                {
                    name: "Estándar Deluxe",
                    description: "Habitación confortable con vistas al jardín.",
                    capacity: 2,
                    image_url: localHotel.image
                },
                {
                    name: "Junior Suite",
                    description: "Espaciosa suite con área de estar.",
                    capacity: 4,
                    image_url: localHotel.image
                }
            ];

            addLog(`🛏️ Verificando habitaciones...`);
            const { count } = await supabase
                .from('rooms')
                .select('*', { count: 'exact', head: true })
                .eq('hotel_id', dbHotel.id);

            if (count === 0) {
                addLog(`✨ Insertando ${roomsToInsert.length} habitaciones por defecto...`);
                for (const room of roomsToInsert) {
                    await hotelService.saveRoomType({
                        hotel_id: dbHotel.id,
                        ...room
                    });
                }
                addLog(`✅ Habitaciones insertadas.`);
            } else {
                addLog(`⏭️ Hotel ya tiene ${count} habitaciones. Saltando inserción.`);
            }
            
            // 4. Trigger Sync (JSONB update)
            addLog(`🔄 Ejecutando syncRoomsToJSONB...`);
            await hotelService.syncRoomsToJSONB(dbHotel.id);
            addLog(`✅ Sync completado.`);
        }

        addLog(`🏁 Migración finalizada.`);
        toast({ title: "Migración Completada", className: "bg-green-600 text-white" });

    } catch (e) {
        console.error(e);
        addLog(`❌ ERROR CRÍTICO: ${e.message}`);
        toast({ title: "Error en Migración", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Card className="border-l-4 border-l-blue-600">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                    <Database className="w-6 h-6 text-blue-600"/> Poblado Relacional Masivo
                </CardTitle>
                <CardDescription>
                    Herramienta administrativa para sincronizar datos locales hacia la base de datos Supabase.
                    <br/>
                    <strong>Acciones:</strong> Crea hoteles faltantes, genera habitaciones por defecto, y sincroniza JSONB.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4">
                    <Button onClick={runMigration} disabled={loading} size="lg" className="bg-slate-900 text-white hover:bg-slate-800">
                        {loading ? <Loader2 className="animate-spin mr-2"/> : <ArrowRight className="mr-2"/>}
                        Ejecutar Migración
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card className="bg-slate-950 text-green-400 font-mono text-xs overflow-hidden">
            <CardHeader className="border-b border-slate-800 py-3">
                <CardTitle className="text-sm">Consola de Ejecución</CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-[400px] overflow-y-auto">
                {logs.length === 0 ? (
                    <span className="text-slate-600">// Esperando comando...</span>
                ) : (
                    logs.map((log, i) => <div key={i}>{log}</div>)
                )}
            </CardContent>
        </Card>
    </div>
  );
};

export default MigrationPage;