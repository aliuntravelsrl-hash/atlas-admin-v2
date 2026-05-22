import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

const AdminUsersPage = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>Consulta la información de los usuarios registrados y sus interacciones.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center p-12 min-h-[400px] bg-gray-50 rounded-b-lg">
                <Construction className="w-16 h-16 text-yellow-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">Módulo en Construcción</h3>
                <p className="text-gray-500 mt-2">Esta funcionalidad estará disponible próximamente. Puedes solicitarla en el siguiente prompt.</p>
            </CardContent>
        </Card>
    );
};

export default AdminUsersPage;