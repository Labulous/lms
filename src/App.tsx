import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Cases from './pages/Cases';
import Shipping from './pages/Shipping';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import InvoicesPage from './pages/invoices';
import Reports from './pages/Reports';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import Layout from './components/layout/Layout';
import ClientActivity from './pages/ClientActivity';
import ProductsServices from './pages/settings/ProductsServices';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Invoices from './pages/billing/Invoices';
import Payments from './pages/billing/Payments';
import Balances from './pages/billing/Balances';
import Statements from './pages/billing/Statements';
import Adjustments from './pages/billing/Adjustments';

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
          <Route path="/invoices/*" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <InvoicesPage />
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
          {/* Billing Routes */}
          <Route path="/billing/invoices" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Invoices />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/billing/payments" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Payments />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/billing/balance" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Balances />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/billing/statements" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Statements />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/billing/adjustments" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Adjustments />
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