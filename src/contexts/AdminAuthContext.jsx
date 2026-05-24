import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const storedUser = localStorage.getItem('aliun_admin_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Optional: Check if session is expired (e.g., > 24 hours)
        const loginTime = parsedUser.loginTime || 0;
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const now = Date.now();

        if (now - loginTime > ONE_DAY) {
          console.warn('⚠️ Session expired, clearing local storage');
          localStorage.removeItem('aliun_admin_user');
          setUser(null);
        } else {
          console.log('✅ Session restored for:', parsedUser.email);
          setUser(parsedUser);
        }
      } catch (e) {
        console.error("Error parsing stored user", e);
        localStorage.removeItem('aliun_admin_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log(`🔐 Attempting login for: ${email}`);
    
    try {
      // 1. Fetch user from Supabase
      const { data: userData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !userData) {
        console.error('❌ Login Failed: User not found or DB error', error);
        return { success: false, error: 'Usuario no encontrado' };
      }

      // 2. Check if active
      if (userData.is_active === false) {
        console.warn(`⛔ Login Blocked: Account ${email} is inactive`);
        return { success: false, error: 'Cuenta desactivada. Contacte al administrador.' };
      }

      // 3. Validate Password (using plain text comparison for this specific demo environment)
      const isValidPassword = (password === userData.password_hash);

      if (!isValidPassword) {
        console.warn('⚠️ Login Failed: Invalid password');
        return { success: false, error: 'Credenciales inválidas' };
      }

      // 4. Successful Login
      const sessionUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        loginTime: Date.now(),
        lastLoginISO: new Date().toISOString()
      };

      console.log('🎉 Login Successful:', sessionUser.email);
      setUser(sessionUser);
      localStorage.setItem('aliun_admin_user', JSON.stringify(sessionUser));
      
      return { success: true };

    } catch (err) {
      console.error('💥 Critical Login Error:', err);
      return { success: false, error: 'Error del servidor al intentar ingresar' };
    }
  };

  const logout = () => {
    console.log('👋 Logging out');
    setUser(null);
    localStorage.removeItem('aliun_admin_user');
  };

  return (
    <AdminAuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
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
