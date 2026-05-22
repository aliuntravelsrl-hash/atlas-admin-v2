import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const generatePDF = ({ order, bookingDetails, cartItems, excursionsTotal, baseStayTotal, totalPrice, t, i18n, pricing }) => {
  const doc = new jsPDF();
  const lang = i18n.language;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.setFont('helvetica', 'bold');
  doc.text("Aliun Travels", 14, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Voucher de Cotización", 14, 28);
  
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  // Order Details
  doc.setFontSize(10);
  doc.text(`${t('voucher.quoteId', { lng: lang })}: ${order.id.slice(0, 8).toUpperCase()}`, 196, 18, { align: 'right' });
  doc.text(`${t('voucher.date', { lng: lang })}: ${format(new Date(order.created_at), 'dd/MM/yyyy')}`, 196, 24, { align: 'right' });

  // Client Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t('voucher.clientInfo', { lng: lang }), 14, 45);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${t('contact.fullName', { lng: lang })}: ${order.user_name}`, 14, 52);
  doc.text(`${t('contact.email', { lng: lang })}: ${order.user_email}`, 14, 58);
  if(order.user_phone) {
    doc.text(`${t('contact.phone', { lng: lang })}: ${order.user_phone}`, 14, 64);
  }

  // Booking Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t('voucher.bookingSummary', { lng: lang }), 14, 75);

  const nights = differenceInDays(new Date(bookingDetails.dateRange.to), new Date(bookingDetails.dateRange.from));
  const guestsLine = `${bookingDetails.adults} ${t('voucher.adults', { lng: lang })}` + (bookingDetails.children > 0 ? `, ${bookingDetails.children} ${t('voucher.children', { lng: lang })}` : '');
  const childrenAgesLine = bookingDetails.children > 0 ? `(${t('voucher.childAges', { lng: lang })}: ${bookingDetails.childrenAges.join(', ')})` : '';

  const bookingData = [
    [t('voucher.hotel', { lng: lang }), bookingDetails.hotelName],
    [t('voucher.checkin', { lng: lang }), format(new Date(bookingDetails.dateRange.from), 'dd MMM yyyy', { locale: es })],
    [t('voucher.checkout', { lng: lang }), format(new Date(bookingDetails.dateRange.to), 'dd MMM yyyy', { locale: es })],
    [t('voucher.nights', { lng: lang }), nights.toString()],
    [t('voucher.guests', { lng: lang }), `${guestsLine} ${childrenAgesLine}`],
    [t('voucher.roomType', { lng: lang }), bookingDetails.roomType.name],
  ];

  doc.autoTable({
    startY: 80,
    head: [[t('voucher.concept', { lng: lang }), t('voucher.details', { lng: lang })]],
    body: bookingData,
    theme: 'striped',
    headStyles: { fillColor: [33, 150, 243] },
  });

  // Financial Breakdown
  let finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t('voucher.priceDetails', { lng: lang }), 14, finalY);

  const bodyData = [];
  bodyData.push([t('voucher.baseStay', { lng: lang }), `$${baseStayTotal.toFixed(2)}`]);
  
  if (cartItems.length > 0) {
    bodyData.push([t('voucher.excursionsTotal', { lng: lang }), `$${excursionsTotal.toFixed(2)}`]);
    cartItems.forEach(item => {
        const excursionDetails = pricing.excursions[item.id];
        bodyData.push([`  - ${excursionDetails?.name || item.name}`, '']);
    });
  }

  doc.autoTable({
    startY: finalY + 5,
    head: [[t('voucher.description', { lng: lang }), t('voucher.price', { lng: lang })]],
    body: bodyData,
    theme: 'grid',
    headStyles: { fillColor: [76, 175, 80] },
    columnStyles: { 1: { halign: 'right' } },
    didParseCell: function (data) {
        if (data.cell.section === 'body' && data.row.index === bodyData.length -1) {
            // No special styling needed for excursions total row
        }
    }
  });

  finalY = doc.lastAutoTable.finalY;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t('voucher.totalAmount', { lng: lang }), 14, finalY + 10);
  doc.text(`$${totalPrice.toFixed(2)}`, 196, finalY + 10, { align: 'right' });
  doc.setFontSize(8);
  doc.text(`(${t('voucher.currency', { lng: lang })})`, 196, finalY + 14, { align: 'right' });


  // Footer Note
  finalY = doc.lastAutoTable.finalY + 30;
  doc.setLineWidth(0.2);
  doc.setDrawColor(180, 180, 180);
  doc.line(14, finalY, 196, finalY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  doc.text(t('voucher.footerNote', { lng: lang }), 105, finalY + 7, { align: 'center', maxWidth: 180 });
  
  doc.save(`cotizacion-${order.id.slice(0, 8)}.pdf`);
};

const differenceInDays = (date1, date2) => {
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
}