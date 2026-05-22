import React from 'react';
import { Badge } from '@/components/ui/badge';
import { isAfter, addHours, differenceInHours } from 'date-fns';

const ExpiryBadge = ({ createdAt, validUntil, status }) => {
  // Normalize dates
  const createdDate = new Date(createdAt);
  const validDate = validUntil ? new Date(validUntil) : addHours(createdDate, 24);
  const now = new Date();

  // Status-based logic (override expiration if status is final)
  if (status === 'paid' || status === 'booked') {
    return <Badge className="bg-green-600 hover:bg-green-700">Confirmada</Badge>;
  }
  if (status === 'cancelled') {
    return <Badge variant="destructive">Cancelada</Badge>;
  }
  if (status === 'contacted') {
    return <Badge className="bg-blue-600 hover:bg-blue-700">Contactada</Badge>;
  }

  // Time-based logic for pending/active quotes
  const isExpired = isAfter(now, validDate);
  const hoursLeft = differenceInHours(validDate, now);

  if (isExpired) {
    return <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Vencida</Badge>;
  }

  if (hoursLeft < 4) {
    return <Badge className="bg-orange-500 hover:bg-orange-600">Por Vencer ({hoursLeft}h)</Badge>;
  }

  return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Activa</Badge>;
};

export default ExpiryBadge;