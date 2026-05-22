import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, addHours } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Generador de PDF Industrial para Cotizaciones (Flux E)
 */
export const generateQuotePDF = ({ 
    hotelName, 
    guestName, 
    checkIn, 
    checkOut, 
    adults, 
    children, 
    roomName, 
    roomTypeName,
    totalPrice, 
    id,
    created_at,
    breakdown = []
}) => {
    const doc = new jsPDF();
    const primaryColor = [26, 54, 93]; // Navy Blue Professional
    const accentColor = [220, 38, 38]; // Red for deadlines/warnings

    // --- 1. Header & Branding ---
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text("Aliun Travels", 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Experiencias de Lujo & Confort", 15, 32);

    // Metadata Derecha
    doc.setFontSize(10);
    const quoteId = id ? id.slice(0, 8).toUpperCase() : 'BORRADOR';
    const dateStr = created_at ? new Date(created_at) : new Date();
    const validUntil = addHours(dateStr, 24);

    doc.text("COTIZACIÓN OFICIAL", 195, 20, { align: 'right' });
    doc.text(`Ref: #${quoteId}`, 195, 26, { align: 'right' });
    doc.text(`Emisión: ${format(dateStr, 'dd/MM/yyyy HH:mm')}`, 195, 32, { align: 'right' });

    // --- 2. Validez Warning ---
    doc.setTextColor(...accentColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Válido hasta: ${format(validUntil, 'dd/MM/yyyy HH:mm')} (24 Horas)`, 195, 38, { align: 'right' });

    // --- 3. Información Principal ---
    let y = 60;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Detalles de la Reserva", 15, y);
    
    const infoBody = [
        ["Huésped Principal", guestName || "Cliente"],
        ["Hotel Seleccionado", hotelName || "N/A"],
        ["Tipo de Habitación", roomName || roomTypeName || "Estándar"],
        ["Entrada (Check-in)", format(new Date(checkIn), 'dd MMMM yyyy', { locale: es })],
        ["Salida (Check-out)", format(new Date(checkOut), 'dd MMMM yyyy', { locale: es })],
        ["Ocupación", `${adults} Adultos, ${children} Niños`]
    ];

    doc.autoTable({
        startY: y + 5,
        body: infoBody,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: [245, 245, 245] } }
    });

    // --- 4. Desglose Financiero (Flux E Logic) ---
    y = doc.lastAutoTable.finalY + 15;
    
    if (breakdown && breakdown.length > 0) {
        doc.text("Desglose Diario", 15, y);
        const breakdownData = breakdown.map(day => [
            format(new Date(day.date), 'dd/MM'),
            day.season || "Estándar",
            `$${Number(day.price).toFixed(2)}`
        ]);
        
        doc.autoTable({
            startY: y + 5,
            head: [['Fecha', 'Temporada', 'Precio Diario']],
            body: breakdownData,
            theme: 'plain',
            headStyles: { fillColor: [200, 200, 200], textColor: 50 },
            styles: { fontSize: 9 }
        });
        y = doc.lastAutoTable.finalY + 10;
    }

    // --- 5. Total con QR Simulado ---
    doc.setFillColor(240, 248, 255); // Alice Blue
    doc.roundedRect(120, y, 75, 25, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("TOTAL ESTIMADO (USD)", 157.5, y + 8, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${Number(totalPrice).toFixed(2)}`, 157.5, y + 18, { align: 'center' });

    // QR Placeholder
    doc.setDrawColor(0, 0, 0);
    doc.rect(15, y, 25, 25); 
    doc.setFontSize(6);
    doc.text("SCAN ME", 27.5, y + 23, { align: 'center' });
    doc.setFontSize(8);
    doc.text(quoteId, 27.5, y + 28, { align: 'center' });

    // --- 6. Términos Legales ---
    y += 40;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Términos y Condiciones", 15, y);
    
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const terms = [
        "1. DISPONIBILIDAD: Las tarifas están sujetas a cambios sin previo aviso hasta que la reserva sea confirmada y pagada.",
        "2. PAGOS: Se requiere el pago total o depósito según la política específica de la temporada.",
        "3. CANCELACIONES: Las políticas de cancelación varían por hotel y temporada. Consulte con su agente.",
        "4. RESPONSABILIDAD: Aliun Travels actúa como intermediario. No nos hacemos responsables por cambios de fuerza mayor.",
        "5. IMPUESTOS: Todos los impuestos hoteleros están incluidos."
    ];

    let termY = y + 5;
    terms.forEach(term => {
        const splitText = doc.splitTextToSize(term, 180);
        doc.text(splitText, 15, termY);
        termY += 5 + (splitText.length - 1) * 3;
    });

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, pageHeight - 25, 195, pageHeight - 25);
    
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Aliun Travels SRL | RNC: 132-84953-2 | Santo Domingo, Rep. Dom.", 105, pageHeight - 15, { align: 'center' });
    doc.text("Documento generado electrónicamente desde Bóveda de Producción.", 105, pageHeight - 10, { align: 'center' });

    return doc;
};