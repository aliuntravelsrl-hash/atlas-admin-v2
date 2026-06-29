import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { 
  Search, FileText, Calendar, Lock, CheckCircle, Clock, 
  User, Phone, Mail, MapPin, DollarSign, ExternalLink, ShieldAlert, AlertTriangle, Download, MessageCircle, XCircle, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import FacturadorPanel from './FacturadorPanel';
import { useExchangeRate, EXCHANGE_RATE_FALLBACK } from '@/hooks/useExchangeRate';

// ── Moneda por nacionalidad ───────────────────────────────────
const getCurrency = (nat) => nat === 'DO' ? 'DOP' : 'USD'
const fmtMoney = (amountUsd, nat, rate = EXCHANGE_RATE_FALLBACK) => {
  if (!amountUsd && amountUsd !== 0) return '—'
  return getCurrency(nat) === 'DOP'
    ? `RD$ ${Math.round((parseFloat(amountUsd) || 0) * rate).toLocaleString('es-DO')}`
    : `$${parseFloat(amountUsd).toFixed(2)} USD`
}

// ── Webhooks documentos ───────────────────────────────────────
const N8N = 'https://n8n-n8n.xaruuo.easypanel.host/webhook'
const WF_EXCURSION_DOC = `${N8N}/aliun-excursion-doc`

// Detecta tipo de documento según estado de la reserva
const getDocType = (booking, payments) => {
  const total  = parseFloat(booking?.total_amount || 0)
  const paid   = (payments || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const balance = total - paid
  if (balance <= 0 && paid > 0) return 'voucher'
  if (booking?.status === 'confirmed') return 'confirmacion'
  return 'cotizacion'
}

const AdminExcursionBookingsPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [excursionsCatalog, setExcursionsCatalog] = useState([]);
  const [excursionsMap, setExcursionsMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  // ── Tasa de cambio dinámica desde exchange_rates ──────────────
  const { rate: EXCHANGE_RATE } = useExchangeRate();

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('details');
  const [crmLead, setCrmLead] = useState(null);
  const [crmLoading, setCrmLoading] = useState(false);

  // Form states for Selected Booking
  const [statusVal, setStatusVal] = useState('');
  const [paymentStatusVal, setPaymentStatusVal] = useState('');
  
  // Action states
  const [savingSettings, setSavingSettings] = useState(false);
  const [confirmingDeposit, setConfirmingDeposit] = useState(false);
  const [releasingVoucher, setReleasingVoucher] = useState(false);
  const [generandoDoc, setGenerandoDoc] = useState(false);

  // Quick Filter States
  const [filterRef, setFilterRef] = useState('');
  const [filterGuestName, setFilterGuestName] = useState('');
  const [filterExcursionName, setFilterExcursionName] = useState('');
  const [filterDestination, setFilterDestination] = useState('');
  const [filterCheckIn, setFilterCheckIn] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  const { toast } = useToast();

  // --- Initial Load & Realtime Subscription ---
  useEffect(() => {
    loadCatalogAndBookings();

    const subscription = supabase
      .channel('admin_excursion_bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        console.log('Realtime update received:', payload);
        loadCatalogAndBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Sync selected booking details if bookings list updates in background
  useEffect(() => {
    if (selectedBooking) {
      const updated = bookings.find(b => b.id === selectedBooking.id);
      if (updated) {
        setSelectedBooking(updated);
        setStatusVal(updated.status || '');
        setPaymentStatusVal(updated.payment_status || '');
      }
    }
  }, [bookings]);

  const loadCatalogAndBookings = async () => {
    setLoading(true);
    try {
      // 1. Cargar catálogo de excursiones para mapear nombres e imágenes
      const { data: catData, error: catError } = await supabase
        .from('excursions')
        .select('id, slug, name, zone, image_url');
        
      if (catError) throw catError;
      
      const newMap = new Map(catData?.map(ex => [ex.slug, ex]) || []);
      setExcursionsCatalog(catData || []);
      setExcursionsMap(newMap);

      // 2. Cargar reservas de tipo excursión
      const { data: bookData, error: bookError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_type', 'excursion')
        .order('created_at', { ascending: false });
        
      if (bookError) throw bookError;
      setBookings(bookData || []);
    } catch (error) {
      console.error("Error fetching excursion bookings:", error);
      toast({
        title: "Error de Sincronización",
        description: "No se pudieron obtener las reservas de excursiones.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // --- CRM Lead Link Lookup ---
  const fetchCrmLead = async (guestName) => {
    if (!guestName) return;
    setCrmLoading(true);
    setCrmLead(null);
    try {
      const cleanName = guestName.replace(/^(Mr\/Ms|Mr|Ms)\s+/i, '');
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .ilike('full_name', `%${cleanName}%`)
        .eq('source', 'web_booking')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setCrmLead(data);
    } catch (error) {
      console.error("Error fetching CRM Lead:", error);
    } finally {
      setCrmLoading(false);
    }
  };

  const handleOpenDetail = async (booking, defaultTab = 'details') => {
    setSelectedBooking(booking);
    setStatusVal(booking.status || '');
    setPaymentStatusVal(booking.payment_status || '');
    setDetailTab(defaultTab);
    setIsDetailOpen(true);
    fetchCrmLead(booking.lead_guest_name);
  };

  // --- WhatsApp Sharing Helper ---
  const handleShareWhatsApp = (booking) => {
    if (!booking) return;
    const phone = booking.lead_phone ? booking.lead_phone.replace(/\D/g, '') : '';
    const name = booking.lead_guest_name || 'Cliente';
    const excData = excursionsMap.get(booking.hotel_code);
    const excursionName = excData?.name || booking.room_name || 'Excursión Seleccionada';
    const pdfUrl = booking.voucher_pdf_url || '';
    
    const message = `¡Hola *${name}*! 👋 Te saludamos de Aliun Travel. Aquí tienes el enlace para ver y descargar tu voucher oficial de confirmación para tu actividad de *${excursionName}*:\n\n🔗 ${pdfUrl}\n\n¡Que tengas una excelente experiencia! 🌴🌊`;
    
    let targetPhone = phone;
    if (phone && phone.length === 10) {
      targetPhone = '1' + phone;
    }

    const waUrl = targetPhone 
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/18299648443?text=${encodeURIComponent(message)}`;
      
    window.open(waUrl, '_blank');
  };

  // --- Generar documento oficial ---
  const handleGenerarDocumento = async (booking, paymentsData) => {
    if (!booking) return
    setGenerandoDoc(true)
    const nat     = booking.nationality || 'DO'
    const total   = parseFloat(booking.total_amount || 0)
    const paid    = (paymentsData || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
    const balance = total - paid
    const docType = getDocType(booking, paymentsData)
    const sr      = booking.special_requests || {}

    const payload = {
      booking_ref:      booking.booking_reference,
      excursion_slug:   booking.hotel_code || sr.excursion_slug || '',
      plan_id:          sr.plan_id || '',
      tipo_documento:   docType === 'voucher' ? 'VOUCHER' : docType === 'confirmacion' ? 'CONFIRMACION' : 'COTIZACION',
      cliente_nombre:   booking.lead_guest_name,
      cliente_telefono: booking.lead_phone || '',
      fecha:            booking.check_in,
      pax_adultos:      booking.adults || 2,
      pax_ninos:        booking.children || 0,
      nationality:      nat,
      total_dop:        Math.round(total * EXCHANGE_RATE),
      deposito_dop:     Math.round(paid * EXCHANGE_RATE),
      saldo_dop:        Math.round(balance * EXCHANGE_RATE),
    }

    try {
      const res  = await fetch(WF_EXCURSION_DOC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.pdf_url) window.open(data.pdf_url, '_blank')
      toast({ title: `✅ Excursión — ${docType.charAt(0).toUpperCase()+docType.slice(1)} generado`, description: 'PDF enviado a Telegram del Director.' })
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setGenerandoDoc(false)
    }
  }

  // Save manual status change
  const handleSaveSettings = async () => {
    if (!selectedBooking) return;
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: statusVal,
          payment_status: paymentStatusVal,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      toast({
        title: "Reserva Actualizada",
        description: "Los cambios fueron guardados exitosamente en la base de datos.",
      });
      loadCatalogAndBookings();
    } catch (error) {
      console.error("Error saving booking details:", error);
      toast({
        title: "Error al Guardar",
        description: "No se pudieron actualizar los datos de la reserva.",
        variant: "destructive"
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Confirm Deposit validation
  const handleConfirmDeposit = async () => {
    if (!selectedBooking) return;
    setConfirmingDeposit(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'deposit_received',
          validated_by: 'director',
          validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      toast({
        title: "Pago Confirmado",
        description: "El pago inicial fue marcado como recibido.",
      });
      loadCatalogAndBookings();
    } catch (error) {
      console.error("Error confirming deposit:", error);
      toast({
        title: "Error de Validación",
        description: "No se pudo registrar la validación del depósito.",
        variant: "destructive"
      });
    } finally {
      setConfirmingDeposit(false);
    }
  };

  // Release and send Excursion Voucher via Gotenberg
  const handleReleaseVoucher = async () => {
    if (!selectedBooking) return;
    setReleasingVoucher(true);

    if (selectedBooking.voucher_pdf_url) {
      toast({
        title: "Voucher Ya Emitido",
        description: "Esta reserva ya cuenta con un voucher. Usando el enlace existente.",
      });
      setReleasingVoucher(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const excData = excursionsMap.get(selectedBooking.hotel_code);
      const excursionName = excData?.name || selectedBooking.room_name || "Excursión";
      const total = parseFloat(selectedBooking.total_amount || 0);

      const response = await fetch('https://n8n-n8n.xaruuo.easypanel.host/webhook/aliun-deposito-aprobado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          booking_reference: selectedBooking.booking_reference,
          hotel_confirmation_no: 'EXC-' + selectedBooking.booking_reference,
          monto_deposito: total,
          email_cliente: selectedBooking.lead_email || "reservas@aliuntravelsrl.com",
          hotel_name: excursionName,
          check_in: selectedBooking.check_in,
          check_out: selectedBooking.check_in,
          lead_name: selectedBooking.lead_guest_name
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error en servidor: ${response.statusText}`);
      }

      const result = await response.json();
      const pdfUrl = result.pdf_url || result.url || result.pdf;

      if (!pdfUrl) {
        throw new Error("No se recibió la URL del PDF del voucher.");
      }

      const { error: dbError } = await supabase
        .from('bookings')
        .update({
          fulfillment_status: 'voucher_issued',
          voucher_pdf_url: pdfUrl,
          status: 'confirmed',
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBooking.id);

      if (dbError) throw dbError;

      toast({
        title: "Voucher de Excursión Emitido ✅",
        description: "El voucher PDF fue generado con Gotenberg y enviado al cliente.",
      });
      loadCatalogAndBookings();

    } catch (error) {
      console.error("Error releasing excursion voucher:", error);
      const isTimeout = error.name === 'AbortError';
      toast({
        title: isTimeout ? "Timeout de Generación" : "Error al Liberar",
        description: isTimeout 
          ? "El renderizado de Gotenberg demoró más de 30s. Intenta nuevamente." 
          : error.message || "Ocurrió un error al disparar el webhook de vouchers.",
        variant: "destructive"
      });
    } finally {
      setReleasingVoucher(false);
    }
  };

  // Cancel booking action
  const handleCancelBooking = async (booking) => {
    if (!booking) return;
    if (!window.confirm(`¿Estás seguro de que deseas cancelar la reserva de excursión ${booking.booking_reference}?`)) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Reserva Cancelada",
        description: `La reserva ${booking.booking_reference} fue marcada como Cancelada.`,
      });
      loadCatalogAndBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error al Cancelar",
        description: "No se pudo cancelar la reserva en Supabase.",
        variant: "destructive"
      });
    }
  };

  // --- Filtering ---
  const filteredBookings = bookings.filter(b => {
    const excData = excursionsMap.get(b.hotel_code);
    const excursionName = excData?.name || b.room_name || '';

    // Search Term
    const matchesSearch = searchTerm === '' ? true : (
      b.lead_guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      excursionName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Advanced Filters
    const matchesRef = filterRef === '' ? true : b.booking_reference?.toLowerCase().includes(filterRef.toLowerCase());
    const matchesGuestName = filterGuestName === '' ? true : b.lead_guest_name?.toLowerCase().includes(filterGuestName.toLowerCase());
    const matchesExcursionName = filterExcursionName === '' ? true : excursionName.toLowerCase().includes(filterExcursionName.toLowerCase());
    const matchesDestination = filterDestination === '' ? true : excData?.zone?.toLowerCase().includes(filterDestination.toLowerCase());
    const matchesCheckIn = filterCheckIn === '' ? true : b.check_in === filterCheckIn;
    
    const matchesStatus = filterStatus === 'all' ? true : b.status === filterStatus;
    const matchesPayment = filterPayment === 'all' ? true : b.payment_status === filterPayment;

    // Tabs List Filter
    let matchesTab = true;
    if (activeTab === 'pending_validation') {
      matchesTab = b.status === 'pending_validation';
    } else if (activeTab === 'waiting_confirmation') {
      matchesTab = b.status === 'waiting_confirmation';
    } else if (activeTab === 'voucher_issued') {
      matchesTab = b.fulfillment_status === 'voucher_issued';
    } else if (activeTab === 'completed') {
      matchesTab = b.fulfillment_status === 'completed';
    } else if (activeTab === 'cancelled') {
      matchesTab = b.status === 'cancelled';
    }

    return matchesSearch && matchesRef && matchesGuestName && 
           matchesExcursionName && matchesDestination && matchesCheckIn && 
           matchesStatus && matchesPayment && matchesTab;
  });

  const handleClearFilters = () => {
    setFilterRef('');
    setFilterGuestName('');
    setFilterExcursionName('');
    setFilterDestination('');
    setFilterCheckIn('');
    setFilterStatus('all');
    setFilterPayment('all');
    setSearchTerm('');
  };

  // --- Helper Labels ---
  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Confirmada</Badge>;
      case 'pending_validation':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Pendiente Validar</Badge>;
      case 'waiting_confirmation':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Espera Confirmación</Badge>;
      case 'cancelled':
        return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-600 text-white font-bold">Pago Total</Badge>;
      case 'deposit_received':
        return <Badge className="bg-blue-600 text-white font-bold">Inicial Recibido</Badge>;
      case 'unpaid':
        return <Badge className="bg-amber-600 text-white font-bold">Pendiente Pago</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 flex gap-6 p-6 min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
      
      {/* ── SECCIÓN IZQUIERDA: LISTADO ───────────────────────────── */}
      <div className="flex-1 space-y-6">
        
        {/* Header Táctico */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              Mesa de Control — Excursiones 🌊
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              Monitorea ingresos y aprueba la emisión de vouchers de excursiones en tiempo real (Estilo OTA).
            </p>
          </div>
        </div>

        {/* Barra de Filtro de Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-px">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pending_validation', label: 'Pendientes de Pago' },
              { id: 'waiting_confirmation', label: 'En Espera' },
              { id: 'voucher_issued', label: 'Voucher Emitido' },
              { id: 'completed', label: 'Completadas' },
              { id: 'cancelled', label: 'Canceladas' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === t.id 
                    ? 'border-teal-500 text-teal-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          
          {/* Input de Búsqueda Rápida */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Buscar por referencia, cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800 text-white rounded-xl focus-visible:ring-teal-500"
            />
          </div>
        </div>

        {/* Cargador */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
            <p className="text-sm font-bold">Cargando mesa de control de excursiones...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center text-slate-400">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-500/60 mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">Sin registros encontrados</h3>
            <p className="text-sm">No existen reservas de excursiones que coincidan con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => {
              const excData = excursionsMap.get(booking.hotel_code);
              const excursionName = excData?.name || booking.room_name || 'Excursión Desconocida';
              const zone = excData?.zone || 'República Dominicana';
              const bgImage = excData?.image_url || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600&auto=format&fit=crop';

              return (
                <Card key={booking.id} className="bg-slate-900/60 border-slate-800/80 overflow-hidden hover:border-slate-700/60 transition-all rounded-2xl">
                  <CardContent className="p-0 flex flex-col md:flex-row">
                    
                    {/* Columna 1: Info e Imagen de la Excursión */}
                    <div className="w-full md:w-80 relative p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
                      <div className="absolute inset-0 z-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
                      <div className="relative z-10 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-black tracking-widest text-teal-400 uppercase bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-md">
                            ALIUN TRAVEL SRL. (Mesa de Control)
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white line-clamp-1">{excursionName}</h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" /> {zone}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold">
                          Reservada: {booking.created_at ? format(new Date(booking.created_at), "eeee dd-MMM-yyyy", { locale: es }) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Columna 2: Estado y Fechas */}
                    <div className="flex-1 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Fecha Actividad:</span>
                          <span className="text-sm font-bold text-white flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-teal-500" />
                            {booking.check_in}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Estado Reserva:</span>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end border-t border-slate-800/60 pt-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Plan Contratado:</span>
                          <span className="text-xs font-bold text-teal-500">{booking.room_name || 'Servicio Estándar'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-medium block">
                            Pax: {booking.adults} adultos {booking.children > 0 && `, ${booking.children} niños`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Columna 3: Precios y Acciones Primarias */}
                    <div className="w-full md:w-80 p-6 flex flex-col justify-between bg-slate-900/30 gap-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Localizador:</span>
                          <span className="text-xs font-black text-slate-300 font-mono">{booking.booking_reference}</span>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Estado Pago:</span>
                          {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-bold text-slate-400">IMPORTE:</span>
                          <span className="text-2xl font-black text-amber-500">
                            {fmtMoney(booking.total_amount, booking.nationality, EXCHANGE_RATE)}
                          </span>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={() => handleOpenDetail(booking, 'details')}
                          variant="outline" 
                          size="sm" 
                          className="bg-slate-850 hover:bg-slate-800 border-slate-800 text-white rounded-xl font-bold"
                        >
                          Ver Detalles
                        </Button>
                        
                        {booking.payment_status === 'paid' && booking.voucher_pdf_url ? (
                          <Button 
                            onClick={() => handleShareWhatsApp(booking)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black gap-1"
                            size="sm"
                          >
                            <MessageCircle className="w-4 h-4" /> Enviar WA
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleOpenDetail(booking, 'voucher')}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black gap-1"
                            size="sm"
                          >
                            <FileText className="w-4 h-4" /> Emitir PDF
                          </Button>
                        )}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECCIÓN DERECHA: QUICK FILTER ────────────────────────── */}
      <div className="w-80 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 h-fit space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">⚡ Filtro Rápido</h2>
          <button onClick={handleClearFilters} className="text-xs text-rose-400 hover:text-rose-300 font-bold">
            Limpiar
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400">Referencia Reserva</Label>
            <Input 
              placeholder="Ej: ALN-1B3ZCL" 
              value={filterRef} 
              onChange={e => setFilterRef(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400">Nombre del Huésped</Label>
            <Input 
              placeholder="Nombre del cliente" 
              value={filterGuestName} 
              onChange={e => setFilterGuestName(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400">Nombre de Excursión</Label>
            <Input 
              placeholder="Nombre de la actividad" 
              value={filterExcursionName} 
              onChange={e => setFilterExcursionName(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400">Destino / Zona</Label>
            <Input 
              placeholder="Destino" 
              value={filterDestination} 
              onChange={e => setFilterDestination(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400">Fecha Actividad</Label>
            <Input 
              type="date"
              value={filterCheckIn} 
              onChange={e => setFilterCheckIn(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400">Estado Reserva</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-white rounded-xl">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending_validation">Pendiente Validar</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="waiting_confirmation">Espera Confirmación</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-400">Estado de Pago</Label>
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-white rounded-xl">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pago Total</SelectItem>
                <SelectItem value="deposit_received">Inicial Recibido</SelectItem>
                <SelectItem value="unpaid">Pendiente Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── DIALOG: DETALLE DE RESERVA DE EXCURSIÓN ─────────────────── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-800 text-slate-100 rounded-3xl overflow-hidden p-0">
          
          <DialogHeader className="p-6 bg-slate-950 border-b border-slate-800 flex flex-row justify-between items-center">
            <div>
              <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                Detalle de Reserva — {selectedBooking?.booking_reference}
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-1">
                Visualización, edición de estado y aprobación de vouchers.
              </p>
            </div>
            <div className="flex gap-2">
              {selectedBooking && getStatusBadge(selectedBooking.status)}
              {selectedBooking && getPaymentStatusBadge(selectedBooking.payment_status)}
            </div>
          </DialogHeader>

          {/* Menú de Tabs Interno */}
          <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
            {[
              { id: 'details', label: 'Información General' },
              { id: 'voucher', label: 'Generación de Voucher / PDF' },
              { id: 'facturacion', label: 'Facturas & Recibos DOP' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setDetailTab(t.id)}
                className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
                  detailTab === t.id 
                    ? 'border-teal-500 text-teal-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            
            {/* TAB: GENERAL */}
            {detailTab === 'details' && selectedBooking && (
              <div className="space-y-6">
                
                {/* Grid Info */}
                <div className="grid grid-cols-3 gap-6">
                  
                  {/* Bloque 1: Huésped */}
                  <div className="bg-slate-950/45 p-4 rounded-2xl border border-slate-800/60 space-y-3">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-teal-500" /> Datos del Huésped
                    </h3>
                    <div className="text-xs space-y-1.5 text-slate-300">
                      <p><span className="text-slate-500">Nombre:</span> <strong className="text-white">{selectedBooking.lead_guest_name}</strong></p>
                      <p><span className="text-slate-500">Nacionalidad:</span> {selectedBooking.nationality || 'Dominicana'}</p>
                      <p><span className="text-slate-500">Teléfono:</span> {selectedBooking.lead_phone || '—'}</p>
                      <p><span className="text-slate-500">Email:</span> {selectedBooking.lead_email || '—'}</p>
                    </div>
                  </div>

                  {/* Bloque 2: Actividad */}
                  <div className="bg-slate-950/45 p-4 rounded-2xl border border-slate-800/60 space-y-3">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-500" /> Detalle Actividad
                    </h3>
                    <div className="text-xs space-y-1.5 text-slate-300">
                      <p><span className="text-slate-500">Excursión:</span> <strong className="text-white">{excursionsMap.get(selectedBooking.hotel_code)?.name || selectedBooking.room_name}</strong></p>
                      <p><span className="text-slate-500">Plan:</span> {selectedBooking.room_name || 'Estándar'}</p>
                      <p><span className="text-slate-500">Fecha:</span> {selectedBooking.check_in}</p>
                      <p><span className="text-slate-500">Pasajeros:</span> {selectedBooking.adults} Ad / {selectedBooking.children} Ch</p>
                    </div>
                  </div>

                  {/* Bloque 3: Finanzas */}
                  <div className="bg-slate-950/45 p-4 rounded-2xl border border-slate-800/60 space-y-3">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-teal-500" /> Contabilidad
                    </h3>
                    <div className="text-xs space-y-1.5 text-slate-300">
                      <p><span className="text-slate-500">Total Acordado:</span> <strong className="text-amber-500">{fmtMoney(selectedBooking.total_amount, selectedBooking.nationality, EXCHANGE_RATE)}</strong></p>
                      <p><span className="text-slate-500">Tasa Aplicada:</span> $ {selectedBooking.exchange_rate || EXCHANGE_RATE} DOP</p>
                      <p><span className="text-slate-500">Pasarela/Método:</span> {selectedBooking.payment_gateway || 'Manual / Admin'}</p>
                      <p><span className="text-slate-500">Equivalente DOP:</span> RD$ {Math.round((selectedBooking.total_amount || 0) * (selectedBooking.exchange_rate || EXCHANGE_RATE)).toLocaleString()}</p>
                    </div>
                  </div>

                </div>

                {/* Notas Internas */}
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-wider">Notas Internas de la Reserva</Label>
                  <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 min-h-16">
                    {selectedBooking.internal_notes || "Sin notas internas registradas en esta reserva."}
                  </div>
                </div>

                {/* Formulario de Modificación de Estados */}
                <div className="bg-slate-950/30 p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    ⚙️ Gestión de Estado e Inventario
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-400">Estado de la Reserva</Label>
                      <select 
                        value={statusVal} 
                        onChange={e => setStatusVal(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="pending_validation">Pendiente Validar</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="waiting_confirmation">Espera Confirmación</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-400">Estado del Pago</Label>
                      <select 
                        value={paymentStatusVal} 
                        onChange={e => setPaymentStatusVal(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="unpaid">Pendiente Pago</option>
                        <option value="deposit_received">Inicial Recibido</option>
                        <option value="paid">Pago Total</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Button 
                      onClick={() => handleCancelBooking(selectedBooking)}
                      variant="destructive" 
                      className="rounded-xl font-bold bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/10"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Cancelar Reserva
                    </Button>
                    <Button 
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black px-6"
                    >
                      {savingSettings ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: GENERACION VOUCHER */}
            {detailTab === 'voucher' && selectedBooking && (
              <div className="space-y-6">
                
                {/* Preview de Voucher Físico */}
                <div className="bg-slate-950/45 p-6 rounded-3xl border border-slate-800/80 space-y-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <FileText className="w-5 h-5 text-teal-400" /> Voucher Oficial / Confirmación de Excursión
                  </h3>
                  <p className="text-xs text-slate-400">
                    Genera el PDF oficial para el cliente. El PDF incluirá la descripción del plan de la excursión, datos del huésped principal, fecha de actividad y el balance financiero.
                  </p>
                  
                  {selectedBooking.voucher_pdf_url ? (
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="text-xs font-bold text-white">Voucher ya emitido y guardado</p>
                          <p className="text-[10px] text-slate-400">Puedes reenviar el enlace o visualizar el PDF directo.</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => window.open(selectedBooking.voucher_pdf_url, '_blank')}
                          variant="outline" 
                          size="sm" 
                          className="bg-slate-900 border-slate-800 text-white rounded-xl font-bold"
                        >
                          <ExternalLink className="w-4 h-4 mr-1.5" /> Abrir PDF
                        </Button>
                        <Button 
                          onClick={() => handleShareWhatsApp(selectedBooking)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black"
                          size="sm"
                        >
                          <MessageCircle className="w-4 h-4 mr-1.5" /> Reenviar WA
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs space-y-4">
                      
                      {/* Advertencia de Emisión */}
                      <div className="flex items-start gap-2.5 text-amber-400 bg-amber-950/15 border border-amber-500/20 p-3.5 rounded-xl">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed">
                          <strong>Importante:</strong> Al dar clic en "Emitir Voucher Automatizado", se disparará el webhook de Gotenberg. Esto registrará la reserva como confirmed, marcará el estado de pago como paid y generará el PDF oficial de Aliun.
                        </p>
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <Button 
                          onClick={handleConfirmDeposit}
                          disabled={confirmingDeposit || selectedBooking.payment_status === 'deposit_received'}
                          variant="outline" 
                          className="flex-1 bg-slate-950 border-slate-800 text-white rounded-xl font-bold"
                        >
                          {confirmingDeposit ? 'Validando...' : 'Confirmar Primer Pago (Azul/Popular)'}
                        </Button>
                        <Button 
                          onClick={handleReleaseVoucher}
                          disabled={releasingVoucher}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black"
                        >
                          {releasingVoucher ? 'Emitiendo PDF...' : 'Emitir Voucher Automatizado'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Fila Documentos Auxiliares */}
                  <div className="border-t border-slate-800/80 pt-4 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-white">Generar Confirmación de Reserva / Proforma</h4>
                      <p className="text-[10px] text-slate-500">Envía una cotización o confirmación temporal con balance pendiente a n8n.</p>
                    </div>
                    <Button
                      onClick={() => handleGenerarDocumento(selectedBooking, [])}
                      disabled={generandoDoc}
                      variant="outline"
                      size="sm"
                      className="bg-slate-950 hover:bg-slate-900 border-slate-800 text-teal-400 font-bold rounded-xl"
                    >
                      {generandoDoc ? 'Generando...' : 'Enviar Documento a Telegram'}
                    </Button>
                  </div>

                </div>
              </div>
            )}

            {/* TAB: FACTURACION */}
            {detailTab === 'facturacion' && selectedBooking && (
              <div className="space-y-6">
                <FacturadorPanel booking={selectedBooking} />
              </div>
            )}

          </div>

        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminExcursionBookingsPanel;
