import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';

export function ProtectedRoute() {
  const idToken = useAppSelector((state) => state.auth.idToken);

  if (!idToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
