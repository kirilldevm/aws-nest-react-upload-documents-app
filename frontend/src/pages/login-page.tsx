import { useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../contexts/auth-context';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (isAuthenticated) {
    return <Navigate to='/documents' replace />;
  }

  return <div className=''></div>;
}
