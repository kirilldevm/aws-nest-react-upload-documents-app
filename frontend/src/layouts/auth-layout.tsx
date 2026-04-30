import { Navigate, Outlet } from 'react-router';
import Header from '../components/header';
import { useAuth } from '../contexts/auth-context';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <Header />
      <Outlet />
    </div>
  );
}
