import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { mockDashboardData } from "@/data/mockSalesData";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const SalesDashboard: React.FC = () => {
  const {
    cashflow,
    expenses,
    incomeAndExpense,
    patients,
    popularTreatments,
    stockAvailability,
  } = mockDashboardData;

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Cashflow Section */}
      <Card className="col-span-8">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm text-gray-500">TOTAL REVENUE</p>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">${cashflow.totalCash.toLocaleString()}</h2>
                <span className="text-sm text-green-500 flex items-center">
                  <ArrowUpIcon className="w-4 h-4" />
                  {cashflow.growthPercentage}%
                </span>
              </div>
            </div>
            <select className="text-sm border rounded-md px-2 py-1">
              <option>Last 12 month</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashflow.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Expenses Section */}
      <Card className="col-span-4">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Expenses</h3>
            <select className="text-sm border rounded-md px-2 py-1">
              <option>Last 6 months</option>
            </select>
          </div>
          <div className="flex justify-center items-center relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <p className="text-sm text-gray-500">Total Expense</p>
              <p className="text-xl font-bold">${expenses.total.toLocaleString()}</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <div className="w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {expenses.breakdown.map((item, index) => {
                    const startAngle = expenses.breakdown
                      .slice(0, index)
                      .reduce((sum, curr) => sum + curr.percentage, 0);
                    const endAngle = startAngle + item.percentage;
                    const x1 = 100 + 80 * Math.cos((startAngle * Math.PI * 2) / 100);
                    const y1 = 100 + 80 * Math.sin((startAngle * Math.PI * 2) / 100);
                    const x2 = 100 + 80 * Math.cos((endAngle * Math.PI * 2) / 100);
                    const y2 = 100 + 80 * Math.sin((endAngle * Math.PI * 2) / 100);
                    const largeArcFlag = item.percentage > 50 ? 1 : 0;

                    return (
                      <path
                        key={item.category}
                        d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={getColorForCategory(item.category)}
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    );
                  })}
                </svg>
              </div>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {expenses.breakdown.map((item) => (
              <div key={item.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getColorForCategory(item.category) }}
                  />
                  <span>{item.category}</span>
                </div>
                <span>{item.percentage}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Income & Expense Section */}
      <Card className="col-span-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Income & Expense</h3>
            <select className="text-sm border rounded-md px-2 py-1">
              <option>Last 6 months</option>
            </select>
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
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Patients</h3>
            <select className="text-sm border rounded-md px-2 py-1">
              <option>This month</option>
            </select>
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

      {/* Popular Products Section */}
      <Card className="col-span-3">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-6">Popular Products</h3>
          <div className="space-y-4">
            {popularTreatments.map((treatment) => (
              <div key={treatment.name} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">⚡</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{treatment.name}</div>
                  <div className="text-sm text-gray-500">
                    {treatment.count} sold
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stock Availability Section */}
      <Card className="col-span-6">
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
