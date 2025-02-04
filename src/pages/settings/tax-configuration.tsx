import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import TaxConfiguration from '@/components/settings/TaxConfiguration';
import { useAuth } from '@/contexts/AuthContext';
import { getLabIdByUserId } from '@/services/authService';

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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <TaxConfiguration labId={labId} />
      </div>
    </Layout>
  );
}
