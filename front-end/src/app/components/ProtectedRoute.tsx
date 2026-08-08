import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './PageLoader';

export function ProtectedRoute() {
  const { user, appUser, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!appUser) {
    return <PageLoader />;
  }

  if (appUser.role_id === 5) {
    return <Navigate to="/provider/dashboard" replace />;
  }

  if (appUser.role_id !== 4) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}