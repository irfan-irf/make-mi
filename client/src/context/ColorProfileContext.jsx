import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import api, { responseData } from '../services/api.js';

const ColorProfileContext = createContext(null);
export function ColorProfileProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [colorProfile, setColorProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!isAuthenticated) { setColorProfile(null); setLoading(false); return undefined; }
    let active = true;
    setLoading(true);
    api.get('/users/color-profile').then((res) => { if (active) setColorProfile(responseData(res)); }).catch(() => { if (active) setColorProfile(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated]);
  const value = useMemo(() => ({ colorProfile, setColorProfile, loading }), [colorProfile, loading]);
  return <ColorProfileContext.Provider value={value}>{children}</ColorProfileContext.Provider>;
}
export function useColorProfile() {
  const value = useContext(ColorProfileContext);
  if (!value) throw new Error('useColorProfile must be used within ColorProfileProvider');
  return value;
}
