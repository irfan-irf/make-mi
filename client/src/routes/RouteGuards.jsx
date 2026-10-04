import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { PageSpinner } from '../components/Feedback.jsx';

export function ProtectedRoute() {
  const { authReady, isAuthenticated } = useAuth();
  const location = useLocation();
  if (!authReady) return <PageSpinner label="Checking your account…" />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

export function AdminRoute() {
  const { authReady, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const notified = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || isAdmin) notified.current = false;
    if (authReady && isAuthenticated && !isAdmin && !notified.current) {
      notified.current = true;
      toast.error('Admin access is required for that page.');
    }
  }, [authReady, isAuthenticated, isAdmin, location.pathname]);
  if (!authReady) return <PageSpinner label="Checking your account…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
