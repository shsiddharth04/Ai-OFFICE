import React, { useState } from 'react';
import { ROLES } from '../types';
import { Users, Briefcase, TrendingUp, PenTool, Lightbulb, KeyRound, Eye, EyeOff, Cpu } from 'lucide-react';
import { Provider, DEFAULT_MODELS } from '../services/api';

interface SidebarProps {
  selectedRoleId: string;
  onSelectRole: (roleId: string) => void;
  provider: Provider;
  onProviderChange: (p: Provider) => void;
  apiKeys: Record<Provider, string>;
  onApiKeyChange: (p: Provider, key: string) => void;
  geminiModel: string;
  onGeminiModelChange: (model: string) => void;
}

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'gemini', label: 'Gemini' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
];

const KEY_PLACEHOLDERS: Record<Provider, string> = {
  gemini: 'AIza...',
  openai: 'sk-...',
  anthropic: 'sk-ant-...',
};

const GEMINI_MODEL_SUGGESTIONS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp',
];

const RoleIcon = ({ id }: { id: string }) => {
  switch (id) {
    case 'e86180c3-156b-43eb-9ffa-f042f3e4c975': return <TrendingUp className="w-5 h-5" />;
    case '4e83b8c3-f3f4-41dd-9a3e-a0fa17f806ed': return <Briefcase className="w-5 h-5" />;
    case 'fb37d93f-c2d6-4d4b-88a0-a4d8fee9fadd': return <Users className="w-5 h-5" />;
    case '48549e81-c699-4b7b-aa7a-4f64b4555f37': return <PenTool className="w-5 h-5" />;
    case 'ccd0eafe-6d17-4b8b-ae9a-b6e09642f2d7': return <Lightbulb className="w-5 h-5" />;
    default: return <Users className="w-5 h-5" />;
  }
};

export function Sidebar({
  selectedRoleId,
  onSelectRole,
  provider,
  onProviderChange,
  apiKeys,
  onApiKeyChange,
  geminiModel,
  onGeminiModelChange,
}: SidebarProps) {
  const [showKey, setShowKey] = useState(false);
  const [keyDrafts, setKeyDrafts] = useState<Record<Provider, string>>({ ...apiKeys });
  const [modelDraft, setModelDraft] = useState(geminiModel);

  const currentKey = apiKeys[provider];

  const commitKey = () => onApiKeyChange(provider, keyDrafts[provider].trim());
  const commitModel = () => onGeminiModelChange(modelDraft.trim() || DEFAULT_MODELS.gemini);

  return (
    <div className="w-[250px] bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-slate-200">
        <h1 className="font-sans font-bold text-xl text-slate-900 tracking-tight">
          AI Digital Office
        </h1>
        <p className="text-xs text-slate-500 mt-1">Select an agent to chat</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-1">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                selectedRoleId === role.id
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <RoleIcon id={role.id} />
              <span>{role.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Provider + API Key */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        {/* Provider tabs */}
        <div className="flex rounded-lg overflow-hidden border border-slate-200 text-xs font-medium">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => onProviderChange(p.id)}
              className={`flex-1 py-1.5 transition-colors ${
                provider === p.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Gemini model selector */}
        {provider === 'gemini' && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Model
            </div>
            <input
              type="text"
              value={modelDraft}
              onChange={(e) => setModelDraft(e.target.value)}
              onBlur={commitModel}
              onKeyDown={(e) => e.key === 'Enter' && commitModel()}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 font-mono"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {GEMINI_MODEL_SUGGESTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => { setModelDraft(m); onGeminiModelChange(m); }}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                    geminiModel === m
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {m.replace('gemini-', '')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* API key input */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            API Key
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyDrafts[provider]}
              onChange={(e) =>
                setKeyDrafts((prev) => ({ ...prev, [provider]: e.target.value }))
              }
              onBlur={commitKey}
              onKeyDown={(e) => e.key === 'Enter' && commitKey()}
              placeholder={KEY_PLACEHOLDERS[provider]}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 placeholder:text-slate-300"
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className={`w-2 h-2 rounded-full shrink-0 ${currentKey ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          <span>{currentKey ? 'Key saved locally' : 'Key required to chat'}</span>
        </div>
      </div>
    </div>
  );
}
