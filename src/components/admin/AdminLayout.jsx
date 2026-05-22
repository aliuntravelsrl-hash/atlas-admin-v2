
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { cn } from '@/lib/utils';
import { LayoutDashboard, DollarSign, Bus, Calculator, Briefcase, Map, FileText, BarChart, Users, LogOut, Building, CalendarCheck, AlertOctagon, Wrench, Download, Loader2, Workflow, Database, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { emergencySyncService } from '@/services/emergency-sync-service';

const AdminLayout = () => {
  const { logout, user } = useAdminAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Lote 07 Final Report', href: '/admin/reports/lote-07-final', icon: FileCheck, className: "text-green-600 hover:text-green-700 hover:bg-green-50 font-bold", highlight: true },
    { name: 'Diagnostics', href: '/admin/diagnostics', icon: Wrench, className: "text-orange-500 hover:text-orange-600 hover:bg-orange-50" },
    { name: 'Inventario (Master)', href: '/admin/inventory', icon: Database, className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50", highlight: true },
    { name: 'Reservas', href: '/admin/bookings', icon: CalendarCheck },
    { name: 'Hoteles (Legacy)', href: '/admin/hotels', icon: Building },
    { name: 'Tarifas (n8n)', href: '/admin/tariffs', icon: Workflow, className: "text-purple-600 hover:text-purple-700 hover:bg-purple-50" },
    { name: 'Precios (Legacy)', href: '/admin/pricing', icon: DollarSign },
    { name: 'Transporte', href: '/admin/transport', icon: Bus },
    { name: 'Cotizador', href: '/admin/calculator', icon: Calculator },
    { name: 'Servicios', href: '/admin/services', icon: Briefcase },
    { name: 'Excursiones', href: '/admin/excursions', icon: Map },
    { name: 'Ventas', href: '/admin/sales', icon: FileText },
    { name: 'Analíticas', href: '/admin/analytics', icon: BarChart },
    { name: 'Usuarios', href: '/admin/users', icon: Users },
    { name: 'Errores', href: '/admin/errors', icon: AlertOctagon, className: "text-red-500 hover:text-red-600 hover:bg-red-50" },
  ];

  const handleEmergencySync = async () => {
    setSyncing(true);
    console.log('🚨 [AdminLayout] Emergency sync triggered');
    
    try {
      const result = await emergencySyncService.syncHotelsFromSupabase();
      
      if (result.success) {
        toast({
          title: "✅ Emergency Sync Complete",
          description: `Synced ${result.metadata.count} hotels in ${result.metadata.duration}ms`,
          duration: 5000
        });
      } else {
        toast({
          title: "❌ Sync Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white shadow-md flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="p-6 border-b flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <span className="font-bold text-xl text-gray-800">AdminPanel</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
             const isActive = location.pathname === item.href;
             return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  item.highlight && !isActive && "text-blue-600 bg-blue-50/50",
                  item.className
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : (item.className ? "currentColor" : "text-gray-400"))} />
                {item.name}
              </Link>
             );
          })}
        </nav>

        <div className="p-4 border-t bg-gray-50 space-y-3">
           {/* Emergency Sync Button */}
           <Button 
             variant="outline" 
             className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-300" 
             onClick={handleEmergencySync}
             disabled={syncing}
           >
              {syncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Emergency Sync
           </Button>

           <div className="px-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Usuario</p>
              <p className="text-sm font-medium truncate" title={user?.email}>{user?.email}</p>
           </div>
           
           <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" /> Salir
           </Button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
