import React from 'react';
import AdminBookingsPanel from '@/components/admin/AdminBookingsPanel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, FileText, CheckCircle } from 'lucide-react';

const AdminSalesPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Módulo de Ventas</h1>
                    <p className="text-gray-500">Gestión centralizada de cotizaciones, reservas y facturación.</p>
                </div>
                <div className="flex gap-2">
                     <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1 items-center px-3 py-1">
                        <CheckCircle className="w-3 h-3" /> Sistema Activo
                     </Badge>
                </div>
            </div>

            {/* KPI Cards (Placeholder for future real metrics) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Ventas del Mes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-800">$0.00 USD</div>
                        <p className="text-xs text-gray-500">+0% vs mes anterior</p>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                    <CardHeader className="pb-2">
                         <CardTitle className="text-sm font-medium text-purple-600 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Cotizaciones
                        </CardTitle>
                    </CardHeader>
                     <CardContent>
                        <div className="text-2xl font-bold text-gray-800">0</div>
                        <p className="text-xs text-gray-500">Generadas hoy</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Booking Panel Logic Reused */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader>
                    <CardTitle>Historial de Transacciones</CardTitle>
                    <CardDescription>Visualiza y gestiona todas las operaciones registradas.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                     <div className="p-6 pt-0">
                        <AdminBookingsPanel />
                     </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminSalesPage;