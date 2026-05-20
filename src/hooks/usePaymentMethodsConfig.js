import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const usePaymentMethodsConfig = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('payment_methods_config')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      
      setPaymentMethods(data || []);
    } catch (err) {
      console.error('Error loading payment methods:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const getMethodConfig = (methodCode) => {
    return paymentMethods.find(m => m.method_code === methodCode);
  };

  const getFeeRate = (methodCode) => {
    const method = getMethodConfig(methodCode);
    return method ? method.fee_percentage : 0;
  };

  const isAbsorbed = (methodCode) => {
    const method = getMethodConfig(methodCode);
    return method ? method.is_fee_absorbed : false;
  };

  return {
    paymentMethods,
    loading,
    error,
    getMethodConfig,
    getFeeRate,
    isAbsorbed
  };
};
