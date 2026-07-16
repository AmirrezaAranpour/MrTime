import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types/api';

interface Props {
  role?: Role;
  redirectTo: string;
}

export default function ProtectedRoute({ role, redirectTo }: Props) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;
  if (role && user?.role !== role) return <Navigate to={redirectTo} replace />;

  return <Outlet />;
}
