import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mario_token');
    if (token) {
      api.me().then(setUser).catch(() => {
        localStorage.removeItem('mario_token');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const data = await api.login({ username, password });
    localStorage.setItem('mario_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password, avatar) => {
    const data = await api.register({ username, email, password, avatar });
    localStorage.setItem('mario_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.logout(); } catch {}
    localStorage.removeItem('mario_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
