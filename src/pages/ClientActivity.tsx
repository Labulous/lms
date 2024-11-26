import React, { useState, useEffect } from 'react';
import { mockClients, Client } from '../data/mockClientsData';
import { getClientSalesData, ClientSalesData } from '../data/mockSalesData';
import ClientSelector from '../components/clients/ClientSelector';
import ClientAccountInfo from '../components/clients/ClientAccountInfo';
import SalesChart from '../components/clients/SalesChart';
import UnitsChart from '../components/clients/UnitsChart';
import MonthlyDataTable from '../components/clients/MonthlyDataTable';

const ClientActivity: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [salesData, setSalesData] = useState<ClientSalesData | null>(null);

  useEffect(() => {
    if (selectedClient) {
      const data = getClientSalesData(selectedClient.id);
      if (data) {
        setSalesData(data);
      }
    }
  }, [selectedClient]);

  const handleClientChange = (clientId: string) => {
    const client = mockClients.find(c => c.id === clientId);
    setSelectedClient(client || null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Client Activity</h1>
      
      <div className="mb-8">
        <ClientSelector
          clients={mockClients}
          selectedClientId={selectedClient?.id || ''}
          onClientChange={handleClientChange}
        />
      </div>

      {selectedClient && salesData && (
        <>
          <div className="mb-8">
            <ClientAccountInfo client={selectedClient} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Monthly Net Sales</h2>
              <SalesChart data={salesData.monthlyData} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Monthly Units Sold</h2>
              <UnitsChart data={salesData.monthlyData} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Monthly Data</h2>
            <MonthlyDataTable data={salesData.monthlyData} />
          </div>
        </>
      )}
    </div>
  );
};

export default ClientActivity;