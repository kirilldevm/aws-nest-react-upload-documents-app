import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router';
import { AuthProvider } from './contexts/auth-context';
import './index.css';
import AuthLayout from './layouts/auth-layout';
import DocumentsPage from './pages/documents-page';
import LoginPage from './pages/login-page';

const routes = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/documents" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/documents',
    element: <AuthLayout />,
    children: [{ index: true, element: <DocumentsPage /> }],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={routes} />
    </AuthProvider>
  </StrictMode>,
);
