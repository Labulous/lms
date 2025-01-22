import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { ArrowUpIcon, ArrowDownIcon, CalendarDays } from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Progress } from "../../components/ui/progress";
import { TimeFilter, TimeFilterOption, timeFilterOptions } from "../../components/ui/time-filter";
import { mockDashboardData } from "../../data/mockSalesData";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { format } from 'date-fns';

interface TopClient {
  id: string;
  client_name: string;
  total_cases: number;
  total_outstanding: number;
}

interface RevenueData {
  revenue: number;
  growth: number;
  monthlyData: {
    month: string;
    income: number;
  }[];
}

interface SimpleTimeFilter {
  label: string;
  days: number;
}

const SalesDashboard: React.FC = () => {
  // Individual time filters for each card
  const [revenueFilter, setRevenueFilter] = useState(timeFilterOptions.find(filter => filter.value === 'this_month') || timeFilterOptions[0]);
  const [expensesFilter, setExpensesFilter] = useState(timeFilterOptions[0]);
  const incomeExpenseTimeFilterOptions: SimpleTimeFilter[] = [
    { 
      label: "This week", 
      days: 7,
    },
    { 
      label: "Last 30 days", 
      days: 30,
    },
    { 
      label: "Last 60 days", 
      days: 60,
    },
    { 
      label: "Last 90 days", 
      days: 90,
    }
  ];
  const [incomeExpenseFilter, setIncomeExpenseFilter] = useState(incomeExpenseTimeFilterOptions[1]); // Default to "Last 30 days"
  const [patientsFilter, setPatientsFilter] = useState(timeFilterOptions[0]);
  const [productsFilter, setProductsFilter] = useState(timeFilterOptions[0]);
  const [stockFilter, setStockFilter] = useState(timeFilterOptions[0]);
  const topClientsTimeFilterOptions: SimpleTimeFilter[] = [
    { label: "This week", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 60 days", days: 60 },
    { label: "Last 90 days", days: 90 },
  ];
  const [topClientsFilter, setTopClientsFilter] = useState(topClientsTimeFilterOptions[1]); // Default to "Last 30 days"
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData>({
    revenue: 0,
    growth: 0,
    monthlyData: []
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTopClients();
      fetchRevenueData();
    }
  }, [topClientsFilter, revenueFilter, user]);

  const fetchTopClients = async () => {
    try {
      if (!user?.id) {
        console.error("User not found");
        return;
      }

      // Calculate date range based on selected filter
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - topClientsFilter.days);
      
      // Format dates for Supabase query
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = today.toISOString();

      // Get cases for the current user's lab within the selected time period
      const { data: casesData, error } = await supabase
        .from('cases')
        .select(`
          client_id,
          created_at,
          clients!client_id (
            id,
            client_name
          ),
          invoices (
            amount,
            due_amount,
            created_at
          )
        `)
        .gte('created_at', formattedStartDate)
        .lte('created_at', formattedEndDate);

      if (error) {
        console.error('Error fetching top clients:', error);
        return;
      }

      // Process the data to get top clients
      const clientStats = casesData.reduce((acc: { [key: string]: TopClient }, curr: any) => {
        const clientId = curr.clients.id;
        if (!acc[clientId]) {
          acc[clientId] = {
            id: clientId,
            client_name: curr.clients.client_name,
            total_cases: 0,
            total_outstanding: 0
          };
        }
        acc[clientId].total_cases++;
        
        // Only count outstanding amounts from invoices within the selected time period
        const relevantInvoices = curr.invoices?.filter((inv: any) => {
          const invoiceDate = new Date(inv.created_at);
          return invoiceDate >= startDate && invoiceDate <= today;
        }) || [];
        
        acc[clientId].total_outstanding += relevantInvoices.reduce((sum: number, inv: any) => 
          sum + (inv.due_amount || 0), 0);
        
        return acc;
      }, {});

      // Convert to array and sort by total cases
      const sortedClients = Object.values(clientStats)
        .sort((a, b) => b.total_cases - a.total_cases)
        .slice(0, 5); // Get top 5 clients

      setTopClients(sortedClients);
    } catch (error) {
      console.error('Error in fetchTopClients:', error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      if (!user?.id) {
        console.error("User not found");
        return;
      }

      let currentStartDate: Date;
      let previousStartDate: Date;
      const today = new Date();

      // Calculate date ranges based on filter type
      if (revenueFilter.type === 'fixed' && revenueFilter.getDateRange) {
        const { start, end } = revenueFilter.getDateRange();
        currentStartDate = start;
        
        // For fixed periods, calculate previous period
        const periodLength = end.getTime() - start.getTime();
        previousStartDate = new Date(start.getTime() - periodLength);
      } else if (revenueFilter.days) {
        // Rolling periods
        currentStartDate = new Date(today);
        currentStartDate.setDate(today.getDate() - revenueFilter.days);
        
        previousStartDate = new Date(currentStartDate);
        previousStartDate.setDate(previousStartDate.getDate() - revenueFilter.days);
      } else {
        // Default to last 7 days if no valid filter
        currentStartDate = new Date(today);
        currentStartDate.setDate(today.getDate() - 7);
        
        previousStartDate = new Date(currentStartDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
      }

      // Format dates for Supabase query
      const formattedCurrentStartDate = currentStartDate.toISOString();
      const formattedPreviousStartDate = previousStartDate.toISOString();
      const formattedEndDate = today.toISOString();

      // Fetch current period revenue
      const { data: currentData, error: currentError } = await supabase
        .from('invoices')
        .select('amount, created_at')
        .gte('created_at', formattedCurrentStartDate)
        .lte('created_at', formattedEndDate)
        .eq('status', 'paid');

      // Fetch previous period revenue for growth calculation
      const { data: previousData, error: previousError } = await supabase
        .from('invoices')
        .select('amount')
        .gte('created_at', formattedPreviousStartDate)
        .lt('created_at', formattedCurrentStartDate)
        .eq('status', 'paid');

      if (currentError || previousError) {
        console.error('Error fetching revenue data:', currentError || previousError);
        return;
      }

      // Calculate total revenue for current period
      const currentRevenue = currentData?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
      const previousRevenue = previousData?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;

      // Calculate growth percentage
      const growth = previousRevenue === 0 
        ? 100 
        : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

      // Generate monthly data for the chart
      const monthlyData = generateMonthlyData(currentData || []);

      setRevenueData({
        revenue: currentRevenue,
        growth: Number(growth.toFixed(1)),
        monthlyData
      });

    } catch (error) {
      console.error('Error in fetchRevenueData:', error);
    }
  };

  const getIncomeExpenseDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return { start, end };
  };

  const fetchIncomeExpenseData = async () => {
    try {
      const { start, end } = getIncomeExpenseDateRange(incomeExpenseFilter.days);
      
      const { data: incomeData, error: incomeError } = await supabase
        .from('invoices')
        .select('amount, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (incomeError) {
        console.error('Error fetching income expense data:', incomeError);
        return;
      }

      // Rest of the function remains the same
    } catch (error) {
      console.error('Error in fetchIncomeExpenseData:', error);
    }
  };

  const generateMonthlyData = (invoices: any[]) => {
    const monthlyMap = new Map<string, number>();
    const today = new Date();
    let startDate: Date;
    let endDate = today;
    let dateFormat: string;

    // Determine date range and format based on filter type
    if (revenueFilter.type === 'fixed' && revenueFilter.getDateRange) {
      const range = revenueFilter.getDateRange();
      startDate = range.start;
      endDate = range.end;

      // Choose format based on period length
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 1) {
        dateFormat = 'h:mm a'; // Hourly for Today
      } else if (daysDiff <= 31) {
        dateFormat = 'MMM d'; // Daily for This Month
      } else {
        dateFormat = 'MMM yyyy'; // Monthly for This Year
      }
    } else {
      // Rolling periods
      startDate = new Date(today);
      startDate.setDate(today.getDate() - (revenueFilter.days || 7));
      dateFormat = revenueFilter.days && revenueFilter.days <= 1 ? 'h:mm a' : 'MMM d';
    }

    // Initialize all intervals in the period
    const interval = getIntervalForPeriod(startDate, endDate);
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const key = format(currentDate, dateFormat);
      monthlyMap.set(key, 0);
      currentDate = addInterval(currentDate, interval);
    }

    // Aggregate invoice amounts
    invoices.forEach(invoice => {
      const date = new Date(invoice.created_at);
      if (date >= startDate && date <= endDate) {
        const key = format(date, dateFormat);
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + (invoice.amount || 0));
      }
    });

    // Convert to array and sort chronologically
    return Array.from(monthlyMap.entries())
      .map(([month, income]) => ({ month, income }));
  };

  // Helper function to determine appropriate interval
  const getIntervalForPeriod = (start: Date, end: Date): 'hour' | 'day' | 'month' => {
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 1) return 'hour';
    if (daysDiff <= 31) return 'day';
    return 'month';
  };

  // Helper function to add interval to date
  const addInterval = (date: Date, interval: 'hour' | 'day' | 'month'): Date => {
    const newDate = new Date(date);
    switch (interval) {
      case 'hour':
        newDate.setHours(date.getHours() + 1);
        break;
      case 'day':
        newDate.setDate(date.getDate() + 1);
        break;
      case 'month':
        newDate.setMonth(date.getMonth() + 1);
        break;
    }
    return newDate;
  };

  const generateData = (days: number) => {
    const baseRevenue = 25000;
    const scaleFactor = days / 7;
    
    return {
      revenue: Math.round(baseRevenue * scaleFactor),
      growth: Math.round((Math.random() * 15 + 5) * 10) / 10,
      expenses: Math.round(baseRevenue * scaleFactor * 0.4),
      monthlyData: Array.from({ length: days }, (_, i) => ({
        month: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000)
          .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        income: Math.round(baseRevenue / 7 * (0.8 + Math.random() * 0.4)),
        expenses: Math.round((baseRevenue / 7) * 0.4 * (0.8 + Math.random() * 0.4))
      }))
    };
  };

  const expensesData = generateData(expensesFilter?.days || 30);
  const incomeExpenseData = generateData(incomeExpenseFilter?.days || 30);

  const {
    cashflow,
    expenses,
    incomeAndExpense,
    patients,
    popularTreatments,
    stockAvailability,
  } = mockDashboardData;

  const getProductColor = (index: number): string => {
    // Modern, professional color palette that complements the app's design
    const colors = [
      '#3b82f6', // Blue
      '#10b981', // Emerald
      '#6366f1', // Indigo
      '#f59e0b', // Amber
      '#ec4899', // Pink
      '#8b5cf6', // Purple
      '#14b8a6', // Teal
      '#f97316', // Orange
      '#06b6d4', // Cyan
      '#84cc16', // Lime
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Cashflow Section */}
      <Card className="col-span-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <TimeFilter selectedFilter={revenueFilter} onFilterChange={setRevenueFilter} />
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">${revenueData.revenue.toLocaleString()}</h2>
                <span className={`text-sm flex items-center ${revenueData.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {revenueData.growth >= 0 ? (
                    <ArrowUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4" />
                  )}
                  {Math.abs(revenueData.growth)}%
                </span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Popular Products Section */}
      <Card className="col-span-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Popular Products</CardTitle>
          <TimeFilter selectedFilter={expensesFilter} onFilterChange={setExpensesFilter} />
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Most Ordered Products</h3>
          </div>
          <div className="flex justify-center items-center relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-xl font-bold">
                {popularTreatments.reduce((sum, item) => sum + item.count, 0)}
              </p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <div className="w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {popularTreatments.map((item, index) => {
                    const totalCount = popularTreatments.reduce((sum, item) => sum + item.count, 0);
                    const percentage = (item.count / totalCount) * 100;
                    const startAngle = popularTreatments
                      .slice(0, index)
                      .reduce((sum, curr) => sum + ((curr.count / totalCount) * 100), 0);
                    const endAngle = startAngle + percentage;
                    const x1 = 100 + 80 * Math.cos((startAngle * Math.PI * 2) / 100);
                    const y1 = 100 + 80 * Math.sin((startAngle * Math.PI * 2) / 100);
                    const x2 = 100 + 80 * Math.cos((endAngle * Math.PI * 2) / 100);
                    const y2 = 100 + 80 * Math.sin((endAngle * Math.PI * 2) / 100);
                    const largeArcFlag = percentage > 50 ? 1 : 0;

                    return (
                      <path
                        key={item.name}
                        d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={getProductColor(index)}
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    );
                  })}
                </svg>
              </div>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {popularTreatments.map((item) => {
              const totalCount = popularTreatments.reduce((sum, item) => sum + item.count, 0);
              const percentage = ((item.count / totalCount) * 100).toFixed(1);
              return (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getProductColor(popularTreatments.indexOf(item)) }}
                    />
                    <span className="truncate max-w-[150px]" title={item.name}>{item.name}</span>
                  </div>
                  <span>{percentage}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Income & Expense Section */}
      <Card className="col-span-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Income and Expense</CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {incomeExpenseFilter.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {incomeExpenseTimeFilterOptions.map((filter) => (
                  <DropdownMenuItem
                    key={filter.days}
                    onClick={() => setIncomeExpenseFilter(filter)}
                  >
                    {filter.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Income & Expense</h3>
          </div>
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">TOTAL INCOME</span>
                <span className="text-sm text-green-500 flex items-center gap-1">
                  <ArrowUpIcon className="w-3 h-3" />
                  6.51%
                </span>
              </div>
              <span className="text-lg font-semibold">$1,412</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">TOTAL EXPENSES</span>
                <span className="text-sm text-red-500 flex items-center gap-1">
                  <ArrowDownIcon className="w-3 h-3" />
                  2.41%
                </span>
              </div>
              <span className="text-lg font-semibold">$612.34</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={incomeAndExpense.income.map((inc, index) => ({
                month: inc.month,
                income: inc.amount,
                expense: incomeAndExpense.expenses[index].amount,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="income" fill="#4ade80" />
              <Bar dataKey="expense" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Patients Section */}
      <Card className="col-span-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Patients</CardTitle>
          <TimeFilter selectedFilter={patientsFilter} onFilterChange={setPatientsFilter} />
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Patients</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>New patients</span>
                <span>{patients.newPercentage}%</span>
              </div>
              <Progress value={patients.newPercentage} className="h-2" />
              <div className="text-2xl font-semibold">{patients.new}</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Returning patients</span>
                <span>{patients.returningPercentage}%</span>
              </div>
              <Progress value={patients.returningPercentage} className="h-2" />
              <div className="text-2xl font-semibold">{patients.returning}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Clients Section */}
      <Card className="col-span-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Clients</CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {topClientsFilter.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {topClientsTimeFilterOptions.map((filter) => (
                  <DropdownMenuItem
                    key={filter.days}
                    onClick={() => setTopClientsFilter(filter)}
                  >
                    {filter.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Top Dental Clinics</h3>
          </div>
          <div className="space-y-4">
            {topClients.map((client) => (
              <div key={client.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate max-w-[200px]" title={client.client_name}>
                    {client.client_name}
                  </span>
                  <span className="text-sm text-gray-500">{client.total_cases} cases</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Outstanding</span>
                  <span className="text-red-500">${client.total_outstanding.toLocaleString()}</span>
                </div>
                <Progress 
                  value={client.total_cases / Math.max(...topClients.map(c => c.total_cases)) * 100} 
                  className="h-2" 
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stock Availability Section */}
      <Card className="col-span-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock availability</CardTitle>
          <TimeFilter selectedFilter={stockFilter} onFilterChange={setStockFilter} />
        </CardHeader>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-6">Stock availability</h3>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">TOTAL ASSET</p>
              <p className="text-xl font-bold">${stockAvailability.totalAsset.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">TOTAL PRODUCT</p>
              <p className="text-xl font-bold">{stockAvailability.totalProduct}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">LOW STOCK</h4>
              <Button variant="link" className="text-blue-500">
                View all
              </Button>
            </div>
            <div className="space-y-2">
              {stockAvailability.lowStock.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between py-2 border-b"
                >
                  <span>{item.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">Qty: {item.quantity}</span>
                    <Button variant="outline" size="sm">
                      Order
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const getColorForCategory = (category: string): string => {
  const colorMap: Record<string, string> = {
    "Rental Cost": "#818cf8",
    "Wages": "#34d399",
    "Medical Equipment": "#fbbf24",
    "Supplies": "#f87171",
    "Promotion Costs": "#60a5fa",
    "Other": "#a78bfa",
  };
  return colorMap[category] || "#cbd5e1";
};

export default SalesDashboard;
