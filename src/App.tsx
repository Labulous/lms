import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Cases from "./pages/Cases";
import Shipping from "./pages/Shipping";
import Clients from "./pages/Clients";
import Settings from "./pages/Settings";
import InvoicesPage from "./pages/invoices";
import Reports from "./pages/Reports";
import Inventory from "./pages/Inventory";
import Login from "./pages/Login";
import Layout from "./components/layout/Layout";
import ProductsServices from "./pages/settings/ProductsServices";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Invoices from "./pages/billing/Invoices";
import Payments from "./pages/billing/Payments";
import Balances from "./pages/billing/Balances";
import Statements from "./pages/billing/Statements";
import Adjustments from "./pages/billing/Adjustments";
import SystemSettings from "./pages/settings/system";
import ProductCatalogSettings from "./pages/settings/product-catalog";
import CaseWorkflowSettings from "./pages/settings/case-workflow";
import WorkingTagsSettings from "./pages/settings/working-tags-page";
import PrintPreview from "./pages/PrintPreview";

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Home />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/*"
            element={
              <ProtectedRoute
                requiredRole={["admin", "technician", "super_admin"]}
              >
                <Layout>
                  <Cases />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipping/*"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <Layout>
                  <Shipping />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/*"
            element={
              <ProtectedRoute
                requiredRole={["admin", "technician", "super_admin"]}
              >
                <Layout>
                  <Clients />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/*"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <Layout>
                  <Inventory />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/*"
            element={
              <ProtectedRoute requiredRole={["super_admin"]}>
                <Routes>
                  <Route path="system" element={<SystemSettings />} />
                  <Route
                    path="product-catalog"
                    element={<ProductCatalogSettings />}
                  />
                  <Route
                    path="case-workflow"
                    element={<CaseWorkflowSettings />}
                  />
                  <Route
                    path="working-tags"
                    element={<WorkingTagsSettings />}
                  />
                  <Route
                    path="products-services"
                    element={<ProductsServices />}
                  />
                  <Route path="*" element={<Settings />} />
                </Routes>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices/*"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <Layout>
                  <InvoicesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/*"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products-services/*"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <Layout>
                  <ProductsServices />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Billing Routes */}
          <Route
            path="/billing/invoices"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <Layout>
                  <Invoices />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/payments"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <Layout>
                  <Payments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/balance"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <Layout>
                  <Balances />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/statements"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <Layout>
                  <Statements />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/adjustments"
            element={
              <ProtectedRoute requiredRole={["admin", "super_admin"]}>
                <Layout>
                  <Adjustments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/print-preview" element={<PrintPreview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    </ErrorBoundary>
  );
};

export default App;
