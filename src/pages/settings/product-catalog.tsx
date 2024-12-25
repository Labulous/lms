import React from 'react';
import Layout from '@/components/layout/Layout';
import { SettingsTabs } from './SettingsTabs';
import { ProductCatalogSettingsContent } from './SettingsContent';

export default function ProductCatalogSettings() {
  return (
    <Layout>
      <div className="flex h-full bg-gray-50">
        <SettingsTabs />
        <div className="flex-1 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Product Catalog Settings
          </h2>
          <ProductCatalogSettingsContent />
        </div>
      </div>
    </Layout>
  );
}
