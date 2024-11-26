import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Edit, ArrowLeft, Printer } from 'lucide-react';
import ShippingLabel from './ShippingLabel';

interface Shipment {
  id: string;
  caseId: string;
  clientName: string;
  clientAddress: string;
  shippingProvider: string;
  trackingNumber: string;
  shipmentDate: string;
  expectedDeliveryDate: string;
  status: string;
  notes: string;
}

// Mock function to fetch shipment data (replace with actual API call in a real application)
const fetchShipmentData = async (id: string): Promise<Shipment> => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock data
  return {
    id,
    caseId: `CASE${id.padStart(3, '0')}`,
    clientName: `Client for CASE${id.padStart(3, '0')}`,
    clientAddress: '123 Client St, City, State 12345',
    shippingProvider: 'FedEx',
    trackingNumber: `FDX${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    shipmentDate: '2023-05-20',
    expectedDeliveryDate: '2023-05-25',
    status: 'In Transit',
    notes: 'This is a sample shipment with mock data.',
  };
};

const labInfo = {
  name: 'Labulous Dental Lab',
  address: '456 Lab Ave, Lab City, Lab State 67890',
};

const ShipmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const loadShipmentData = async () => {
      if (id) {
        try {
          const data = await fetchShipmentData(id);
          setShipment(data);
        } catch (error) {
          console.error('Error fetching shipment data:', error);
          setError('Failed to load shipment data. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    loadShipmentData();
  }, [id]);

  if (loading) {
    return <div className="text-center mt-8">Loading shipment details...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-600">{error}</div>;
  }

  if (!shipment) {
    return <div className="text-center mt-8 text-red-600">Shipment not found.</div>;
  }

  const getTrackingUrl = (provider: string, trackingNumber: string) => {
    switch (provider) {
      case 'FedEx':
        return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
      case 'UPS':
        return `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
      case 'DHL':
        return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
      default:
        return '#';
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/shipping')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Shipments
        </button>
        <div className="space-x-2">
          <Link
            to={`/shipping/${id}/edit`}
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            <Edit className="mr-2" size={20} />
            Edit Shipment
          </Link>
          <button
            onClick={() => setShowLabel(!showLabel)}
            className="flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            <Printer className="mr-2" size={20} />
            {showLabel ? 'Hide Label' : 'Show Label'}
          </button>
        </div>
      </div>

      {showLabel && (
        <div className="mb-8">
          <ShippingLabel shipment={shipment} labInfo={labInfo} />
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">Shipment Details</h2>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {/* ... (keep the existing shipment details code) */}
      </div>
    </div>
  );
};

export default ShipmentDetails;