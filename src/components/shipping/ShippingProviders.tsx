import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash } from 'lucide-react';
import AddProviderForm from './AddProviderForm';
import EditProviderForm from './EditProviderForm';

interface ShippingProvider {
  id: string;
  name: string;
  contactInfo: string;
  website: string;
}

const ShippingProviders: React.FC = () => {
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ShippingProvider | null>(null);

  useEffect(() => {
    // Mock data - replace with API call in a real application
    const mockProviders: ShippingProvider[] = [
      { id: '1', name: 'FedEx', contactInfo: 'support@fedex.com', website: 'https://www.fedex.com' },
      { id: '2', name: 'UPS', contactInfo: 'support@ups.com', website: 'https://www.ups.com' },
      { id: '3', name: 'DHL', contactInfo: 'support@dhl.com', website: 'https://www.dhl.com' },
    ];
    setProviders(mockProviders);
  }, []);

  const handleAddProvider = (newProvider: Omit<ShippingProvider, 'id'>) => {
    const providerWithId = { ...newProvider, id: Date.now().toString() };
    setProviders([...providers, providerWithId]);
    setIsAddingProvider(false);
  };

  const handleEditProvider = (updatedProvider: ShippingProvider) => {
    setProviders(providers.map(p => p.id === updatedProvider.id ? updatedProvider : p));
    setEditingProvider(null);
  };

  const handleDeleteProvider = (id: string) => {
    if (window.confirm('Are you sure you want to delete this shipping provider?')) {
      setProviders(providers.filter(p => p.id !== id));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Shipping Providers</h2>
        <button
          onClick={() => setIsAddingProvider(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
        >
          <Plus className="mr-2" size={20} />
          Add Provider
        </button>
      </div>

      {isAddingProvider && (
        <AddProviderForm
          onAdd={handleAddProvider}
          onCancel={() => setIsAddingProvider(false)}
        />
      )}

      {editingProvider && (
        <EditProviderForm
          provider={editingProvider}
          onEdit={handleEditProvider}
          onCancel={() => setEditingProvider(null)}
        />
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {providers.map((provider) => (
              <tr key={provider.id}>
                <td className="px-6 py-4 whitespace-nowrap">{provider.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{provider.contactInfo}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">
                    {provider.website}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setEditingProvider(provider)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteProvider(provider.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShippingProviders;