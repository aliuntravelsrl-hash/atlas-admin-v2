
import React from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import MediaSyncDashboard from '@/components/admin/MediaSyncDashboard';
import MultimediaManagement from '@/components/admin/MultimediaManagement';
import { ShieldCheck, Video, Image as ImageIcon } from 'lucide-react';

const MediaManagementPage = () => {
    const { user } = useAdminAuth();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión Multimedia Centralizada</h1>
                    <p className="text-gray-500">Administración de Galerías, Videos y Sincronización SSOT v6.5.</p>
                </div>
            </div>

            {/* Sync Dashboard Widget */}
            <MediaSyncDashboard />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* Documentation Card */}
                    <Card className="bg-slate-50 border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-slate-600" />
                                Protocolo de Integridad
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-slate-600 space-y-2">
                                <p>
                                    Este panel opera bajo el protocolo <strong>SSOT Multimedia v6.5</strong>. 
                                    Todas las modificaciones realizadas aquí se sincronizan automáticamente en tiempo real
                                    a través del mecanismo de <strong>Espejo Dual</strong>, garantizando que tanto la web pública 
                                    como el sistema legacy tengan acceso inmediato a los mismos activos.
                                </p>
                                <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                                    <li>Las imágenes se guardan en el bucket <code>hotel-media</code>.</li>
                                    <li>Los metadatos se centralizan en la tabla <code>hotel_media</code>.</li>
                                    <li>Triggers automáticos replican los cambios a <code>hotels</code> y <code>hotels_master</code>.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Reuse existing MultimediaManagement component if compatible, or build new interface */}
                    {/* Assuming MultimediaManagement allows selecting a hotel and managing its media */}
                    <div className="bg-white rounded-lg border shadow-sm p-6">
                         <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" /> Editor de Contenido por Hotel
                         </h2>
                         <p className="text-sm text-gray-500 mb-6">Seleccione un hotel para gestionar su galería y video promocional.</p>
                         
                         {/* Embedding the existing management component */}
                         <MultimediaManagement />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaManagementPage;
