import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './PageLoader';

export function ProviderRoute() {
  const { user, appUser, loading } = useAuth();

  if (loading || (user && !appUser)) {
    return <PageLoader />;
  }

  // not logged in -> provider login, not user login
  if (!user) {
    return <Navigate to="/provider/login" replace />;
  }

  if (appUser.role_id === 4) return <Navigate to="/dashboard" replace />;
  if (appUser.role_id === 6) return <Navigate to="/admin" replace />;
  if (appUser.role_id !== 5) return <Navigate to="/provider/login" replace />;

  return <Outlet />;
}