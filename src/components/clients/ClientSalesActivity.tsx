import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Client } from "@/services/clientsService";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ClientSalesActivityProps {
  client: Client;
}

const ClientSalesActivity: React.FC<ClientSalesActivityProps> = ({ client }) => {
  // Static mock data for now
  const monthlyData = [
    {
      month: "Jan 2025",
      netSales: 45000,
      unitsSold: 85,
    },
    {
      month: "Dec 2024",
      netSales: 38000,
      unitsSold: 72,
    },
    {
      month: "Nov 2024",
      netSales: 52000,
      unitsSold: 95,
    },
  ];

  const totalSales = 135000;
  const totalUnits = 252;

  // Chart data for net sales
  const salesChartData = {
    labels: monthlyData.map(data => data.month),
    datasets: [
      {
        label: 'Net Sales',
        data: monthlyData.map(data => data.netSales),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4,
      },
    ],
  };

  // Chart data for units sold
  const unitsChartData = {
    labels: monthlyData.map(data => data.month),
    datasets: [
      {
        label: 'Units Sold',
        data: monthlyData.map(data => data.unitsSold),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Monthly Net Sales Card */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Net Sales</CardTitle>
            <CardDescription>Last 3 months sales data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data) => (
                <div
                  key={data.month}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <span className="text-sm text-gray-600">{data.month}</span>
                  <span className="font-semibold">
                    ${data.netSales.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">
                  ${totalSales.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Units Sold Card */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Units Sold</CardTitle>
            <CardDescription>Last 3 months unit sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data) => (
                <div
                  key={data.month}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <span className="text-sm text-gray-600">{data.month}</span>
                  <span className="font-semibold">
                    {data.unitsSold.toLocaleString()} units
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">
                  {totalUnits.toLocaleString()} units
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Data Card */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>Sales performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data) => (
                <div
                  key={data.month}
                  className="space-y-2 border-b pb-2"
                >
                  <div className="font-medium">{data.month}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Sales: </span>
                      <span className="font-semibold">
                        ${data.netSales.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Units: </span>
                      <span className="font-semibold">
                        {data.unitsSold.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Net Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Net Sales Trend</CardTitle>
            <CardDescription>Monthly sales performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line data={salesChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Units Sold Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Units Sold Analysis</CardTitle>
            <CardDescription>Monthly units breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={unitsChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientSalesActivity;
