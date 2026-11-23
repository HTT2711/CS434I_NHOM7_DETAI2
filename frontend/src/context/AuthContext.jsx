import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    () => sessionStorage.getItem('token') || localStorage.getItem('token') || null
  );
  const [user, setUser] = useState(() => {
    const cached = sessionStorage.getItem('user') || localStorage.getItem('user');
    try {
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.getMe();
        if (res.success) {
          setUser(res.data);
          sessionStorage.setItem('user', JSON.stringify(res.data));
          localStorage.setItem('user', JSON.stringify(res.data));
        } else {
          logout();
        }
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // Đồng bộ đa tab: Chỉ đồng bộ nếu tab hiện tại chưa có phiên làm việc riêng trong sessionStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        const sessionToken = sessionStorage.getItem('token');
        if (!sessionToken) {
          const updatedToken = localStorage.getItem('token');
          setToken(updatedToken);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (username, password) => {
    const res = await authApi.login({ username, password });
    if (res.success) {
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.message);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
