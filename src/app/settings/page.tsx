'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { SettingsContent } from '@/components/settings/SettingsContent';
import type { SettingsTab } from '@/components/settings/SettingsTabs';

interface SettingsProps {
  defaultTab?: SettingsTab;
}

export default function Settings({ defaultTab = 'system' }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

  // Update active tab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  return (
    <Layout>
      <div className="flex h-full bg-gray-50">
        <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <SettingsContent activeTab={activeTab} />
      </div>
    </Layout>
  );
}