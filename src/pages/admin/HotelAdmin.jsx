import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // CORRECCIÓN PREGUNTA 1
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, AlertTriangle, Utensils, Sparkles, ShieldCheck, Loader2, Plus, Trash2, Edit, Save, Video } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import GastronomiaCard from '@/components/GastronomiaCard';
import ServiciosCard from '@/components/ServiciosCard';
import HeroVideo from '@/components/HeroVideo';

const HotelAdmin = () => {
    // CORRECCIÓN PREGUNTA 1: Obtener slug de URL si existe, fallback a default
    const { hotelSlug: paramSlug } = useParams();
    const [hotelSlug, setHotelSlug] = useState(paramSlug || 'bahia-principe-fantasia'); 
    
    const [metadata, setMetadata] = useState({ gastronomia: [], servicios: [], video_aliun: '' });
    const [sqlStats, setSqlStats] = useState({ rooms: 0, rates: 0 });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Editor States
    const [editingCategory, setEditingCategory] = useState(null); 
    const [editItem, setEditItem] = useState(null); 
    const [editIndex, setEditIndex] = useState(-1);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // AUDITORÍA PREGUNTA 4: Log de slug al inicio
    useEffect(() => {
        console.log('🔍 [Auditoría v2.9] P4 - currentHotelSlug:', hotelSlug);
        console.log('🔍 [Auditoría v2.9] P4 - currentHotelSlug type:', typeof hotelSlug);
        console.log('🔍 [Auditoría v2.9] P4 - currentHotelSlug is undefined:', hotelSlug === undefined);
    }, [hotelSlug]);

    const fetchCompleteStatus = async () => {
        setLoading(true);
        console.log(`🔄 [HotelAdmin v2.9] Cargando panel para ${hotelSlug}...`);
        
        try {
            // CORRECCIÓN PREGUNTA 2: Fetch robusto
            const { data: kbResult, error: kbError } = await supabase
                .from('knowledge_base')
                .select('*')
                .eq('metadata->>hotel_id', hotelSlug)
                .single();

            if (kbError && kbError.code !== 'PGRST116') throw kbError;

            // AUDITORÍA PREGUNTA 3: Logs de inspección de metadata
            const fetchedMeta = kbResult?.metadata;
            console.log('🔍 [Auditoría v2.9] P3 - metadata value:', fetchedMeta);
            console.log('🔍 [Auditoría v2.9] P3 - metadata type:', typeof fetchedMeta);
            console.log('🔍 [Auditoría v2.9] P3 - metadata keys:', Object.keys(fetchedMeta || {}));

            if (fetchedMeta) {
                setMetadata({
                    gastronomia: fetchedMeta.gastronomia || [],
                    servicios: fetchedMeta.servicios || [],
                    video_aliun: fetchedMeta.video_aliun || ''
                });
            }

            // Fetch SQL Stats
            const { count: roomsCount } = await supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelSlug);
            const { count: ratesCount } = await supabase.from('rates').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelSlug).not('room_id', 'is', null);

            setSqlStats({ rooms: roomsCount || 0, rates: ratesCount || 0 });
            console.log("✅ [HotelAdmin v2.9] Fetch operativo - Datos sincronizados");

        } catch (error) {
            // CORRECCIÓN PREGUNTA 10: Error handler explícito
            console.error("❌ [Auditoría v2.9] P10 - Error fetching admin data:", error);
            toast({ title: "Error de Carga", description: "Revise la consola para detalles de auditoría.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompleteStatus();

        // CORRECCIÓN PREGUNTA 5: Realtime Listener verificado
        console.log("🔍 [Auditoría v2.9] P5 - Inicializando Realtime Listener...");
        const subscription = supabase
            .channel('admin-kb-sync-v2.9')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_base' }, (payload) => {
                 if (payload.new?.metadata?.hotel_id === hotelSlug) {
                     console.log("🔄 [Auditoría v2.9] Realtime Update Recibido:", payload.new.metadata);
                     setMetadata({
                        gastronomia: payload.new.metadata.gastronomia || [],
                        servicios: payload.new.metadata.servicios || [],
                        video_aliun: payload.new.metadata.video_aliun || ''
                     });
                     toast({ title: "Sincronizado", description: "Cambios recibidos desde KB." });
                 }
            })
            .subscribe((status) => {
                console.log(`🔍 [Auditoría v2.9] P5 - Realtime Status: ${status}`);
            });

        return () => { supabase.removeChannel(subscription); };
    }, [hotelSlug]);

    const handleSaveMetadata = async (newMetadata) => {
        try {
            const { error } = await supabase
                .from('knowledge_base')
                .update({ 
                    metadata: { 
                        hotel_id: hotelSlug,
                        ...newMetadata 
                    },
                    updated_at: new Date()
                })
                .eq('metadata->>hotel_id', hotelSlug);

            if (error) throw error;
            
            setMetadata(newMetadata);
            toast({ title: "Guardado", description: "Metadata actualizada en Knowledge Base.", className: "bg-green-50 border-green-200" });
            setIsDialogOpen(false);
        } catch (err) {
            console.error("❌ Error saving metadata:", err);
            toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
        }
    };

    const openEditModal = (category, item = {}, index = -1) => {
        setEditingCategory(category);
        setEditItem(item);
        setEditIndex(index);
        setIsDialogOpen(true);
    };

    const handleModalSave = () => {
        const list = [...metadata[editingCategory]];
        if (editIndex >= 0) {
            list[editIndex] = editItem;
        } else {
            list.push(editItem);
        }
        handleSaveMetadata({ ...metadata, [editingCategory]: list });
    };

    const handleDelete = (category, index) => {
        const list = [...metadata[category]];
        list.splice(index, 1);
        handleSaveMetadata({ ...metadata, [category]: list });
    };

    const handleVideoSave = () => {
        handleSaveMetadata({ ...metadata });
    }

    const isUnlocked = metadata.gastronomia.length > 0 && metadata.servicios.length > 0 && sqlStats.rooms > 0;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-blue-600" />
                        Panel de Aldo - {hotelSlug}
                    </h1>
                    <p className="text-slate-500">Gestión Unificada v2.9 (Auditada & Corregida)</p>
                </div>
                <div className="flex gap-2">
                     <Button onClick={fetchCompleteStatus} size="sm" variant="outline"><Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sincronizar</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={isUnlocked ? "bg-green-50 border-green-200" : "bg-amber-50"}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium uppercase text-slate-500">Estado General</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            {isUnlocked ? <CheckCircle2 className="text-green-600" /> : <AlertTriangle className="text-amber-600" />}
                            <span className="font-bold text-lg">{isUnlocked ? "✅ Completamente Desbloqueado" : "⚠️ Configuración Incompleta"}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium uppercase text-slate-500">Tarifas (SQL)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sqlStats.rates} <span className="text-sm font-normal text-slate-500">tarifas activas</span></div>
                        <div className="text-xs text-green-600 mt-1">Nombres reales visibles</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium uppercase text-slate-500">Contenido (KB)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div><span className="font-bold">{metadata.gastronomia.length}</span> rests.</div>
                            <div><span className="font-bold">{metadata.servicios.length}</span> servs.</div>
                        </div>
                         <div className="text-xs text-blue-600 mt-1">Editable en tiempo real</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="gastronomia" className="w-full">
                <TabsList className="w-full justify-start bg-white p-1 border rounded-lg h-auto">
                    <TabsTrigger value="gastronomia" className="gap-2 py-2"><Utensils className="w-4 h-4" /> Gastronomía</TabsTrigger>
                    <TabsTrigger value="servicios" className="gap-2 py-2"><Sparkles className="w-4 h-4" /> Servicios</TabsTrigger>
                    <TabsTrigger value="video" className="gap-2 py-2"><Video className="w-4 h-4" /> Hero Video</TabsTrigger>
                </TabsList>

                <TabsContent value="gastronomia" className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">Restaurantes & Bares</h3>
                        <Button onClick={() => openEditModal('gastronomia', { nombre: '', tipo: '', descripcion: '', imagen: '' })}>
                            <Plus className="w-4 h-4 mr-2" /> Agregar Restaurante
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {metadata.gastronomia.map((rest, idx) => (
                            <div key={idx} className="relative group">
                                <GastronomiaCard {...rest} />
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openEditModal('gastronomia', rest, idx)}><Edit className="w-4 h-4" /></Button>
                                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete('gastronomia', idx)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        ))}
                         {metadata.gastronomia.length === 0 && <div className="col-span-3 text-center py-10 text-slate-400 border-2 border-dashed rounded-xl">No hay restaurantes. Agrega uno.</div>}
                    </div>
                </TabsContent>

                <TabsContent value="servicios" className="mt-6 space-y-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">Servicios e Instalaciones</h3>
                        <Button onClick={() => openEditModal('servicios', { nombre: '', tipo: '', descripcion: '', icono: 'default' })}>
                            <Plus className="w-4 h-4 mr-2" /> Agregar Servicio
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {metadata.servicios.map((srv, idx) => (
                             <div key={idx} className="relative group">
                                <ServiciosCard {...srv} />
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openEditModal('servicios', srv, idx)}><Edit className="w-4 h-4" /></Button>
                                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete('servicios', idx)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        ))}
                        {metadata.servicios.length === 0 && <div className="col-span-2 text-center py-10 text-slate-400 border-2 border-dashed rounded-xl">No hay servicios. Agrega uno.</div>}
                    </div>
                </TabsContent>

                <TabsContent value="video" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Video Principal (Hero)</CardTitle><CardDescription>Copia el ID de YouTube o la URL completa.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input 
                                    value={metadata.video_aliun} 
                                    onChange={(e) => setMetadata({...metadata, video_aliun: e.target.value})} 
                                    placeholder="Ej: dQw4w9WgXcQ o https://youtube.com/..." 
                                />
                                <Button onClick={handleVideoSave}><Save className="w-4 h-4 mr-2" /> Guardar Video</Button>
                            </div>
                            <div className="w-full max-w-2xl mx-auto">
                                <HeroVideo videoUrl={metadata.video_aliun} title="Vista Previa" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editIndex >= 0 ? 'Editar' : 'Agregar'} {editingCategory === 'gastronomia' ? 'Restaurante' : 'Servicio'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Nombre</label>
                            <Input value={editItem?.nombre || ''} onChange={(e) => setEditItem({...editItem, nombre: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Tipo / Categoría</label>
                            <Input value={editItem?.tipo || ''} onChange={(e) => setEditItem({...editItem, tipo: e.target.value})} />
                        </div>
                         <div className="grid gap-2">
                            <label className="text-sm font-medium">Descripción</label>
                            <Textarea value={editItem?.descripcion || ''} onChange={(e) => setEditItem({...editItem, descripcion: e.target.value})} />
                        </div>
                        {editingCategory === 'gastronomia' && (
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">URL Imagen (Opcional)</label>
                                <Input value={editItem?.imagen || ''} onChange={(e) => setEditItem({...editItem, imagen: e.target.value})} placeholder="https://..." />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleModalSave}>Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default HotelAdmin;