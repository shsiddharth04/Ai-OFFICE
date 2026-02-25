import React from 'react';
import { ROLES } from '../types';
import { Users, Briefcase, TrendingUp, PenTool, Lightbulb } from 'lucide-react';

interface SidebarProps {
  selectedRoleId: string;
  onSelectRole: (roleId: string) => void;
}

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

export function Sidebar({ selectedRoleId, onSelectRole }: SidebarProps) {
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
      
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span>System Online</span>
        </div>
      </div>
    </div>
  );
}
