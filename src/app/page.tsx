import React from 'react';
import { Package, AlertTriangle, CheckSquare } from 'lucide-react';
import Layout from '../components/layout/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <Package className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold">Recent Orders</h2>
            </div>
            <p className="text-gray-600">No recent orders</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-secondary mr-2" />
              <h2 className="text-xl font-semibold">Inventory Alerts</h2>
            </div>
            <p className="text-gray-600">No alerts</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <CheckSquare className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold">Pending Tasks</h2>
            </div>
            <p className="text-gray-600">No pending tasks</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}