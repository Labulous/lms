import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvoiceList from '@/components/billing/InvoiceList';

const Invoices = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Invoices</h1>
        <Button
          onClick={() => {/* TODO: Open new invoice modal */}}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <InvoiceList />
    </div>
  );
};

export default Invoices;
