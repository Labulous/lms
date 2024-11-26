import React, { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { mockClients } from '../../data/mockClientsData';
import { getCases } from '../../data/mockCasesData';
import { InvoiceItem } from '../../data/mockInvoiceData';
import { generateInvoice } from '../../services/invoiceService';
import InvoicePreview from './InvoicePreview';

const defaultItem: InvoiceItem = {
  id: Date.now().toString(),
  description: '',
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0
};

const InvoiceForm: React.FC = () => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ ...defaultItem }]); // Initialize with one item
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Get client's cases
  const clientCases = selectedClientId
    ? getCases.filter(c => c.clientId === selectedClientId)
    : [];

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };
    setItems([...items, newItem]);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index] };
    
    if (field === 'quantity' || field === 'unitPrice') {
      item[field] = Number(value);
      item.totalPrice = item.quantity * item.unitPrice;
    } else {
      item[field as 'description'] = value as string;
    }
    
    updatedItems[index] = item;
    setItems(updatedItems);
  };

  const handleCaseSelect = (index: number, caseId: string) => {
    const selectedCase = getCases().find(c => c.id === caseId);
    if (selectedCase) {
      handleItemChange(index, 'description', `${selectedCase.caseType} - ${selectedCase.patientName}`);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) { // Prevent removing the last item
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handlePreview = () => {
    if (!selectedClientId || items.length === 0) {
      alert('Please select a client and add at least one item');
      return;
    }
    setShowPreview(true);
  };

  const handleSave = () => {
    try {
      const invoice = generateInvoice(selectedClientId, items, discount, discountType, tax, notes);
      console.log('Generated invoice:', invoice);
      // Here you would typically save the invoice to your backend
      alert('Invoice saved successfully!');
      // Reset form
      setSelectedClientId('');
      setItems([{ ...defaultItem }]); // Reset to one default item
      setDiscount(0);
      setTax(0);
      setNotes('');
      setShowPreview(false);
    } catch (error) {
      alert('Error saving invoice: ' + (error as Error).message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Generate Invoice</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Client</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Select a client</option>
            {mockClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.clientName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>
          
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 mb-4 items-start">
              {clientCases.length > 0 && (
                <div className="col-span-12 sm:col-span-4">
                  <select
                    onChange={(e) => handleCaseSelect(index, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a case</option>
                    {clientCases.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.caseType} - {c.patientName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-span-12 sm:col-span-3">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  min="1"
                  placeholder="Quantity"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Unit Price"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="col-span-10 sm:col-span-2">
                <div className="py-2 px-3 bg-gray-50 rounded-md text-right">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-600 hover:text-red-800 p-2"
                  disabled={items.length === 1} // Disable if it's the last item
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="flex-1 rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                className="rounded-r-md border-l-0 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="percentage">%</option>
                <option value="fixed">$</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Tax (%)</label>
            <input
              type="number"
              value={tax}
              onChange={(e) => setTax(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handlePreview}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Save Invoice
          </button>
        </div>
      </div>

      {showPreview && (
        <InvoicePreview
          clientId={selectedClientId}
          items={items}
          discount={discount}
          discountType={discountType}
          tax={tax}
          notes={notes}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default InvoiceForm;