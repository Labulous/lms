import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Cases from './pages/Cases';
import Shipping from './pages/Shipping';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import Layout from './components/layout/Layout';
import ClientActivity from './pages/ClientActivity';
import ProductsServices from './pages/settings/ProductsServices';
import { isAuthenticated, getCurrentUser } from './services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuth = isAuthenticated();
  const currentUser = getCurrentUser();

  React.useEffect(() => {
    if (!isAuth) {
      console.log('[ProtectedRoute] Not authenticated, redirecting to login');
      navigate('/login', { replace: true });
    } else if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
      console.log('[ProtectedRoute] Unauthorized role, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [isAuth, currentUser, allowedRoles, navigate]);

  if (!isAuth) {
    return null;
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return null;
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases/*"
          element={
            <ProtectedRoute allowedRoles={['admin', 'technician']}>
              <Cases />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipping/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Shipping />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Clients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-activity"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClientActivity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/products"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProductsServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;