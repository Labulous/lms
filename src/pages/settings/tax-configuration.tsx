import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import TaxConfiguration from "@/components/settings/TaxConfiguration";
import { useAuth } from "@/contexts/AuthContext";
import { getLabIdByUserId } from "@/services/authService";
import { SettingsTabs } from "./SettingsTabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function TaxConfigurationPage() {
  const [labId, setLabId] = useState<string>("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchLabId = async () => {
      if (user?.id) {
        const data = await getLabIdByUserId(user.id);
        if (data?.labId) {
          setLabId(data.labId);
        }
      }
    };
    fetchLabId();
  }, [user]);

  return (
    <Layout>
      <div className="flex h-full bg-gray-50">
        <SettingsTabs />
        <div className="flex-1 p-6">
          <TaxConfiguration labId={labId} />
        </div>
      </div>
    </Layout>
  );
}
