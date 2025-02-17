import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import InvoiceList from "@/components/billing/InvoiceList";

const InvoicesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Routes>
        <Route
          index
          element={
            <React.Suspense fallback={<div>Loading invoice list...</div>}>
              <InvoiceList />
            </React.Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/invoices" replace />} />
      </Routes>
    </div>
  );
};

export default InvoicesPage;
