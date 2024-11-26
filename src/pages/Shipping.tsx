import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ShippingList from '../components/shipping/ShippingList';
import AddShipmentForm from '../components/shipping/AddShipmentForm';
import EditShipmentForm from '../components/shipping/EditShipmentForm';
import ShipmentDetails from '../components/shipping/ShipmentDetails';
import ShippingProviders from '../components/shipping/ShippingProviders';

const Shipping: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ShippingList />} />
      <Route path="new" element={<AddShipmentForm />} />
      <Route path=":id" element={<ShipmentDetails />} />
      <Route path=":id/edit" element={<EditShipmentForm />} />
      <Route path="providers" element={<ShippingProviders />} />
    </Routes>
  );
};

export default Shipping;