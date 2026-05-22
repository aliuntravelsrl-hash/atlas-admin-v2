
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminProtectedRoute = ({ children }) => {
    const { user, loading, isAdmin } = useAdminAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        );
    }

    // Si hay usuario pero no es admin (y ya terminó de cargar), algo falló en la verificación
    // o simplemente no tiene permisos.
    if (user && !isAdmin) {
         return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
                    <p className="text-gray-600 mb-6">
                        Tu cuenta no tiene permisos de administrador o hubo un error verificando tus credenciales.
                    </p>
                    <Button 
                        onClick={() => window.location.href = '/admin/login'}
                        variant="outline"
                    >
                        Volver al Login
                    </Button>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return children;
};

export default AdminProtectedRoute;
