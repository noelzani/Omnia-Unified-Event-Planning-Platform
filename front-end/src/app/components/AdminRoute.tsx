import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import { PageLoader } from "./PageLoader";

export function AdminRoute() {
  const { user, appUser, loading } = useAuth();

  if (loading || (user && !appUser)) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (appUser.role_id !== 6) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
