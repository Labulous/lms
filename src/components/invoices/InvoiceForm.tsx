import React, { useState } from "react";
import { PlusCircle, Trash2, Eye } from "lucide-react";
import { generateInvoice } from "../../services/invoiceService";
import { mockClients } from "../../data/mockClientsData";
import { getCases } from "../../data/mockCasesData";
import InvoicePreviewModal from "./InvoicePreviewModal";
import { toast } from "react-hot-toast";
import { InvoiceItem } from "@/data/mockInvoicesData";

interface InvoiceFormItem {
  description: string;
  quantity: number;
  unitPrice: number;
  caseId?: string;
}

interface InvoiceFormData {
  clientId: string;
  items: InvoiceItem[];
  discount?: {
    type: "percentage" | "fixed";
    value: number;
  };
  taxRate: number;
  notes: string;
  paymentTerms: string;
  dueInDays: number;
}

const defaultItem: InvoiceItem = {
  id: "",
  description: "",
  quantity: 1,
  unitPrice: 1,
  totalPrice: 1,
};

const InvoiceForm: React.FC = () => {
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: "",
    items: [{ ...defaultItem }],
    taxRate: 13,
    notes: "Thank you for your business!",
    paymentTerms: "Net 30",
    dueInDays: 30,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get client's cases
  const clientCases = formData.clientId
    ? getCases().filter((c) => c.clientId === formData.clientId)
    : [];

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      clientId: e.target.value,
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceFormItem,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleCaseSelect = (index: number, caseId: string) => {
    const selectedCase = getCases().find((c) => c.id === caseId);
    if (selectedCase) {
      handleItemChange(
        index,
        "description",
        `${selectedCase.caseType} - ${selectedCase.patientName}`
      );
      handleItemChange(index, "caseId", caseId);
    }
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...defaultItem }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleDiscountTypeChange = (type: "percentage" | "fixed") => {
    setFormData((prev) => ({
      ...prev,
      discount: {
        type,
        value: prev.discount?.value || 0,
      },
    }));
  };

  const handleDiscountValueChange = (value: string) => {
    const numValue = parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      discount: {
        type: prev.discount?.type || "percentage",
        value: isNaN(numValue) ? 0 : numValue,
      },
      items: [],
    }));
  };

  const handlePreview = async () => {
    const { clientId, items, discount, taxRate, notes } = formData;

    // Ensure items is an array, even if formData.items is undefined or null
    const result = await generateInvoice(
      clientId, // clientId as a string
      items || [], // Ensure items is at least an empty array if not provided
      discount?.value,
      discount?.type, // Default discount type to "percentage" if not provided
      taxRate || 0, // Default tax to 0 if not provided
      notes // Notes (string or undefined)
    );

    // Handle errors if any
    if ("errors" in result) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    // Set the preview to be shown
    setShowPreview(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { clientId, items, discount, taxRate, notes } = formData;

      // Ensure items is an array, even if formData.items is undefined or null
      const result = await generateInvoice(
        clientId, // clientId as a string
        items || [], // Ensure items is at least an empty array if not provided
        discount?.value,
        discount?.type, // Default discount type to "percentage" if not provided
        taxRate || 0, // Default tax to 0 if not provided
        notes // Notes (string or undefined)
      );

      // Handle errors if any
      if ("errors" in result) {
        toast.error("Please fill in all required fields correctly");
        return;
      }

      // Here you would typically save the invoice
      toast.success("Invoice generated successfully");

      // Reset form
      setFormData({
        clientId: "",
        items: [{ ...defaultItem }],
        taxRate: 13,
        notes: "Thank you for your business!",
        paymentTerms: "Net 30",
        dueInDays: 30,
      });
    } catch (error) {
      toast.error("Failed to generate invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Client
        </label>
        <select
          value={formData.clientId}
          onChange={handleClientChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="">Select a client</option>
          {mockClients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.clientName}
            </option>
          ))}
        </select>
      </div>

      {/* Invoice Items */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Item
          </button>
        </div>

        {formData.items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 items-start">
            {/* Case Selection */}
            {clientCases.length > 0 && (
              <div className="col-span-12 sm:col-span-4">
                <select
                  value={item.caseId || ""}
                  onChange={(e) => handleCaseSelect(index, e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select a case</option>
                  {clientCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.caseType} - {c.patientName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description */}
            <div className="col-span-12 sm:col-span-4">
              <input
                type="text"
                value={item.description}
                onChange={(e) =>
                  handleItemChange(index, "description", e.target.value)
                }
                placeholder="Description"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Quantity */}
            <div className="col-span-6 sm:col-span-2">
              <input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", parseInt(e.target.value))
                }
                min="1"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Unit Price */}
            <div className="col-span-6 sm:col-span-2">
              <input
                type="number"
                value={item.unitPrice}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "unitPrice",
                    parseFloat(e.target.value)
                  )
                }
                min="0"
                step="0.01"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Remove Button */}
            {formData.items.length > 1 && (
              <div className="col-span-12 sm:col-span-1">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Discount and Tax */}
      <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Discount
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <select
              value={formData.discount?.type || "percentage"}
              onChange={(e) =>
                handleDiscountTypeChange(
                  e.target.value as "percentage" | "fixed"
                )
              }
              className="rounded-l-md border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
            >
              <option value="percentage">%</option>
              <option value="fixed">$</option>
            </select>
            <input
              type="number"
              value={formData.discount?.value || ""}
              onChange={(e) => handleDiscountValueChange(e.target.value)}
              min="0"
              step={formData.discount?.type === "percentage" ? "1" : "0.01"}
              max={formData.discount?.type === "percentage" ? "100" : undefined}
              className="block w-full rounded-r-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tax Rate (%)
          </label>
          <input
            type="number"
            value={formData.taxRate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                taxRate: parseFloat(e.target.value),
              }))
            }
            min="0"
            max="100"
            step="0.1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Notes and Terms */}
      <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payment Terms
          </label>
          <select
            value={formData.paymentTerms}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, paymentTerms: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="Net 30">Net 30</option>
            <option value="Net 15">Net 15</option>
            <option value="Due on Receipt">Due on Receipt</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={handlePreview}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isSubmitting ? "Generating..." : "Generate Invoice"}
        </button>
      </div>

      {/* Preview Modal */}
      <InvoicePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        formData={formData}
      />
    </form>
  );
};

export default InvoiceForm;
