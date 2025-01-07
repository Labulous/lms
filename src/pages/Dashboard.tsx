import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SalesDashboard from "@/components/dashboard/SalesDashboard";
import { Card } from "@/components/ui/card";

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("operations");

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Good morning, John!</h1>
          <p className="text-gray-500">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="operations"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="operations">
          {/* Keep your existing operations dashboard content here */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Operations Dashboard</h2>
            {/* Your existing operations content */}
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <SalesDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
