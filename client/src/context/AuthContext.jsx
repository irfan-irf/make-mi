import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { responseData, setUnauthorizedHandler } from '../services/api.js';

const AuthContext = createContext(null);
const readUser = () => { try { return JSON.parse(localStorage.getItem('authUser') || 'null'); } catch { return null; } };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();

  const logout = useCallback(({ notify = false, redirect = true } = {}) => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    setUser(null);
    if (notify) toast('You have been signed out.');
    if (redirect) navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    setUnauthorizedHandler(() => logout({ notify: true }));
    const token = localStorage.getItem('accessToken');
    if (!token) { setAuthReady(true); return undefined; }
    api.get('/auth/me')
      .then((response) => {
        const currentUser = responseData(response)?.user;
        if (!currentUser) throw new Error('Could not load your account.');
        localStorage.setItem('authUser', JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch(() => { localStorage.removeItem('accessToken'); localStorage.removeItem('authUser'); setUser(null); })
      .finally(() => setAuthReady(true));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const acceptSession = useCallback((payload) => {
    localStorage.setItem('accessToken', payload.token);
    localStorage.setItem('authUser', JSON.stringify(payload.user));
    setUser(payload.user);
  }, []);

  const login = useCallback(async (credentials) => {
    const payload = responseData(await api.post('/auth/login', credentials));
    acceptSession(payload);
    return payload.user;
  }, [acceptSession]);

  const register = useCallback(async (details) => {
    const payload = responseData(await api.post('/auth/register', details));
    acceptSession(payload);
    return payload.user;
  }, [acceptSession]);

  const value = useMemo(() => ({ user, authReady, isAuthenticated: Boolean(user), isAdmin: user?.role === 'admin', login, register, logout, setUser }), [user, authReady, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
