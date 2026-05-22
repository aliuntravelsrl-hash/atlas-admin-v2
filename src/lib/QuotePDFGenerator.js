import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// 6c. CREAR QuotePDFGenerator.js
export const generateQuotePDF = ({ 
    hotelName, 
    guestName, 
    checkIn, 
    checkOut, 
    adults, 
    children, 
    roomTypeName, 
    totalPrice, 
    id,
    created_at,
    legalDisclaimer 
}) => {
    const doc = new jsPDF();
    const primaryColor = [41, 128, 185]; // Corporate Blue
    
    // --- Header ---
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("Aliun Travels", 14, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Cotización Oficial", 14, 28);

    doc.setFontSize(10);
    const quoteId = id ? id.slice(0, 8).toUpperCase() : 'PRE-COT';
    const dateStr = created_at ? new Date(created_at) : new Date();
    doc.text(`ID: ${quoteId}`, 196, 20, { align: 'right' });
    doc.text(`Fecha: ${format(dateStr, 'dd/MM/yyyy')}`, 196, 28, { align: 'right' });

    // --- Info Grid ---
    let y = 50;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Detalles de la Solicitud", 14, y);
    
    y += 10;
    
    const checkInDate = checkIn ? new Date(checkIn) : new Date();
    const checkOutDate = checkOut ? new Date(checkOut) : new Date();

    const infoData = [
        ["Cliente", guestName || "Huésped"],
        ["Hotel", hotelName || "Hotel Seleccionado"],
        ["Habitación", roomTypeName || "Estándar"],
        ["Fecha Entrada", format(checkInDate, 'dd MMMM yyyy', { locale: es })],
        ["Fecha Salida", format(checkOutDate, 'dd MMMM yyyy', { locale: es })],
        ["Huéspedes", `${adults || 1} Adultos, ${children || 0} Niños`]
    ];

    doc.autoTable({
        startY: y,
        body: infoData,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
    });

    // --- Pricing Box ---
    y = doc.lastAutoTable.finalY + 20;
    
    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(14, y, 182, 35, 3, 3, 'FD');
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Inversión Total Estimada", 105, y + 12, { align: 'center' });
    
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${Number(totalPrice || 0).toFixed(2)} USD`, 105, y + 25, { align: 'center' });

    // --- Terms & Conditions ---
    y += 50;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text("Términos y Condiciones Importantes:", 14, y);
    y += 7;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    const terms = [
        legalDisclaimer ? `• NOTA LEGAL: ${legalDisclaimer}` : "• NOTA LEGAL: Las tarifas están sujetas a disponibilidad.",
        "• Esta cotización es válida por 24 horas y está sujeta a disponibilidad.",
        "• Las tarifas pueden variar sin previo aviso hasta la confirmación de la reserva.",
        "• Para confirmar, se requiere el pago total o parcial según la política del hotel.",
        "• Consulte las políticas de cancelación específicas para su temporada."
    ];
    
    // Split long text
    terms.forEach(term => {
        const splitText = doc.splitTextToSize(term, 180);
        doc.text(splitText, 14, y);
        y += (splitText.length * 5) + 2; 
    });

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(240, 240, 240);
    doc.rect(0, pageHeight - 30, 210, 30, 'F');
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Aliun Travels SRL | RNC: 132-84953-2", 105, pageHeight - 20, { align: 'center' });
    doc.text("Ave 27 de Febrero, Santo Domingo | info@aliuntravelsrl.com | +1 (809) 609-3500", 105, pageHeight - 15, { align: 'center' });
    
    return doc;
};