/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';

export default function App() {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar 
        selectedRoleId={selectedRoleId} 
        onSelectRole={setSelectedRoleId} 
      />
      <main className="flex-1 h-full min-w-0">
        <ChatArea selectedRoleId={selectedRoleId} />
      </main>
    </div>
  );
}
