import React, { useState } from 'react';
import { Send, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ROLES } from '../types';
import { testPost, generateRoleResponse } from '../services/api';

interface ChatAreaProps {
  selectedRoleId: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | Record<string, any>;
  timestamp: number;
}

export function ChatArea({ selectedRoleId }: ChatAreaProps) {
  const [userInput, setUserInput] = useState('');
  const [messagesByRole, setMessagesByRole] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const selectedRole = ROLES.find(r => r.id === selectedRoleId);
  const messages = selectedRoleId ? (messagesByRole[selectedRoleId] || []) : [];

  const addMessage = (roleId: string, message: Message) => {
    setMessagesByRole(prev => ({
      ...prev,
      [roleId]: [...(prev[roleId] || []), message]
    }));
  };

  const updateMessageContent = (roleId: string, messageId: string, newContent: string) => {
    setMessagesByRole(prev => {
      const roleMessages = prev[roleId] || [];
      return {
        ...prev,
        [roleId]: roleMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: newContent }
            : msg
        )
      };
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !selectedRoleId) return;
    
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput,
      timestamp: Date.now(),
    };

    addMessage(selectedRoleId, newMessage);
    const currentInput = userInput;
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await generateRoleResponse(selectedRoleId, currentInput);
      
      if (!response.body) throw new Error('No response body');

      const assistantMsgId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      addMessage(selectedRoleId, assistantMessage);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        updateMessageContent(selectedRoleId, assistantMsgId, fullContent);
      }
      
      // Flush any remaining text from the decoder
      const finalChunk = decoder.decode();
      if (finalChunk) {
        fullContent += finalChunk;
        updateMessageContent(selectedRoleId, assistantMsgId, fullContent);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      addMessage(selectedRoleId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestApi = async () => {
    if (!selectedRoleId) return;
    setIsLoading(true);
    try {
      const data = await testPost();
      const newMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: JSON.stringify(data, null, 2),
        timestamp: Date.now(),
      };
      addMessage(selectedRoleId, newMessage);
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      addMessage(selectedRoleId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white/80 backdrop-blur-sm z-10">
        {selectedRole ? (
          <div>
            <h2 className="font-semibold text-slate-900">{selectedRole.title}</h2>
            <p className="text-xs text-slate-500">AI Assistant</p>
          </div>
        ) : (
          <div className="text-slate-400 italic">Select a role to start chatting</div>
        )}
        
        <button
          onClick={handleTestApi}
          disabled={isLoading || !selectedRoleId}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <Code className="w-4 h-4" />
          {isLoading ? 'Testing...' : 'Test API'}
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-slate-300" />
            </div>
            <p>Select a department head from the sidebar</p>
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
                      : msg.role === 'system'
                      ? 'bg-slate-100 text-slate-800 font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-slate-200'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="text-slate-700 leading-relaxed">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold text-slate-900 mb-2 mt-4 first:mt-0" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-bold text-slate-900 mb-2 mt-3 first:mt-0" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-bold text-slate-900 mb-1 mt-2 first:mt-0" {...props} />,
                          p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-3 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-3 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-200 pl-4 italic my-2" {...props} />,
                        }}
                      >
                        {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-none px-4 py-3 text-sm shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-white shrink-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={selectedRoleId ? `Message ${selectedRole?.title}...` : "Select a role first..."}
            disabled={!selectedRoleId || isLoading}
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!selectedRoleId || !userInput.trim() || isLoading}
            className="p-3 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="text-center mt-2">
           <p className="text-[10px] text-slate-400">AI agents can make mistakes. Please verify important information.</p>
        </div>
      </div>
    </div>
  );
}
