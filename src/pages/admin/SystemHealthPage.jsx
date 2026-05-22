import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSystemHealth } from '@/contexts/SystemHealthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity } from 'lucide-react';

const SystemHealthPage = () => {
  const { healthReport, checkHealth, isChecking } = useSystemHealth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Salud del Sistema (Health Check)</h1>
          <p className="text-slate-500 mt-1">
            Auditoría técnica en tiempo real • {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={checkHealth} disabled={isChecking}>
           <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
           Actualizar Estado
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Estado General</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-2">
               <Activity className={`w-5 h-5 ${healthReport?.status === 'RESUELTO ✅' ? 'text-green-500' : 'text-red-500'}`} />
               <span className="text-2xl font-bold">{healthReport?.status || "UNKNOWN"}</span>
             </div>
          </CardContent>
        </Card>
        
        <Card>
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Integridad de Datos</CardTitle>
          </CardHeader>
          <CardContent>
             <Badge variant={healthReport?.data_integrity === 'VERIFIED' ? 'success' : 'destructive'} className="text-lg">
                {healthReport?.data_integrity || "PENDING"}
             </Badge>
          </CardContent>
        </Card>

        <Card>
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Registros (Knowledge Base)</CardTitle>
          </CardHeader>
          <CardContent>
             <span className="text-2xl font-mono font-bold">{healthReport?.records_found ?? '-'}</span>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-950 border-slate-800 text-slate-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-green-500 font-mono">window.__SYSTEM_HEALTH__</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="font-mono text-xs overflow-auto p-4 bg-black/50 rounded-lg max-h-[500px]">
            {healthReport ? JSON.stringify(healthReport, null, 2) : '// Cargando reporte...'}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealthPage;