
import React from 'react';
import { CheckCircle2, XCircle, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MultimediaValidationChecklist = ({ validationState }) => {
  const items = [
    { id: 'multimedia_synced', label: '[hotelService] Multimedia sincronizada con éxito' },
    { id: 'realtime_subscribed', label: '[Realtime] Status: SUBSCRIBED' },
    { id: 'cloud_sync_active', label: 'Cloud Sync Badge: ACTIVO (verde)' },
    { id: 'jsonb_saved', label: 'Fotos guardadas en public.hotels (rooms_data JSONB)' },
    { id: 'sql_saved', label: 'Fotos guardadas en public.rooms (image_url)' },
    { id: 'public_reflected', label: 'Cambios reflejados en web pública en <240ms' },
    { id: 'no_ref_error', label: 'Sin ReferenceError en consola' },
    { id: 'no_42883_error', label: 'Sin error 42883 en Supabase' }
  ];

  return (
    <Card className="mt-6 border-slate-200 bg-slate-50">
      <CardContent className="pt-6">
        <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" /> 
          Validación de Integridad del Sistema
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(item => {
            const status = validationState[item.id]; // true, false, or undefined/null
            return (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                {status === true ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : status === false ? (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                )}
                <span className={`${status === true ? 'text-slate-700' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MultimediaValidationChecklist;
