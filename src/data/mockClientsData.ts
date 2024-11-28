import { v4 as uuidv4 } from 'uuid';

export interface Client {
  id: string;
  accountNumber: string;
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

interface Doctor {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

// Load clients from localStorage or use default data
const loadClients = (): Client[] => {
  const savedClients = localStorage.getItem('clients');
  return savedClients ? JSON.parse(savedClients) : defaultClients;
};

// Save clients to localStorage
const saveClients = (clients: Client[]) => {
  localStorage.setItem('clients', JSON.stringify(clients));
};

// Default mock data
const defaultClients: Client[] = [
  {
    id: '1',
    accountNumber: '240001',
    clientName: 'Smile Dental Clinic',
    contactName: 'Dr. Alice Johnson',
    phone: '(555) 123-4567',
    email: 'alice@smiledentalclinic.com',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
    },
    clinicRegistrationNumber: 'DC12345',
    notes: 'Prefers email communication',
    doctors: [
      {
        name: 'Dr. Alice Johnson',
        phone: '(555) 123-4567',
        email: 'alice@smiledentalclinic.com',
        notes: 'Specializes in cosmetic dentistry',
      },
      {
        name: 'Dr. Bob Smith',
        phone: '(555) 987-6543',
        email: 'bob@smiledentalclinic.com',
        notes: 'Orthodontics specialist',
      },
    ],
  },
  {
    id: '2',
    accountNumber: '240002',
    clientName: 'Bright Smile Center',
    contactName: 'Dr. Carol White',
    phone: '(555) 234-5678',
    email: 'carol@brightsmilecenter.com',
    address: {
      street: '456 Oak Ave',
      city: 'Somewhere',
      state: 'NY',
      zipCode: '67890',
    },
    clinicRegistrationNumber: 'DC67890',
    notes: 'Prefers phone communication',
    doctors: [
      {
        name: 'Dr. Carol White',
        phone: '(555) 234-5678',
        email: 'carol@brightsmilecenter.com',
        notes: 'Specializes in implants',
      },
      {
        name: 'Dr. David Lee',
        phone: '(555) 876-5432',
        email: 'david@brightsmilecenter.com',
        notes: 'Periodontics specialist',
      },
    ],
  }
];

// Initialize clients from localStorage or defaults
let clients = loadClients();

// Function to generate a new account number
const generateAccountNumber = (): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const maxAccountNumber = clients
    .map(c => parseInt(c.accountNumber.slice(-4)))
    .reduce((max, current) => Math.max(max, current), 0);
  const nextNumber = (maxAccountNumber + 1).toString().padStart(4, '0');
  return `${year}${nextNumber}`;
};

// CRUD operations
export const getClients = (): Client[] => {
  return clients;
};

export const getClientById = (id: string): Client | undefined => {
  return clients.find(client => client.id === id);
};

export const addClient = (clientData: Omit<Client, 'id' | 'accountNumber'>): Client => {
  const newClient: Client = {
    ...clientData,
    id: uuidv4(),
    accountNumber: generateAccountNumber(),
  };
  
  clients = [...clients, newClient];
  saveClients(clients);
  return newClient;
};

export const updateClient = (id: string, clientData: Omit<Client, 'id' | 'accountNumber'>): Client => {
  const existingClient = getClientById(id);
  if (!existingClient) {
    throw new Error('Client not found');
  }

  const updatedClient: Client = {
    ...clientData,
    id,
    accountNumber: existingClient.accountNumber,
  };

  clients = clients.map(client => client.id === id ? updatedClient : client);
  saveClients(clients);
  return updatedClient;
};

export const deleteClient = (id: string): void => {
  clients = clients.filter(client => client.id !== id);
  saveClients(clients);
};

// Export the default clients directly
export const mockClients = defaultClients;