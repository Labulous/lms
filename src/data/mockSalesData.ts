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

// Dashboard specific data
export interface DashboardSalesData {
  cashflow: {
    totalCash: number;
    growthPercentage: number;
    monthlyData: Array<{
      month: string;
      amount: number;
    }>;
  };
  expenses: {
    total: number;
    breakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  incomeAndExpense: {
    income: Array<{
      month: string;
      amount: number;
      growthPercentage: number;
    }>;
    expenses: Array<{
      month: string;
      amount: number;
      growthPercentage: number;
    }>;
  };
  patients: {
    new: number;
    returning: number;
    newPercentage: number;
    returningPercentage: number;
  };
  popularTreatments: Array<{
    name: string;
    count: number;
  }>;
  stockAvailability: {
    totalAsset: number;
    totalProduct: number;
    lowStock: Array<{
      name: string;
      quantity: number;
    }>;
  };
}

export const mockDashboardData: DashboardSalesData = {
  cashflow: {
    totalCash: 131232,
    growthPercentage: 4.51,
    monthlyData: [
      { month: 'JAN', amount: 2000 },
      { month: 'FEB', amount: 2500 },
      { month: 'MAR', amount: 2200 },
      { month: 'APR', amount: 5000 },
      { month: 'MAY', amount: 6000 },
      { month: 'JUN', amount: 7100 },
      { month: 'JUL', amount: 6500 },
      { month: 'AUG', amount: 7500 },
      { month: 'SEP', amount: 8000 },
      { month: 'OCT', amount: 9000 },
      { month: 'NOV', amount: 10000 },
      { month: 'DEC', amount: 11000 },
    ],
  },
  expenses: {
    total: 80832,
    breakdown: [
      { category: 'Rental Cost', amount: 26000, percentage: 30 },
      { category: 'Wages', amount: 16500, percentage: 22 },
      { category: 'Medical Equipment', amount: 15640, percentage: 20 },
      { category: 'Supplies', amount: 13564, percentage: 18 },
      { category: 'Promotion Costs', amount: 6466, percentage: 8 },
      { category: 'Other', amount: 2662, percentage: 2 },
    ],
  },
  incomeAndExpense: {
    income: [
      { month: 'JAN', amount: 5000, growthPercentage: 6.51 },
      { month: 'FEB', amount: 6000, growthPercentage: 6.51 },
      { month: 'MAR', amount: 9000, growthPercentage: 6.51 },
      { month: 'APR', amount: 7000, growthPercentage: 6.51 },
      { month: 'MAY', amount: 6500, growthPercentage: 6.51 },
      { month: 'JUN', amount: 6000, growthPercentage: 6.51 },
    ],
    expenses: [
      { month: 'JAN', amount: 1500, growthPercentage: -2.41 },
      { month: 'FEB', amount: 3000, growthPercentage: -2.41 },
      { month: 'MAR', amount: 3500, growthPercentage: -2.41 },
      { month: 'APR', amount: 2500, growthPercentage: -2.41 },
      { month: 'MAY', amount: 5000, growthPercentage: -2.41 },
      { month: 'JUN', amount: 5200, growthPercentage: -2.41 },
    ],
  },
  patients: {
    new: 21,
    returning: 142,
    newPercentage: 36.52,
    returningPercentage: 61.41,
  },
  popularTreatments: [
    { name: 'Digital Model - Quadrant', count: 112 },
    { name: 'PROSTHESIS - Digital Model', count: 72 },
    { name: 'All Zirc Posterior Crown', count: 67 },
    { name: 'Thermoplastic Nightguard', count: 40 },
    { name: 'Cap Anterior Crown', count: 17 },
  ],
  stockAvailability: {
    totalAsset: 53000,
    totalProduct: 442,
    lowStock: [
      { name: 'Dental Brush', quantity: 3 },
      { name: 'Charmflex Regular', quantity: 2 },
    ],
  },
};