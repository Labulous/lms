import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShipmentFormData {
  caseId: string;
  clientName: string;
  shippingProvider: string;
  trackingNumber: string;
  shipmentDate: string;
  expectedDeliveryDate: string;
  status: string;
  notes: string;
}

const AddShipmentForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ShipmentFormData>({
    caseId: '',
    clientName: '',
    shippingProvider: '',
    trackingNumber: '',
    shipmentDate: '',
    expectedDeliveryDate: '',
    status: 'Pending',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<ShipmentFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  useEffect(() => {
    // Simulating auto-fill of client name based on Case ID
    // In a real application, this would be an API call
    if (formData.caseId) {
      setFormData((prevData) => ({
        ...prevData,
        clientName: `Client for ${formData.caseId}`,
      }));
    }
  }, [formData.caseId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ShipmentFormData> = {};
    if (!formData.caseId) newErrors.caseId = 'Case ID is required';
    if (!formData.shippingProvider) newErrors.shippingProvider = 'Shipping Provider is required';
    if (!formData.shipmentDate) newErrors.shipmentDate = 'Shipment Date is required';
    if (!formData.status) newErrors.status = 'Status is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        // Here you would typically make an API call to save the new shipment
        console.log('Submitting shipment:', formData);
        // Simulating API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        navigate('/shipping');
      } catch (error) {
        console.error('Error submitting shipment:', error);
        setErrors({ submit: 'Failed to submit shipment. Please try again.' });
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Add New Shipment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="caseId" className="block text-sm font-medium text-gray-700">Case ID</label>
          <input
            type="text"
            id="caseId"
            name="caseId"
            value={formData.caseId}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.caseId && <p className="mt-1 text-sm text-red-600">{errors.caseId}</p>}
        </div>

        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name</label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            value={formData.clientName}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="shippingProvider" className="block text-sm font-medium text-gray-700">Shipping Provider</label>
          <select
            id="shippingProvider"
            name="shippingProvider"
            value={formData.shippingProvider}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select a provider</option>
            <option value="FedEx">FedEx</option>
            <option value="UPS">UPS</option>
            <option value="DHL">DHL</option>
          </select>
          {errors.shippingProvider && <p className="mt-1 text-sm text-red-600">{errors.shippingProvider}</p>}
        </div>

        <div>
          <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700">Tracking Number (optional)</label>
          <input
            type="text"
            id="trackingNumber"
            name="trackingNumber"
            value={formData.trackingNumber}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="shipmentDate" className="block text-sm font-medium text-gray-700">Shipment Date</label>
          <input
            type="date"
            id="shipmentDate"
            name="shipmentDate"
            value={formData.shipmentDate}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.shipmentDate && <p className="mt-1 text-sm text-red-600">{errors.shipmentDate}</p>}
        </div>

        <div>
          <label htmlFor="expectedDeliveryDate" className="block text-sm font-medium text-gray-700">Expected Delivery Date</label>
          <input
            type="date"
            id="expectedDeliveryDate"
            name="expectedDeliveryDate"
            value={formData.expectedDeliveryDate}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="Pending">Pending</option>
            <option value="Shipped">Shipped</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
          </select>
          {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          ></textarea>
        </div>

        {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/shipping')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Shipment
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddShipmentForm;