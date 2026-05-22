import React, { useState, useEffect } from 'react';
import { ErrorLogger } from '@/services/ErrorLogger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, Trash2, RefreshCw, Filter, Download } from 'lucide-react';
import { hotelService } from '@/services/hotelService';

const AdminErrorDashboard = () => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  const { toast } = useToast();

  // Filters
  const [filters, setFilters] = useState({
    hotelId: 'all',
    type: 'all',
    resolved: 'all',
    startDate: '',
    endDate: ''
  });

  // Load Metadata
  useEffect(() => {
    hotelService.getHotels().then(setHotels).catch(console.error);
  }, []);

  // Load Errors
  const fetchErrors = async () => {
    setLoading(true);
    try {
      const data = await ErrorLogger.getErrorHistory({
        hotelId: filters.hotelId === 'all' ? null : filters.hotelId,
        type: filters.type,
        resolved: filters.resolved === 'all' ? undefined : filters.resolved,
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      setErrors(data || []);
    } catch (e) {
      toast({ title: 'Error cargando logs', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, [filters]);

  const handleResolve = async (id) => {
    try {
      await ErrorLogger.resolveError(id);
      toast({ title: 'Error marcado como resuelto' });
      fetchErrors();
    } catch (e) {
      toast({ title: 'Fallo al resolver', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este log permanentemente?')) return;
    try {
      await ErrorLogger.deleteError(id);
      toast({ title: 'Log eliminado' });
      fetchErrors();
    } catch (e) {
      toast({ title: 'Fallo al eliminar', variant: 'destructive' });
    }
  };
  
  const handleRetry = async (log) => {
      try {
          const res = await ErrorLogger.retryFailedOperation(log);
          toast({ title: res.message });
      } catch (e) {
          toast({ title: 'Reintento fallido', variant: 'destructive' });
      }
  };

  const exportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "ID,Timestamp,Type,Message,User,Status\n"
        + errors.map(e => `${e.id},${e.created_at},${e.error_type},"${e.error_message.replace(/"/g, '""')}",${e.user_email},${e.resolved ? 'Resolved' : 'Open'}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `error_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uniqueTypes = [...new Set(errors.map(e => e.error_type))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-slate-900">Monitor de Errores</h2>
           <p className="text-slate-500">Diagnóstico y resolución de incidencias en producción.</p>
        </div>
        <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2"/> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
                <label className="text-xs font-medium">Hotel</label>
                <Select value={filters.hotelId} onValueChange={v => setFilters({...filters, hotelId: v})}>
                    <SelectTrigger><SelectValue placeholder="Todos los hoteles" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {hotels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-medium">Estado</label>
                <Select value={filters.resolved} onValueChange={v => setFilters({...filters, resolved: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Resueltos</SelectItem>
                        <SelectItem value="false">Pendientes</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-medium">Tipo</label>
                <Select value={filters.type} onValueChange={v => setFilters({...filters, type: v})}>
                    <SelectTrigger><SelectValue placeholder="Cualquiera" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {uniqueTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <label className="text-xs font-medium">Desde</label>
                <Input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
            </div>
            <div className="flex items-center">
                <Button onClick={fetchErrors} variant="secondary" className="w-full">
                    <Filter className="w-4 h-4 mr-2"/> Refrescar
                </Button>
            </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="bg-white rounded-md border shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                     <tr>
                         <th className="px-4 py-3">Estado</th>
                         <th className="px-4 py-3">Fecha</th>
                         <th className="px-4 py-3">Tipo</th>
                         <th className="px-4 py-3">Mensaje</th>
                         <th className="px-4 py-3">Contexto</th>
                         <th className="px-4 py-3 text-right">Acciones</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y">
                     {loading ? (
                         <tr><td colSpan="6" className="p-8 text-center text-slate-500">Cargando logs...</td></tr>
                     ) : errors.length === 0 ? (
                         <tr><td colSpan="6" className="p-8 text-center text-slate-500">No se encontraron errores. ¡Excelente!</td></tr>
                     ) : errors.map(error => (
                         <tr key={error.id} className="hover:bg-slate-50 transition-colors group">
                             <td className="px-4 py-3">
                                 {error.resolved ? (
                                     <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resuelto</Badge>
                                 ) : (
                                     <Badge variant="destructive">Pendiente</Badge>
                                 )}
                             </td>
                             <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                 {format(new Date(error.created_at), 'dd MMM HH:mm')}
                             </td>
                             <td className="px-4 py-3 font-medium text-slate-700">
                                 {error.error_type}
                             </td>
                             <td className="px-4 py-3 max-w-xs truncate" title={error.error_message}>
                                 {error.error_message}
                             </td>
                             <td className="px-4 py-3 text-xs text-slate-500">
                                 <div className="flex flex-col">
                                     <span>{error.hotels?.name || 'N/A'}</span>
                                     <span className="truncate max-w-[150px]">{error.user_email}</span>
                                 </div>
                             </td>
                             <td className="px-4 py-3 text-right">
                                 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     {!error.resolved && (
                                         <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleResolve(error.id)} title="Resolver">
                                             <CheckCircle className="w-4 h-4"/>
                                         </Button>
                                     )}
                                     <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleRetry(error)} title="Reintentar Acción">
                                         <RefreshCw className="w-4 h-4"/>
                                     </Button>
                                     <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(error.id)} title="Eliminar">
                                         <Trash2 className="w-4 h-4"/>
                                     </Button>
                                 </div>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};

export default AdminErrorDashboard;