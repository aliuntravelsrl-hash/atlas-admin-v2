import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurar sesión de localStorage al montar el componente
    const storedUser = localStorage.getItem('aliun_admin_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Expirar sesión si supera las 24 horas
        const loginTime = parsedUser.loginTime || 0;
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const now = Date.now();

        if (now - loginTime > ONE_DAY) {
          console.warn('⚠️ Admin session expired, clearing storage');
          localStorage.removeItem('aliun_admin_user');
          setUser(null);
        } else {
          console.log('✅ Admin session restored for:', parsedUser.email);
          setUser(parsedUser);
        }
      } catch (e) {
        console.error("Error parsing stored admin user", e);
        localStorage.removeItem('aliun_admin_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log(`🔐 Attempting secure admin login for: ${email}`);
    
    try {
      // 1. Invocar la función RPC verify_admin_user en la base de datos (seguro, sin RLS anon bypass)
      const { data: authResult, error } = await supabase
        .rpc('verify_admin_user', {
          p_email: email,
          p_password: password
        });

      if (error) {
        console.error('❌ Login Failed: RPC execution error', error);
        return { success: false, error: 'Error al conectar con el servidor de autenticación' };
      }

      if (!authResult || !authResult.success) {
        console.warn('⚠️ Login Failed:', authResult?.error || 'Credenciales inválidas');
        return { success: false, error: authResult?.error || 'Credenciales inválidas' };
      }

      // 2. Inicio de sesión exitoso
      const userData = authResult.user;
      const sessionUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        loginTime: Date.now(),
        lastLoginISO: new Date().toISOString()
      };

      console.log('🎉 Admin Login Successful:', sessionUser.email);
      setUser(sessionUser);
      localStorage.setItem('aliun_admin_user', JSON.stringify(sessionUser));
      
      return { success: true };

    } catch (err) {
      console.error('💥 Critical Login Error:', err);
      return { success: false, error: 'Error del servidor al intentar ingresar' };
    }
  };

  const logout = () => {
    console.log('👋 Admin logging out');
    setUser(null);
    localStorage.removeItem('aliun_admin_user');
  };

  // Exponer isAdmin de forma reactiva y en minúsculas para mayor robustez
  const isAdmin = user?.role ? ['admin', 'super_admin'].includes(user.role.toLowerCase()) : false;

  return (
    <AdminAuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user, isAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
