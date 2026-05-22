import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboardService } from '@/services/dashboardService';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const StatusUpdater = ({ quotationId, currentStatus, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [status, setStatus] = useState(currentStatus || 'active');

  const handleStatusChange = async (newStatus) => {
    if (newStatus === status) return;
    
    setLoading(true);
    try {
      await dashboardService.updateQuotationStatus(quotationId, newStatus);
      setStatus(newStatus);
      toast({
        title: "Estado actualizado",
        description: `La cotización ahora está: ${newStatus}`,
      });
      if (onUpdate) onUpdate(newStatus);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
      <Select 
        value={status} 
        onValueChange={handleStatusChange} 
        disabled={loading}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Activa / Enviada</SelectItem>
          <SelectItem value="contacted">Contactada</SelectItem>
          <SelectItem value="booked">Pagada / Reservada</SelectItem>
          <SelectItem value="cancelled">Cancelada</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default StatusUpdater;