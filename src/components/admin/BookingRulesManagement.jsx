import React, { useState, useEffect } from 'react';
import { hotelService } from '@/services/hotelService';
import { seasonService } from '@/services/seasonService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Save, Loader2, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const BookingRulesManagement = ({ hotelId }) => {
  const [rules, setRules] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    season_id: 'default', 
    min_stay: 1,
    max_stay: 30,
    cancellation_policy: '',
    tax_percentage: 18,
    early_booking_discount: 0,
    legal_disclaimer: '' 
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rData, sData] = await Promise.all([
        hotelService.getBookingRules(hotelId),
        seasonService.getSeasons(hotelId)
      ]);
      setRules(rData || []);
      setSeasons(sData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [hotelId]);

  /**
   * Envía las reglas al Webhook de n8n (Workflow E)
   * Endpoint: https://n8n-n8n.xaruuo.easypanel.host/webhook/admin/vault-editor
   */
  const handleSaveToN8N = async () => {
    setSaving(true);
    
    // Preparar Flat JSON Payload
    const payload = {
        hotel_id: hotelId,
        season_id: formData.season_id === 'default' ? null : formData.season_id,
        policy_type: "booking_rules",
        min_stay: parseInt(formData.min_stay),
        max_stay: parseInt(formData.max_stay),
        cancellation_policy: formData.cancellation_policy,
        tax_percentage: parseFloat(formData.tax_percentage),
        early_booking_discount: parseFloat(formData.early_booking_discount),
        legal_disclaimer: formData.legal_disclaimer,
        source: "admin_panel"
    };

    const ENDPOINT = "https://n8n-n8n.xaruuo.easypanel.host/webhook/admin/vault-editor";

    console.log(`[BookingRules] 📡 Enviando a Workflow E: ${ENDPOINT}`);
    console.log(`[BookingRules] 📦 Flat Payload:`, JSON.stringify(payload));

    try {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`n8n Error: ${response.status}`);

        toast({ title: 'Reglas Actualizadas', description: 'Políticas enviadas a n8n correctamente.' });
        fetchData(); 

    } catch (error) {
        console.error("n8n Error:", error);
        toast({ title: 'Error de Sincronización', description: 'No se pudo conectar con n8n.', variant: 'destructive' });
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-amber-900">Configurar Política de Reservas</h4>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
                <Globe className="w-3 h-3"/> n8n Connected
            </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Temporada</Label>
            <Select value={formData.season_id} onValueChange={v => setFormData(prev => ({...prev, season_id: v}))}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">General (Default)</SelectItem>
                {seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Min. Noches</Label><Input type="number" value={formData.min_stay} onChange={e => setFormData({...formData, min_stay: e.target.value})} /></div>
            <div className="space-y-2"><Label>Max. Noches</Label><Input type="number" value={formData.max_stay} onChange={e => setFormData({...formData, max_stay: e.target.value})} /></div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Política de Cancelación</Label>
            <Textarea 
                value={formData.cancellation_policy} 
                onChange={e => setFormData({...formData, cancellation_policy: e.target.value})} 
                placeholder="Ej: Cancelación gratuita hasta 48h antes..."
                className="bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:col-span-2">
             <div className="space-y-2"><Label>Impuestos (%)</Label><Input type="number" value={formData.tax_percentage} onChange={e => setFormData({...formData, tax_percentage: e.target.value})} /></div>
             <div className="space-y-2"><Label>Desc. Anticipado (%)</Label><Input type="number" value={formData.early_booking_discount} onChange={e => setFormData({...formData, early_booking_discount: e.target.value})} /></div>
          </div>
        </div>

        <Button onClick={handleSaveToN8N} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2" />} 
            Guardar Regla
        </Button>
      </div>
    </div>
  );
};

export default BookingRulesManagement;