import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Truck } from 'lucide-react';
import { mockShipments, Shipment } from '../../data/mockShippingData';

const ShippingList: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulating API call with setTimeout
    setTimeout(() => {
      setShipments(mockShipments);
      setFilteredShipments(mockShipments);
    }, 500);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = shipments.filter(
      shipment =>
        shipment.caseId.toLowerCase().includes(term) ||
        shipment.clientName.toLowerCase().includes(term) ||
        shipment.trackingNumber.toLowerCase().includes(term)
    );
    setFilteredShipments(filtered);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Shipping Management</h1>
        <div>
          <Link
            to="/shipping/new"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center mr-2"
          >
            <Plus className="mr-2" size={20} />
            Add New Shipment
          </Link>
          <Link
            to="/shipping/providers"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            <Truck className="mr-2" size={20} />
            Manage Providers
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search shipments..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredShipments.map((shipment) => (
              <tr key={shipment.id}>
                <td className="px-6 py-4 whitespace-nowrap">{shipment.caseId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{shipment.clientName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{shipment.shippingProvider}</td>
                <td className="px-6 py-4 whitespace-nowrap">{shipment.trackingNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    shipment.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                    shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                    shipment.status === 'Shipped' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {shipment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={`/shipping/${shipment.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    View
                  </Link>
                  <Link to={`/shipping/${shipment.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShippingList;