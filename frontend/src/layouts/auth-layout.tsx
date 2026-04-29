import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../contexts/auth-context';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      <Outlet />
    </div>
  );
}
