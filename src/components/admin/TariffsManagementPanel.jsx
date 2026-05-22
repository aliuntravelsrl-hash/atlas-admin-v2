
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { productionLogger } from '@/utils/productionLogger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, RefreshCw, DollarSign, Trash2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const TariffsManagementPanel = ({ hotelId, hotelName }) => {
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // New tariff state
  const [newTariff, setNewTariff] = useState({
    name: '',
    description: '',
    price_adult: '',
    price_child: '',
    is_active: true
  });

  useEffect(() => {
    if (hotelId) {
      fetchTariffs();
    }
  }, [hotelId]);

  const fetchTariffs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tariffs_master')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTariffs(data || []);
    } catch (error) {
      productionLogger.logError('TariffsManagementPanel', error);
      toast({
        title: "Error loading tariffs",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTariff = async () => {
    if (!newTariff.name || !newTariff.price_adult) {
      toast({
        title: "Validation Error",
        description: "Name and Adult Price are required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const payload = {
        hotel_id: hotelId,
        name: newTariff.name,
        description: newTariff.description,
        price_adult: parseFloat(newTariff.price_adult),
        price_child: parseFloat(newTariff.price_child || 0),
        is_active: newTariff.is_active
      };

      const { data, error } = await supabase
        .from('tariffs_master')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setTariffs([data, ...tariffs]);
      setIsCreating(false);
      setNewTariff({
        name: '',
        description: '',
        price_adult: '',
        price_child: '',
        is_active: true
      });
      
      toast({ title: "Success", description: "Tariff created successfully" });

    } catch (error) {
      productionLogger.logError('TariffsManagementPanel', error);
      toast({
        title: "Error creating tariff",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteTariff = async (id) => {
    if (!confirm('Are you sure you want to delete this tariff?')) return;

    try {
      const { error } = await supabase
        .from('tariffs_master')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTariffs(tariffs.filter(t => t.id !== id));
      toast({ title: "Deleted", description: "Tariff removed successfully" });
    } catch (error) {
      productionLogger.logError('TariffsManagementPanel', error);
      toast({
        title: "Error deleting tariff",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Tarifas</h2>
          <p className="text-muted-foreground">
            Administrando tarifas para: <span className="font-medium text-foreground">{hotelName || 'Hotel Seleccionado'}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTariffs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => setIsCreating(!isCreating)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Tarifa
          </Button>
        </div>
      </div>

      {isCreating && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-base">Crear Nueva Tarifa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de Tarifa</label>
                <Input 
                  placeholder="Ej. Estándar 2024" 
                  value={newTariff.name}
                  onChange={(e) => setNewTariff({...newTariff, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Input 
                  placeholder="Descripción opcional" 
                  value={newTariff.description}
                  onChange={(e) => setNewTariff({...newTariff, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio Adulto</label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    className="pl-8" 
                    placeholder="0.00" 
                    value={newTariff.price_adult}
                    onChange={(e) => setNewTariff({...newTariff, price_adult: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio Niño</label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    className="pl-8" 
                    placeholder="0.00" 
                    value={newTariff.price_child}
                    onChange={(e) => setNewTariff({...newTariff, price_child: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
              <Button onClick={handleCreateTariff}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Tarifa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Precio Adulto</TableHead>
                <TableHead>Precio Niño</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : tariffs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay tarifas registradas para este hotel.
                  </TableCell>
                </TableRow>
              ) : (
                tariffs.map((tariff) => (
                  <TableRow key={tariff.id}>
                    <TableCell className="font-medium">{tariff.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{tariff.description || '-'}</TableCell>
                    <TableCell>${tariff.price_adult?.toFixed(2)}</TableCell>
                    <TableCell>${tariff.price_child?.toFixed(2)}</TableCell>
                    <TableCell>
                      {tariff.is_active ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteTariff(tariff.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TariffsManagementPanel;
