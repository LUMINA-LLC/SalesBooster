import { Suspense } from 'react';
import SettingsContent from '@/components/settings/SettingsContent';

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
