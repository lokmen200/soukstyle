'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import api, { setAuthToken } from './api';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = Cookies.get('token') || localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
      api.get('/users/me', { headers: { 'x-auth-token': storedToken } })
        .then((res) => {
          console.log('Fetched User:', res.data);
          setUser(res.data);
        })
        .catch((err) => {
          console.error('Failed to fetch user:', err);
          setToken(null);
          setAuthToken(null);
          Cookies.remove('token');
          localStorage.removeItem('token');
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/users/login', { email, password });
    const { token, user } = response.data;
    setToken(token);
    setUser(user);
    setAuthToken(token);
    Cookies.set('token', token, { expires: 1 });
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    Cookies.remove('token');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);