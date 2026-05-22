
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { validateLote01Sync } from '@/utils/validateLote01Sync';
import { Loader2, CheckCircle, XCircle, FileJson, Activity } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const Lote01Validator = () => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);

    const runValidation = async () => {
        setLoading(true);
        try {
            const result = await validateLote01Sync();
            setReport(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = () => {
        if (!report) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "LOTE_01_VALIDATION_REPORT.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600"/> 
                    Validador Lote 01 (Inyección & Sync)
                </CardTitle>
                <CardDescription>
                    Herramienta de diagnóstico para verificar la inyección de inventario y activación multimedia en los 10 hoteles target.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-6">
                    <Button onClick={runValidation} disabled={loading} className="bg-slate-900 text-white">
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <CheckCircle className="w-4 h-4 mr-2"/>}
                        Ejecutar Validación
                    </Button>
                    
                    {report && (
                        <Button variant="outline" onClick={downloadReport}>
                            <FileJson className="w-4 h-4 mr-2"/> Exportar JSON
                        </Button>
                    )}
                </div>

                {report && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-slate-50 border-slate-200">
                                <CardContent className="p-4 text-center">
                                    <div className="text-sm text-slate-500 font-medium">Total Habitaciones</div>
                                    <div className="text-2xl font-bold text-slate-900">{report.summary.total_rooms} / 60</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-50 border-slate-200">
                                <CardContent className="p-4 text-center">
                                    <div className="text-sm text-slate-500 font-medium">Total Multimedia</div>
                                    <div className="text-2xl font-bold text-slate-900">{report.summary.total_media} / 30+</div>
                                </CardContent>
                            </Card>
                            <Card className={report.summary.all_synced ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                                <CardContent className="p-4 text-center">
                                    <div className={report.summary.all_synced ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                        Estado Global
                                    </div>
                                    <div className="text-2xl font-bold flex justify-center items-center gap-2">
                                        {report.summary.all_synced ? (
                                            <><CheckCircle className="w-6 h-6 text-green-600"/> OPERATIVO</>
                                        ) : (
                                            <><XCircle className="w-6 h-6 text-red-600"/> FALLOS DETECTADOS</>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <ScrollArea className="h-[300px] border rounded-md">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 font-medium sticky top-0">
                                    <tr>
                                        <th className="p-3">Hotel</th>
                                        <th className="p-3">Rooms</th>
                                        <th className="p-3">Media</th>
                                        <th className="p-3">Sync</th>
                                        <th className="p-3 text-right">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {report.hotels_processed.map((h, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="p-3 font-medium">{h.name}</td>
                                            <td className={h.rooms >= 6 ? "p-3 text-green-600" : "p-3 text-red-600"}>{h.rooms}</td>
                                            <td className={h.media >= 3 ? "p-3 text-green-600" : "p-3 text-red-600"}>{h.media}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-xs ${h.sync_status === 'SYNCED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {h.sync_status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">{h.status_icon}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default Lote01Validator;
