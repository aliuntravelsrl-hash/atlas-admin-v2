import React, { useState, useEffect } from 'react';
import { bookingService } from '@/services/bookingService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Calendar, Lock, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { generateQuotePDF } from '@/lib/QuotationPDFGenerator'; // Fixed import path
import { supabase } from '@/lib/customSupabaseClient'; // For Realtime

const AdminBookingsPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // --- Initial Load & Realtime Subscription ---
  useEffect(() => {
    loadBookings();

    // Realtime Subscription
    const subscription = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        console.log('Realtime update:', payload);
        loadBookings(); // Reload to get fresh data including relations
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, hotels(name), room_types(name)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
        b.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.voucher_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.hotels?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDownloadQuote = (booking) => {
    const doc = generateQuotePDF({
        hotelName: booking.hotels?.name,
        guestName: booking.guest_name,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        adults: booking.adults,
        children: booking.children,
        roomTypeName: booking.room_types?.name || 'Habitación',
        totalPrice: booking.total_price,
        id: booking.id,
        created_at: booking.created_at
    });
    doc.save(`cotizacion-${booking.guest_name.replace(/\s+/g, '_')}.pdf`);
  };

  const getStatusBadge = (status) => {
      switch(status) {
          case 'confirmed': 
          case 'paid':
              return <span className="flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200"><CheckCircle className="w-3 h-3 mr-1"/> Confirmada</span>;
          case 'waiting_confirmation':
              return <span className="flex items-center text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200"><Clock className="w-3 h-3 mr-1"/> Modo Espera</span>;
          case 'pending_validation': 
              return <span className="flex items-center text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200"><Lock className="w-3 h-3 mr-1"/> Pendiente Pago</span>;
          case 'cancelled': 
              return <span className="flex items-center text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">Cancelada</span>;
          default: 
              return <span className="flex items-center text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">{status}</span>;
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold">Monitor de Ventas (Tiempo Real)</h2>
          
          <div className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                 <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                 <Input 
                    placeholder="Buscar..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Confirmadas / Pagadas</SelectItem>
                    <SelectItem value="waiting_confirmation">Modo Espera</SelectItem>
                    <SelectItem value="pending_validation">Pendientes Pago</SelectItem>
                    <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
          </div>
       </div>

       {loading ? (
          <div className="text-center py-12 text-gray-400 animate-pulse">Sincronizando con Bóveda...</div>
       ) : (
          <div className="grid gap-4">
             {filteredBookings.map(booking => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-blue-500">
                   <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg">{booking.hotels?.name || 'Hotel'}</span>
                            {getStatusBadge(booking.status)}
                         </div>
                         <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1 items-center">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {format(new Date(booking.check_in), 'dd/MM')} - {format(new Date(booking.check_out), 'dd/MM/yyyy')}</span>
                            <span className="hidden md:inline text-gray-300">|</span>
                            <span>{booking.guest_name}</span>
                            <span className="hidden md:inline text-gray-300">|</span>
                            <span className="font-mono text-xs text-gray-400">{booking.id.slice(0,8)}</span>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                         <div className="text-right">
                            <div className="font-bold text-xl text-blue-900">${Number(booking.total_price).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">
                                {booking.payment_status === 'completed' || booking.status === 'paid' ? 'Pagado ✅' : 'Por Pagar ⚠️'}
                            </div>
                         </div>
                         <Button variant="ghost" size="sm" onClick={() => handleDownloadQuote(booking)}>
                             <FileText className="w-4 h-4 text-gray-500 hover:text-blue-600"/>
                         </Button>
                      </div>
                   </CardContent>
                </Card>
             ))}
          </div>
       )}
    </div>
  );
};

export default AdminBookingsPanel;