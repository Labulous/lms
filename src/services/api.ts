import axios from 'axios';

const API_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
});

// Mock data for clients
const mockClients = [
  {
    id: '1',
    clientName: 'Smile Dental Clinic',
    contactName: 'John Doe',
    phone: '123-456-7890',
    email: 'john@smiledental.com',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    clinicRegistrationNumber: 'SDC001',
    notes: 'Preferred client',
    doctors: [
      {
        name: 'Dr. Alice Johnson',
        phone: '123-555-6789',
        email: 'alice@smiledental.com',
        notes: 'Orthodontist'
      }
    ]
  },
  {
    id: '2',
    clientName: 'NAMU Clinic',
    contactName: 'Brian Min',
    phone: '123-456-7890',
    email: 'brian@namuclinic.com',
    address: {
      street: '123 Main St',
      city: 'Port Moody',
      state: 'BC',
      zipCode: 'V2H0R3'
    },
    clinicRegistrationNumber: 'SDC002',
    notes: 'Preferred client',
    doctors: [
      {
        name: 'Dr. Ray',
        phone: '123-555-6789',
        email: 'ray@namuclinic.com',
        notes: 'Orthodontist'
      }
    ]
  },
];

// Mock data for cases
const mockCases = [
  {
    id: '1',
    clientName: 'Smile Dental Clinic',
    patientName: 'Alice Smith',
    dueDate: '2023-06-15',
    currentStage: 'Impression',
    progress: 25,
    status: 'In Progress',
  },
  {
    id: '2',
    clientName: 'NAMU Clinic',
    patientName: 'Bob Johnson',
    dueDate: '2023-06-20',
    currentStage: 'Modeling',
    progress: 50,
    status: 'In Progress',
  },
];

export const fetchClients = async () => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockClients;
};

export const fetchClientDetails = async (clientId: string) => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const client = mockClients.find(c => c.id === clientId);
  if (!client) {
    throw new Error('Client not found');
  }
  return client;
};

export const addClient = async (clientData: any) => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const newClient = {
    id: (mockClients.length + 1).toString(),
    ...clientData
  };
  mockClients.push(newClient);
  return newClient;
};

export const updateClient = async (clientId: string, clientData: any) => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockClients.findIndex(c => c.id === clientId);
  if (index === -1) {
    throw new Error('Client not found');
  }
  mockClients[index] = { ...mockClients[index], ...clientData };
  return mockClients[index];
};

export const deleteClient = async (clientId: string) => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockClients.findIndex(c => c.id === clientId);
  if (index === -1) {
    throw new Error('Client not found');
  }
  mockClients.splice(index, 1);
  return { success: true };
};

export const fetchCases = async () => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockCases;
};

export const fetchCaseDetails = (caseId: string) => api.get(`/cases/${caseId}`);
export const updateCaseStage = (caseId: string, stageName: string, status: string) =>
  api.patch(`/cases/${caseId}`, { stages: { [stageName]: { status } } });

export const fetchComments = (caseId: string) => api.get(`/comments?caseId=${caseId}`);
export const addComment = (caseId: string, author: string, content: string) =>
  api.post('/comments', { caseId, author, content, timestamp: new Date().toISOString() });

export const uploadPhoto = (caseId: string, file: File, stage: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('caseId', caseId);
  formData.append('stage', stage);
  return api.post('/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default api;