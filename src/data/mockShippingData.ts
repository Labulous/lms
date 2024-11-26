import { format, addDays } from 'date-fns';

export interface Shipment {
  id: string;
  caseId: string;
  clientName: string;
  clientAddress: string;
  shippingProvider: string;
  trackingNumber: string;
  shipmentDate: string;
  expectedDeliveryDate: string;
  status: 'Pending' | 'Shipped' | 'In Transit' | 'Delivered';
  notes: string;
}

export interface ShippingProvider {
  id: string;
  name: string;
  contactInfo: string;
  website: string;
}

const today = new Date();

export const mockShipments: Shipment[] = [
  {
    id: '1',
    caseId: 'CASE001',
    clientName: 'Smile Dental Clinic',
    clientAddress: '123 Main St, Anytown, AN 12345',
    shippingProvider: 'FedEx',
    trackingNumber: 'FDX123456789',
    shipmentDate: format(today, 'yyyy-MM-dd'),
    expectedDeliveryDate: format(addDays(today, 3), 'yyyy-MM-dd'),
    status: 'Shipped',
    notes: 'Handle with care',
  },
  {
    id: '2',
    caseId: 'CASE002',
    clientName: 'Bright Smiles Orthodontics',
    clientAddress: '456 Oak Rd, Otherville, OV 67890',
    shippingProvider: 'UPS',
    trackingNumber: 'UPS987654321',
    shipmentDate: format(addDays(today, -2), 'yyyy-MM-dd'),
    expectedDeliveryDate: format(addDays(today, 1), 'yyyy-MM-dd'),
    status: 'In Transit',
    notes: 'Expedited shipping',
  },
  {
    id: '3',
    caseId: 'CASE003',
    clientName: 'Perfect Teeth Dentistry',
    clientAddress: '789 Pine Ln, Somewhere, SW 13579',
    shippingProvider: 'DHL',
    trackingNumber: 'DHL246813579',
    shipmentDate: format(addDays(today, -5), 'yyyy-MM-dd'),
    expectedDeliveryDate: format(today, 'yyyy-MM-dd'),
    status: 'Delivered',
    notes: 'Signature required',
  },
  {
    id: '4',
    caseId: 'CASE004',
    clientName: 'Gentle Care Dental',
    clientAddress: '321 Elm St, Nowhere, NW 97531',
    shippingProvider: 'FedEx',
    trackingNumber: 'FDX135792468',
    shipmentDate: format(addDays(today, 1), 'yyyy-MM-dd'),
    expectedDeliveryDate: format(addDays(today, 4), 'yyyy-MM-dd'),
    status: 'Pending',
    notes: 'Saturday delivery requested',
  },
];

export const mockShippingProviders: ShippingProvider[] = [
  {
    id: '1',
    name: 'FedEx',
    contactInfo: 'support@fedex.com | 1-800-463-3339',
    website: 'https://www.fedex.com',
  },
  {
    id: '2',
    name: 'UPS',
    contactInfo: 'support@ups.com | 1-800-742-5877',
    website: 'https://www.ups.com',
  },
  {
    id: '3',
    name: 'DHL',
    contactInfo: 'support@dhl.com | 1-800-225-5345',
    website: 'https://www.dhl.com',
  },
];

export const getShipmentById = (id: string): Shipment | undefined => {
  return mockShipments.find(shipment => shipment.id === id);
};

export const getProviderById = (id: string): ShippingProvider | undefined => {
  return mockShippingProviders.find(provider => provider.id === id);
};