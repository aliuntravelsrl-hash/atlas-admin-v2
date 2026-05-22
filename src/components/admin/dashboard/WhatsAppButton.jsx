import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = ({ phone, guestName, hotelName, className }) => {
  const handleWhatsAppClick = () => {
    if (!phone) {
      alert("No hay número de teléfono registrado.");
      return;
    }

    // Limpieza básica del teléfono
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Mensaje predefinido
    const message = `Hola ${guestName || 'Cliente'}, te contacto de Aliun Travels sobre tu cotización para ${hotelName || 'tu viaje'}. ¿Tienes alguna duda?`;
    const encodedMessage = encodeURIComponent(message);
    
    // Abrir URL
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={`text-green-600 border-green-200 hover:bg-green-50 ${className}`}
      onClick={handleWhatsAppClick}
      title={phone ? `Contactar a ${phone}` : "Sin teléfono"}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      WhatsApp
    </Button>
  );
};

export default WhatsAppButton;