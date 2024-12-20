import { format, addDays } from 'date-fns';

export interface Case {
  id: string;
  caseId: string;
  clientId: string;
  clientName: string;
  patientName?: string;
  caseType: string;
  caseStatus: CaseStatus;
  startDate: string;
  dueDate: string;
  appointmentDate?: string;
  appointmentTime?: string;
  assignedTechnicians: string[];
  deliveryMethod: DeliveryMethod;
  notes?: {
    labNotes?: string;
    technicianNotes?: string;
  };
  stages: CaseStage[];
}

export interface CaseStage {
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export type CaseStatus = 'In Queue' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
export type DeliveryMethod = 'Pickup' | 'Local Delivery' | 'Shipping';

export const CASE_STATUSES: CaseStatus[] = [
  'In Queue',
  'In Progress',
  'On Hold',
  'Completed',
  'Cancelled'
];

export const DELIVERY_METHODS: DeliveryMethod[] = [
  'Pickup',
  'Local Delivery',
  'Shipping'
];

export const mockTechnicians = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Alice Johnson' },
  { id: '4', name: 'Bob Wilson' },
];

// Initialize with some sample data
const defaultCases: Case[] = [
  {
    id: '1',
    caseId: 'CASE001',
    clientId: '1',
    clientName: 'Smile Dental Clinic',
    patientName: 'Matthias Cook',
    caseType: 'Crown',
    caseStatus: 'In Progress',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    assignedTechnicians: ['1', '2'],
    deliveryMethod: 'Local Delivery',
    stages: [
      { name: 'Impression', status: 'completed' },
      { name: 'Modeling', status: 'completed' },
      { name: 'Custom Shading', status: 'in_progress' },
      { name: 'Finishing', status: 'pending' }
    ]
  },
  {
    id: '2',
    caseId: 'CASE002',
    clientId: '2',
    clientName: 'Bright Smiles Orthodontics',
    patientName: 'Emma Thompson',
    caseType: 'Bridge',
    caseStatus: 'In Progress',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    assignedTechnicians: ['3'],
    deliveryMethod: 'Shipping',
    stages: [
      { name: 'Impression', status: 'completed' },
      { name: 'Waxing', status: 'in_progress' },
      { name: 'Casting', status: 'pending' },
      { name: 'Finishing', status: 'pending' }
    ]
  }
];

// Load cases from localStorage or use default cases
const loadCases = (): Case[] => {
  const savedCases = localStorage.getItem('cases');
  return savedCases ? JSON.parse(savedCases) : defaultCases;
};

// Save cases to localStorage
const saveCases = (cases: Case[]) => {
  localStorage.setItem('cases', JSON.stringify(cases));
};

// In-memory store initialized from localStorage
let cases: Case[] = loadCases();

// Function to get all cases
export const getCases = (): Case[] => {
  return cases;
};

// Function to get a case by ID
export const getCaseById = (id: string): Case | undefined => {
  return cases.find(caseItem => caseItem.id === id);
};

// Function to add a new case
export const addCase = (newCase: Case): void => {
  cases = [...cases, newCase];
  saveCases(cases);
};

// Function to update a case
export const updateCase = (updatedCase: Case): void => {
  cases = cases.map(caseItem => 
    caseItem.id === updatedCase.id ? updatedCase : caseItem
  );
  saveCases(cases);
};

// Function to delete a case
export const deleteCase = (id: string): void => {
  cases = cases.filter(caseItem => caseItem.id !== id);
  saveCases(cases);
};

// Function to get cases by status
export const getCasesByStatus = (status: CaseStatus): Case[] => {
  return cases.filter(caseItem => caseItem.caseStatus === status);
};

// Function to get cases by technician
export const getCasesByTechnician = (technicianId: string): Case[] => {
  return cases.filter(caseItem => 
    caseItem.assignedTechnicians.includes(technicianId)
  );
};