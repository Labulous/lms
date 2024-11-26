import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface ShipmentFormData {
  id: string;
  caseId: string;
  clientName: string;
  shippingProvider: string;
  trackingNumber: string;
  shipmentDate: string;
  expectedDeliveryDate: string;
  status: string;
  notes: string;
}

// Mock function to fetch shipment data (replace with actual API call in a real application)
const fetchShipmentData = async (id: string): Promise<ShipmentFormData> => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock data
  return {
    id,
    caseId: `CASE${id.padStart(3, '0')}`,
    clientName: `Client for CASE${id.padStart(3, '0')}`,
    shippingProvider: 'FedEx',
    trackingNumber: `FDX${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    shipmentDate: '2023-05-20',
    expectedDeliveryDate: '2023-05-25',
    status: 'In Transit',
    notes: 'Initial shipment notes',
  };
};

const EditShipmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<ShipmentFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<ShipmentFormData>>({});

  useEffect(() => {
    const loadShipmentData = async () => {
      if (id) {
        try {
          const data = await fetchShipmentData(id);
          setFormData(data);
        } catch (error) {
          console.error('Error fetching shipment data:', error);
          setErrors({ submit: 'Failed to load shipment data. Please try again.' });
        } finally {
          setLoading(false);
        }
      }
    };

    loadShipmentData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => prevData ? ({
      ...prevData,
      [name]: value,
    }) : null);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ShipmentFormData> = {};
    if (formData) {
      if (!formData.trackingNumber) newErrors.trackingNumber = 'Tracking Number is required';
      if (!formData.status) newErrors.status = 'Status is required';
      if (!formData.expectedDeliveryDate) newErrors.expectedDeliveryDate = 'Expected Delivery Date is required';
    } else {
      newErrors.submit = 'Form data is missing';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && formData) {
      try {
        // Here you would typically make an API call to update the shipment
        console.log('Updating shipment:', formData);
        // Simulating API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        navigate('/shipping');
      } catch (error) {
        console.error('Error updating shipment:', error);
        setErrors({ submit: 'Failed to update shipment. Please try again.' });
      }
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading shipment data...</div>;
  }

  if (!formData) {
    return <div className="text-center mt-8 text-red-600">Failed to load shipment data. Please try again.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Edit Shipment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="caseId" className="block text-sm font-medium text-gray-700">Case ID</label>
          <input
            type="text"
            id="caseId"
            name="caseId"
            value={formData.caseId}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
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
          <input
            type="text"
            id="shippingProvider"
            name="shippingProvider"
            value={formData.shippingProvider}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700">Tracking Number</label>
          <input
            type="text"
            id="trackingNumber"
            name="trackingNumber"
            value={formData.trackingNumber}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.trackingNumber && <p className="mt-1 text-sm text-red-600">{errors.trackingNumber}</p>}
        </div>

        <div>
          <label htmlFor="shipmentDate" className="block text-sm font-medium text-gray-700">Shipment Date</label>
          <input
            type="date"
            id="shipmentDate"
            name="shipmentDate"
            value={formData.shipmentDate}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
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
          {errors.expectedDeliveryDate && <p className="mt-1 text-sm text-red-600">{errors.expectedDeliveryDate}</p>}
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
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
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
            Update Shipment
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditShipmentForm;