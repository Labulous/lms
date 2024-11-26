import React from 'react';
import { Routes, Route } from 'react-router-dom';
import InventoryList from '../components/inventory/InventoryList';
import AddInventoryItemForm from '../components/inventory/AddInventoryItemForm';
import EditInventoryItemForm from '../components/inventory/EditInventoryItemForm';
import ItemDetails from '../components/inventory/ItemDetails';

const Inventory: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Inventory Management</h1>
      <Routes>
        <Route index element={<InventoryList />} />
        <Route path="add" element={<AddInventoryItemForm />} />
        <Route path="edit/:id" element={<EditInventoryItemForm />} />
        <Route path=":id" element={<ItemDetails />} />
      </Routes>
    </div>
  );
};

export default Inventory;