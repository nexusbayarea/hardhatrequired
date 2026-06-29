'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const tabs = ['Profile', 'Organization', 'API Keys', 'Billing', 'Notifications'];

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted mt-1">Manage your account and organization</p>
      </div>

      <div className="flex gap-1 border-b border-border pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase().replace(/\s/g, ''))}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.toLowerCase().replace(/\s/g, '')
                ? 'text-text bg-surface2'
                : 'text-muted hover:text-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-lg space-y-6">
        <Input label="Full Name" defaultValue="User" />
        <Input label="Email" defaultValue="user@indexintelligence.io" />
        <Input label="Company" defaultValue="Index Intelligence" />
        <div className="pt-2">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
