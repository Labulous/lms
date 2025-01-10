import Layout from '@/components/layout/Layout';
import { SettingsTabs } from './SettingsTabs';
import { WorkingTagsSettingsContent } from './SettingsContent';

export default function WorkingTagsSettings() {
  return (
    <Layout>
      <div className="flex h-full bg-gray-50">
        <SettingsTabs />
        <div className="flex-1">
          <WorkingTagsSettingsContent />
        </div>
      </div>
    </Layout>
  );
}
