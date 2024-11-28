import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import ProtectedRoute from './components/auth/ProtectedRoute';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/cases/*" element={
            <ProtectedRoute requiredRole={['admin', 'technician']}>
              <Layout>
                <Cases />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/shipping/*" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Shipping />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/clients/*" element={
            <ProtectedRoute requiredRole={['admin', 'technician']}>
              <Layout>
                <Clients />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/client-activity" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <ClientActivity />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/inventory/*" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Inventory />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings/*" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/billing/*" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Billing />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports/*" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/products-services/*" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <ProductsServices />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    </ErrorBoundary>
  );
};

export default App;