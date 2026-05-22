
import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ShieldCheck, Database, Activity, GitBranch, FileCode, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { auditMultimediaUI } from '@/utils/auditMultimediaUI';
import { auditUUIDPipeline } from '@/utils/auditUUIDPipeline';
import { auditRealtimeLatency } from '@/utils/auditRealtimeLatency';
import { auditFinalVerdict, clearLocalCache } from '@/utils/auditFinalVerdict';
import { validateAuditSuccess } from '@/utils/validateAuditSuccess';
import AdminLayout from '@/components/admin/AdminLayout';

const ForensicAuditPage = () => {
    const [vaultData, setVaultData] = useState(null);
    const [vaultLoading, setVaultLoading] = useState(false);
    
    const [uiReport, setUiReport] = useState(null);
    const [pipelineReport, setPipelineReport] = useState(null);
    const [realtimeReport, setRealtimeReport] = useState(null);
    const [finalReport, setFinalReport] = useState(null);
    const [successValidation, setSuccessValidation] = useState(null);

    // Task 1: Auditoría de Bóveda
    const runVaultAudit = async () => {
        setVaultLoading(true);
        try {
            const { data, error } = await supabase
                .from('hotels_master')
                .select('id, video_id, gallery_data, updated_at')
                .eq('id', '709aba58-ec3e-4840-80a3-b801ea7dc736')
                .single();
            
            if (error) throw error;
            setVaultData({
                ...data,
                status: data ? 'REAL DATA' : 'EMPTY'
            });
        } catch (error) {
            setVaultData({ error: error.message, status: 'ERROR' });
        } finally {
            setVaultLoading(false);
        }
    };

    // Ejecutores
    const runUiAudit = () => setUiReport(auditMultimediaUI());
    const runPipelineAudit = () => setPipelineReport(auditUUIDPipeline());
    const runRealtimeAudit = async () => setRealtimeReport(await auditRealtimeLatency());
    const runFinalVerdict = () => setFinalReport(auditFinalVerdict());
    const runSuccessValidation = () => setSuccessValidation(validateAuditSuccess());

    const generateFullReport = async () => {
        runVaultAudit();
        runUiAudit();
        runPipelineAudit();
        await runRealtimeAudit();
        runFinalVerdict();
        runSuccessValidation();
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-blue-600" />
                        Auditoría Forense Multimedia
                    </h1>
                    <p className="text-slate-500 mt-2">Diagnóstico profundo de integridad de datos y tuberías Realtime.</p>
                </div>
                <Button onClick={generateFullReport} size="lg" className="bg-slate-900 hover:bg-slate-800">
                    Generar Reporte Completo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Bóveda */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-purple-600"/> Mapeo de Bóveda</CardTitle>
                        <CardDescription>Extracción directa de tabla 'hotels_master'</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" onClick={runVaultAudit} disabled={vaultLoading} className="w-full">
                            {vaultLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : "Ejecutar Extracción"}
                        </Button>
                        {vaultData && (
                            <div className="bg-slate-900 text-slate-50 p-4 rounded-md font-mono text-xs overflow-x-auto">
                                <pre>{JSON.stringify(vaultData, null, 2)}</pre>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. UI Crash Detection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileCode className="w-5 h-5 text-orange-600"/> Integridad de UI</CardTitle>
                        <CardDescription>Detección de ReferenceError en imports</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" onClick={runUiAudit} className="w-full">Ejecutar Escaneo UI</Button>
                        {uiReport && (
                            <div className={`p-4 rounded border ${uiReport.status === 'SIN CRASH' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    {uiReport.status === 'SIN CRASH' ? <CheckCircle className="w-4 h-4 text-green-600"/> : <XCircle className="w-4 h-4 text-red-600"/>}
                                    {uiReport.verdict}
                                </div>
                                <div className="text-xs text-slate-600">
                                    Iconos verificados: {uiReport.requiredIcons.join(', ')}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Pipeline UUID */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5 text-blue-600"/> Tubería UUID</CardTitle>
                        <CardDescription>Validación de casteo y regex UUID</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" onClick={runPipelineAudit} className="w-full">Verificar Tubería</Button>
                        {pipelineReport && (
                            <div className="p-4 bg-slate-50 border rounded space-y-2">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">{pipelineReport.status}</Badge>
                                <ul className="text-xs space-y-1 text-slate-600 list-disc pl-4">
                                    {pipelineReport.details.map((d, i) => <li key={i}>{d}</li>)}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 4. Realtime Latency */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-green-600"/> Latencia Realtime</CardTitle>
                        <CardDescription>Medición de ping y estado de suscripción</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" onClick={runRealtimeAudit} className="w-full">Medir Latencia</Button>
                        {realtimeReport && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded border text-center">
                                    <div className="text-xs text-slate-500 uppercase">Estado Canal</div>
                                    <div className="font-bold text-green-700">{realtimeReport.status}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border text-center">
                                    <div className="text-xs text-slate-500 uppercase">Badge UI</div>
                                    <div className="font-bold text-blue-700">{realtimeReport.badgeStatus}</div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

            {/* 5. Dictamen Final */}
            <Card className="border-t-4 border-t-slate-900">
                <CardHeader>
                    <CardTitle>Dictamen Forense Final</CardTitle>
                    <CardDescription>Análisis de discrepancias y estado general del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1 space-y-4 w-full">
                             <Button onClick={runFinalVerdict} className="w-full bg-slate-800">Generar Dictamen</Button>
                             {finalReport && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                                        <span className="text-sm font-medium">Estado Caché</span>
                                        <Badge variant={finalReport.cacheStatus === 'OPTIMAL' ? 'default' : 'destructive'}>{finalReport.cacheStatus}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                                        <span className="text-sm font-medium">Versión Swagger</span>
                                        <Badge variant="outline">{finalReport.swaggerVersion}</Badge>
                                    </div>
                                    <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded text-center font-bold text-lg mt-4">
                                        {finalReport.verdict}
                                    </div>
                                </div>
                             )}
                        </div>
                        <div className="w-full md:w-auto flex flex-col gap-4">
                            <Button variant="destructive" onClick={clearLocalCache} className="w-full">
                                <Trash2 className="w-4 h-4 mr-2" /> Limpiar Caché Local
                            </Button>
                            {successValidation && (
                                <div className="p-4 border rounded bg-slate-50">
                                    <h4 className="font-bold text-sm mb-2">Validación de Éxito</h4>
                                    <div className="text-xs text-slate-600 space-y-1">
                                        <div>Badge Dinámico: {successValidation.checklist.badgeDynamic ? '✅' : '❌'}</div>
                                        <div>Logs Sincronización: {successValidation.checklist.syncSuccessLog ? '✅' : '❌'}</div>
                                    </div>
                                    <div className="mt-2 font-bold text-green-600">{successValidation.status}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForensicAuditPage;
