import React from 'react';
import { Link } from 'react-router-dom';

interface Doctor {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface ClientData {
  id: string;
  clientName: string;
  contactName: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  clinicRegistrationNumber: string;
  notes: string;
  doctors: Doctor[];
}

interface ClientDetailsProps {
  client: ClientData | null;
  onEdit: () => void;
  onDelete: () => void;
  loading: boolean;
  error: string | null;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onEdit, onDelete, loading, error }) => {
  console.log('ClientDetails component rendering with props:', { client, loading, error });

  if (loading) {
    return <div className="text-center py-4">Loading client details...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  if (!client) {
    console.log('No client data available in ClientDetails');
    return <div className="text-center py-4">No client data available. Please try again.</div>;
  }

  console.log('Rendering client details:', client);

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {/* Rest of the component remains the same */}
    </div>
  );
};

export default ClientDetails;