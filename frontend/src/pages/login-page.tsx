import { Navigate } from 'react-router';
import { useAuth } from '../contexts/auth-context';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to='/documents' replace />;
  }

  return <div className=''></div>;
}
