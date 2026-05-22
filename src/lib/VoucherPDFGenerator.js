import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Genera un PDF del voucher de reserva.
 * @param {Object} booking - Objeto de reserva con detalles del hotel, habitación y huésped.
 */
export const generateVoucherPDF = (booking) => {
      // 1. Validación de datos
      if (!booking) throw new Error("No hay datos de reserva para generar el voucher.");

      const doc = new jsPDF();
      const darkBlue = [30, 58, 138];   // Corporate Blue
      const greenColor = [39, 174, 96]; // Success Green

      // --- HEADER ---
      doc.setFillColor(...darkBlue);
      doc.rect(0, 0, 210, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text("ALIUN TRAVELS", 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("CONFIRMACIÓN DE RESERVA", 105, 30, { align: 'center' });

      // --- VOUCHER CODE BOX ---
      doc.setFillColor(245, 245, 245);
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(140, 55, 60, 25, 3, 3, 'FD');
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text("Código de Reserva:", 170, 65, { align: 'center' });
      
      doc.setTextColor(39, 174, 96);
      doc.setFontSize(16);
      doc.setFont('courier', 'bold');
      doc.text(booking.voucher_code || "PENDIENTE", 170, 75, { align: 'center' });

      // --- MAIN INFO ---
      let y = 60;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`Hola, ${booking.guest_name}`, 14, y);
      
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text("Gracias por reservar con nosotros. Aquí están los detalles de tu viaje.", 14, y);

      // --- DETAILS TABLE ---
      y += 20;
      
      // Prepare Data safely
      const hotelName = booking.hotels?.name || booking.hotel_name || "Hotel Confirmado";
      const roomName = booking.room_types?.name || booking.room_name || "Habitación Asignada";
      
      let checkIn = 'N/A';
      let checkOut = 'N/A';
      try {
        if (booking.check_in) checkIn = format(new Date(booking.check_in), 'EEEE dd MMMM yyyy', { locale: es });
        if (booking.check_out) checkOut = format(new Date(booking.check_out), 'EEEE dd MMMM yyyy', { locale: es });
      } catch (e) { console.error("Date format error", e); }

      const guests = `${booking.adults} Adultos` + (booking.children > 0 ? `, ${booking.children} Niños` : '');
      const status = (booking.status === 'confirmed' || booking.status === 'pending_validation') ? 'CONFIRMADA' : booking.status.toUpperCase();

      const tableBody = [
          [{ content: 'HOTEL', styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }, hotelName],
          [{ content: 'DIRECCIÓN', styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }, booking.hotels?.location || "República Dominicana"],
          [{ content: 'HABITACIÓN', styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }, roomName],
          [{ content: 'LLEGADA', styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }, checkIn],
          [{ content: 'SALIDA', styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }, checkOut],
          [{ content: 'HUÉSPEDES', styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }, guests],
          [{ content: 'ESTADO', styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }, status],
          [{ content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }, `USD $${Number(booking.total_price).toFixed(2)}`]
      ];

      doc.autoTable({
          startY: y,
          head: [],
          body: tableBody,
          theme: 'grid',
          styles: { 
            fontSize: 11, 
            cellPadding: 4,
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          columnStyles: { 
            0: { width: 50, textColor: [30, 58, 138] },
            1: { textColor: [50, 50, 50] }
          }
      });

      // --- FOOTER & DISCLAIMER ---
      const pageHeight = doc.internal.pageSize.height;
      y = doc.lastAutoTable.finalY + 30;

      // Simulated QR Box
      doc.setDrawColor(0, 0, 0);
      doc.rect(170, pageHeight - 50, 30, 30);
      doc.setFontSize(8);
      doc.text("Escanear para", 185, pageHeight - 53, { align: 'center' });
      doc.text("Validar", 185, pageHeight - 17, { align: 'center' });

      // Legal Text
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const legalText = "IMPORTANTE: Al realizar el check-in debe presentar este voucher junto con su documento de identidad. Las solicitudes especiales están sujetas a disponibilidad.";
      const splitLegal = doc.splitTextToSize(legalText, 140);
      doc.text(splitLegal, 14, pageHeight - 40);

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Aliun Travels SRL | Santo Domingo, República Dominicana", 105, pageHeight - 10, { align: 'center' });

      return doc;
};