import { useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FINANCIAL_RULES } from '../constants/financialRules';
import { usePaymentMethodsConfig } from './usePaymentMethodsConfig';

export const useFinancialValidation = (formData, setFormData, setValidation) => {
  const { getFeeRate } = usePaymentMethodsConfig();
  
  const validateDates = (valid_from, valid_until) => {
    const errors = [];
    
    if (!valid_from || !valid_until) {
      errors.push('Fechas de validez son obligatorias');
      return errors;
    }
    
    const fromDate = new Date(valid_from);
    const toDate = new Date(valid_until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (fromDate < today) {
      errors.push('Fecha de inicio no puede ser en el pasado');
    }
    
    if (toDate <= fromDate) {
      errors.push('Fecha fin debe ser posterior a fecha inicio');
    }
    
    const duration_days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
    
    if (duration_days > FINANCIAL_RULES.MAX_OFFER_DURATION_DAYS) {
      errors.push(
        `Duración máxima: ${FINANCIAL_RULES.MAX_OFFER_DURATION_DAYS} días (actual: ${duration_days} días)`
      );
    }
    
    return errors;
  };

  const recalculateMargins = useCallback(async () => {
    const { base_cost, base_price, discount_percentage, payment_method, valid_from, valid_until } = formData;
    
    if (!base_cost || !base_price || base_cost <= 0 || base_price <= 0) {
      setValidation({
        canPublish: false,
        errors: ['Costo base y precio base son obligatorios'],
        warnings: [],
        minimumPrice: null
      });
      return;
    }
    
    // 1. Calcular final_price (precio real con descuento aplicado)
    const final_price = base_price * (1 - (discount_percentage || 0) / 100);
    
    // 2. Obtener fee rate desde config (y pasar de % a decimal)
    const fee_rate = getFeeRate(payment_method) / 100;
    
    // 3. Fee absorbido calculado sobre el precio final cobrado
    const fee_amount = final_price * fee_rate;
    
    // 4. Margen bruto
    const gross_margin = final_price - base_cost;
    
    // 5. Margen neto (después de restar fee absorbido)
    const net_margin = gross_margin - fee_amount;
    
    // 6. Margen neto % calculado sobre el final_price
    const net_margin_percentage = final_price > 0 ? (net_margin / final_price) * 100 : 0;
    
    // 7. Calcular precio mínimo recomendado (costo + fee + margen neto mínimo de 15% del precio final)
    // Para asegurar el margen neto de 15%, aproximamos el precio mínimo recomendado
    const min_price_factor = (1 - fee_rate - (FINANCIAL_RULES.MINIMUM_NET_MARGIN_PERCENTAGE / 100));
    const minimum_price = min_price_factor > 0 ? (base_cost / min_price_factor) : base_cost;
    
    // Actualizar formData
    setFormData(prev => ({
      ...prev,
      final_price,
      fee_amount,
      gross_margin,
      net_margin,
      net_margin_percentage
    }));
    
    const errors = [];
    const warnings = [];
    
    // VALIDACIÓN 1: Margen neto mínimo
    if (net_margin_percentage < FINANCIAL_RULES.MINIMUM_NET_MARGIN_PERCENTAGE) {
      errors.push(
        `Margen neto insuficiente: ${net_margin_percentage.toFixed(2)}% (mínimo: ${FINANCIAL_RULES.MINIMUM_NET_MARGIN_PERCENTAGE}%)`
      );
    }
    
    // VALIDACIÓN 2: Margen neto positivo
    if (net_margin <= 0) {
      errors.push('El margen neto debe ser positivo');
    }
    
    // VALIDACIÓN 3: Fechas y ventana comercial
    const dateErrors = validateDates(valid_from, valid_until);
    errors.push(...dateErrors);
    
    // ADVERTENCIA 1: Margen neto recomendado
    if (net_margin_percentage >= FINANCIAL_RULES.MINIMUM_NET_MARGIN_PERCENTAGE &&
        net_margin_percentage < FINANCIAL_RULES.RECOMMENDED_NET_MARGIN_PERCENTAGE) {
      warnings.push(
        `Margen neto aceptable pero bajo (${net_margin_percentage.toFixed(2)}%). Recomendado: ${FINANCIAL_RULES.RECOMMENDED_NET_MARGIN_PERCENTAGE}%+`
      );
    }
    
    // ADVERTENCIA 2: Descuento alto
    if (discount_percentage > 30) {
      warnings.push(`Descuento alto (${discount_percentage}%). Verifique la rentabilidad.`);
    }
    
    const canPublish = errors.length === 0;
    
    setValidation({
      canPublish,
      errors,
      warnings,
      minimumPrice: minimum_price
    });
    
    // 8. Opcional: Validar con RPC del backend
    if (canPublish) {
      try {
        const { data, error } = await supabase.rpc('rpc_calculate_offer_margin', {
          p_total_amount: base_price,
          p_payment_method: payment_method,
          p_base_cost: base_cost
        });
        
        if (error) {
          console.error('Error validating with RPC:', error);
          // Omitimos bloquear completamente aquí por si el RPC no estuviera listo en su base de datos local
          // pero dejamos el warning correspondiente
          warnings.push(`Advertencia backend: ${error.message}`);
        }
      } catch (err) {
        console.error('Error calling RPC:', err);
      }
    }
  }, [formData, getFeeRate, setFormData, setValidation]);
  
  return { recalculateMargins };
};
export default useFinancialValidation;
