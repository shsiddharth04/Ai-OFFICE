import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ROLES } from '../types';
import { streamRoleResponse, HistoryEntry, Provider } from '../services/api';

interface ChatAreaProps {
  selectedRoleId: string;
  provider: Provider;
  apiKey: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: number;
}

const MESSAGES_STORAGE_KEY = 'ai_office_messages';

function loadMessages(): Record<string, Message[]> {
  try {
    return JSON.parse(localStorage.getItem(MESSAGES_STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveMessages(map: Record<string, Message[]>) {
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(map));
}

export function ChatArea({ selectedRoleId, provider, apiKey }: ChatAreaProps) {
  const [userInput, setUserInput] = useState('');
  const [messagesByRole, setMessagesByRole] = useState<Record<string, Message[]>>(loadMessages);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedRole = ROLES.find((r) => r.id === selectedRoleId);
  const messages = selectedRoleId ? (messagesByRole[selectedRoleId] ?? []) : [];

  useEffect(() => {
    saveMessages(messagesByRole);
  }, [messagesByRole]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const setRoleMessages = (roleId: string, updater: (prev: Message[]) => Message[]) => {
    setMessagesByRole((prev) => ({
      ...prev,
      [roleId]: updater(prev[roleId] ?? []),
    }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !selectedRoleId || !selectedRole || !apiKey) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput.trim(),
      timestamp: Date.now(),
    };

    setRoleMessages(selectedRoleId, (prev) => [...prev, userMsg]);
    const currentInput = userInput.trim();
    setUserInput('');
    setIsLoading(true);

    const assistantMsgId = crypto.randomUUID();
    setRoleMessages(selectedRoleId, (prev) => [
      ...prev,
      { id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now() },
    ]);

    try {
      const history: HistoryEntry[] = (messagesByRole[selectedRoleId] ?? [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.content }));

      let accumulated = '';
      for await (const chunk of streamRoleResponse(
        provider,
        selectedRole.systemPrompt,
        history,
        currentInput,
        apiKey,
      )) {
        accumulated += chunk;
        const snap = accumulated;
        setRoleMessages(selectedRoleId, (prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, content: snap } : m)),
        );
      }
    } catch (err) {
      setRoleMessages(selectedRoleId, (prev) =>
        prev
          .filter((m) => m.id !== assistantMsgId)
          .concat({
            id: crypto.randomUUID(),
            role: 'error',
            content: err instanceof Error ? err.message : 'Unknown error',
            timestamp: Date.now(),
          }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-slate-100 flex items-center px-6 shrink-0 bg-white/80 backdrop-blur-sm z-10">
        {selectedRole ? (
          <div>
            <h2 className="font-semibold text-slate-900">{selectedRole.title}</h2>
            <p className="text-xs text-slate-500 capitalize">via {provider}</p>
          </div>
        ) : (
          <div className="text-slate-400 italic">Select a role to start chatting</div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-slate-300" />
            </div>
            {!apiKey ? (
              <p>Add your API key in the sidebar to start</p>
            ) : (
              <p>Select a department head from the sidebar</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : msg.role === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200 font-mono text-xs rounded-bl-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="text-slate-700 leading-relaxed">
                      <ReactMarkdown
                        components={{
                          h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-slate-900 mb-2 mt-4 first:mt-0" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-base font-bold text-slate-900 mb-2 mt-3 first:mt-0" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-slate-900 mb-1 mt-2 first:mt-0" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-3 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-3 space-y-1" {...props} />,
                          li: ({ node, ...props }) => <li {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
                          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-slate-200 pl-4 italic my-2" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading &&
              messages[messages.length - 1]?.role === 'assistant' &&
              messages[messages.length - 1]?.content === '' && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-none px-4 py-3 text-sm shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 bg-white shrink-0">
        {!apiKey && (
          <p className="text-center text-xs text-amber-600 mb-2">
            Add your API key in the sidebar to enable chat
          </p>
        )}
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={
              !apiKey
                ? 'API key required...'
                : selectedRoleId
                ? `Message ${selectedRole?.title}...`
                : 'Select a role first...'
            }
            disabled={!selectedRoleId || isLoading || !apiKey}
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!selectedRoleId || !userInput.trim() || isLoading || !apiKey}
            className="p-3 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center mt-2 text-[10px] text-slate-400">
          AI agents can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
}
