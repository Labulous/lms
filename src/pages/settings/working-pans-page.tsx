import Layout from '@/components/layout/Layout';
import { SettingsTabs } from './SettingsTabs';
import { WorkingPansSettingsContent, WorkingTagsSettingsContent } from './SettingsContent';

export default function WorkingPansSettings() {
  return (
    <Layout>
      <div className="flex h-full bg-gray-50">
        <SettingsTabs />
        <div className="flex-1">
          <WorkingPansSettingsContent />
        </div>
      </div>
    </Layout>
  );
}
