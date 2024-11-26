import { format, subMonths } from 'date-fns';

export interface MonthlySalesData {
  month: string;
  netSales: number;
  unitsSold: number;
}

export interface ClientSalesData {
  clientId: string;
  accountNumber: string;
  monthlyData: MonthlySalesData[];
  totalSales: number;
  totalUnits: number;
}

// Generate last 12 months of data for each client
const generateMonthlyData = (): MonthlySalesData[] => {
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      month: format(date, 'MMM yyyy'),
      netSales: Math.floor(Math.random() * 50000) + 10000, // Random sales between 10k and 60k
      unitsSold: Math.floor(Math.random() * 100) + 20, // Random units between 20 and 120
    };
  }).reverse();

  return months;
};

export const mockSalesData: ClientSalesData[] = [
  {
    clientId: '1',
    accountNumber: '240001',
    monthlyData: generateMonthlyData(),
    totalSales: 450000,
    totalUnits: 890,
  },
  {
    clientId: '2',
    accountNumber: '240002',
    monthlyData: generateMonthlyData(),
    totalSales: 380000,
    totalUnits: 720,
  },
  {
    clientId: '3',
    accountNumber: '240003',
    monthlyData: generateMonthlyData(),
    totalSales: 520000,
    totalUnits: 950,
  },
  {
    clientId: '4',
    accountNumber: '240004',
    monthlyData: generateMonthlyData(),
    totalSales: 620000,
    totalUnits: 1100,
  },
  {
    clientId: '5',
    accountNumber: '240005',
    monthlyData: generateMonthlyData(),
    totalSales: 290000,
    totalUnits: 580,
  },
  {
    clientId: '6',
    accountNumber: '240006',
    monthlyData: generateMonthlyData(),
    totalSales: 410000,
    totalUnits: 820,
  },
  {
    clientId: '7',
    accountNumber: '240007',
    monthlyData: generateMonthlyData(),
    totalSales: 340000,
    totalUnits: 680,
  },
  {
    clientId: '8',
    accountNumber: '240008',
    monthlyData: generateMonthlyData(),
    totalSales: 480000,
    totalUnits: 960,
  },
];

export const getClientSalesData = (clientId: string): ClientSalesData | undefined => {
  return mockSalesData.find(data => data.clientId === clientId);
};