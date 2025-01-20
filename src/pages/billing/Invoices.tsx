import React from 'react';
import InvoiceList from '@/components/billing/InvoiceList';

const Invoices = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Invoices</h1>
      </div>

      <InvoiceList />
    </div>
  );
};

export default Invoices;
