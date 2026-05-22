import React, { useState, useEffect } from 'react';
import { seasonService } from '@/services/seasonService'; // CORRECT IMPORT
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Plus, Calendar, RefreshCw, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';

const SeasonsManagement = ({ hotelId }) => {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [newSeason, setNewSeason] = useState({ name: '', start_date: '', end_date: '', description: '' });
  
  const { toast } = useToast();

  const fetchSeasons = async (isSilent = false) => {
    if (!hotelId) return;
    if (!isSilent) setLoading(true);
    try {
      const data = await seasonService.getSeasons(hotelId); // USING SERVICE
      setSeasons(data || []);
    } catch (e) {
      console.error(e);
      if (!isSilent) toast({ title: 'Error', description: 'No se pudieron cargar las temporadas.', variant: 'destructive' });
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
    
    const channel = supabase
      .channel(`seasons-monitor-${hotelId}`)
      .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'seasons', filter: `hotel_id=eq.${hotelId}` },
          (payload) => {
              console.log("⚡ Realtime Season Update:", payload.eventType);
              setIsRealtimeActive(true);
              fetchSeasons(true);
              setTimeout(() => setIsRealtimeActive(false), 2000);
          }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hotelId]);


  const handleAdd = async () => {
    if (!newSeason.name || !newSeason.start_date || !newSeason.end_date) {
      toast({ title: 'Faltan datos', description: 'Por favor completa nombre y fechas.', variant: 'destructive' });
      return;
    }
    
    if (newSeason.start_date > newSeason.end_date) {
        toast({ title: 'Error en fechas', description: 'La fecha de inicio debe ser anterior al fin.', variant: 'destructive' });
        return;
    }

    setSaving(true);
    try {
      await seasonService.saveSeason({ // USING SERVICE
          ...newSeason, 
          hotel_id: hotelId, 
          is_active: true 
      });
      setNewSeason({ name: '', start_date: '', end_date: '', description: '' });
      toast({ title: "Temporada Creada", className: "bg-green-600 text-white" });
      fetchSeasons(true); // Ensure refresh
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
        setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta temporada? Esto podría afectar reservas.')) return;
    try {
      await seasonService.deleteSeason(id); // USING SERVICE
      fetchSeasons(true);
    } catch (e) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  if (!hotelId) return <div className="text-center p-8 text-gray-500">Selecciona un hotel para gestionar sus temporadas.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="bg-slate-50 border-slate-200 shadow-sm overflow-hidden relative">
        {isRealtimeActive && (
             <div className="absolute top-0 right-0 p-2">
                 <Badge className="bg-green-500 hover:bg-green-600 animate-pulse gap-1">
                     <Zap className="w-3 h-3 fill-current" /> Live Sync
                 </Badge>
             </div>
        )}
        <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600"/> Nueva Temporada
                </h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <Label htmlFor="s-name">Nombre</Label>
                    <Input id="s-name" value={newSeason.name} onChange={e => setNewSeason({...newSeason, name: e.target.value})} placeholder="Ej. Verano 2026" className="bg-white"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="s-start">Inicio</Label>
                    <Input id="s-start" type="date" value={newSeason.start_date} onChange={e => setNewSeason({...newSeason, start_date: e.target.value})} className="bg-white"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="s-end">Fin</Label>
                    <Input id="s-end" type="date" value={newSeason.end_date} onChange={e => setNewSeason({...newSeason, end_date: e.target.value})} className="bg-white"/>
                </div>
                <div className="space-y-2 lg:col-span-1">
                    <Button onClick={handleAdd} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm">
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4 mr-2" />} Agregar
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg shadow-sm bg-white overflow-hidden ring-1 ring-slate-100">
          <Table>
            <TableHeader>
                <TableRow className="bg-slate-50/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8"><RefreshCw className="animate-spin inline"/></TableCell></TableRow>
                ) : seasons.map(s => (
                    <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{new Date(s.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(s.end_date).toLocaleDateString()}</TableCell>
                        <TableCell>{s.description || '-'}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4"/></Button></TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
      </div>
    </div>
  );
};

export default SeasonsManagement;