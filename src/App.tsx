import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { Provider, PROVIDER_KEY_MAP, PROVIDER_STORAGE_KEY } from './services/api';

export default function App() {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const [provider, setProvider] = useState<Provider>(
    () => (localStorage.getItem(PROVIDER_STORAGE_KEY) as Provider) ?? 'gemini',
  );

  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>(() => ({
    gemini: localStorage.getItem(PROVIDER_KEY_MAP.gemini) ?? '',
    openai: localStorage.getItem(PROVIDER_KEY_MAP.openai) ?? '',
    anthropic: localStorage.getItem(PROVIDER_KEY_MAP.anthropic) ?? '',
  }));

  const handleProviderChange = (p: Provider) => {
    localStorage.setItem(PROVIDER_STORAGE_KEY, p);
    setProvider(p);
  };

  const handleApiKeyChange = (p: Provider, key: string) => {
    localStorage.setItem(PROVIDER_KEY_MAP[p], key);
    setApiKeys((prev) => ({ ...prev, [p]: key }));
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar
        selectedRoleId={selectedRoleId}
        onSelectRole={setSelectedRoleId}
        provider={provider}
        onProviderChange={handleProviderChange}
        apiKeys={apiKeys}
        onApiKeyChange={handleApiKeyChange}
      />
      <main className="flex-1 h-full min-w-0">
        <ChatArea
          selectedRoleId={selectedRoleId}
          provider={provider}
          apiKey={apiKeys[provider]}
        />
      </main>
    </div>
  );
}
