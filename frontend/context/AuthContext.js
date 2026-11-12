'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  // true cuando ya se leyó la sesión guardada: evita mandar al login al recargar el panel
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('admin-token');
    const savedUser = localStorage.getItem('admin-username');
    if (savedToken) { setToken(savedToken); setUsername(savedUser); }
    setReady(true);
  }, []);

  const login = (tkn, user) => {
    setToken(tkn);
    setUsername(user);
    localStorage.setItem('admin-token', tkn);
    localStorage.setItem('admin-username', user);
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-username');
  };

  return (
    <AuthContext.Provider value={{ token, username, isAuthenticated: !!token, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
