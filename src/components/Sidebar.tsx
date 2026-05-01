import React from 'react';
import { 
  Code2, Settings, Plus, User, Sparkles, Terminal, ChevronRight,
  Sun, Moon, Trash2, MessageSquare
} from 'lucide-react';
import { AI_MODELS } from '../constants';
import { Theme, ChatSession } from '../types';

interface SidebarProps {
  userName: string;
  theme: Theme;
  sessions: ChatSession[];
  currentSessionId: string | null;
  credits: number;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onFeatureSelect: (name: string) => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({ 
  userName, 
  theme, 
  sessions, 
  currentSessionId,
  credits,
  onNewChat, 
  onSelectSession,
  onDeleteSession,
  onFeatureSelect, 
  onToggleTheme, 
  onOpenSettings 
}: SidebarProps) {
  const isDark = theme === 'dark';

  return (
    <div className={`w-72 h-screen border-r flex flex-col font-sans select-none overflow-hidden shrink-0 transition-colors duration-300 ${
      isDark ? 'bg-[#121212] border-[#2a2a2a] text-white' : 'bg-[#F9F9F8] border-[#E5E5E1] text-[#1a1a1a]'
    }`}>
      {/* App Logo/Header */}
      <div className={`p-5 flex items-center gap-3 border-b transition-colors ${
        isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-[#E5E5E1]'
      }`}>
        <div className="w-9 h-9 bg-[#D97757] rounded-xl flex items-center justify-center text-white shadow-sm ring-4 ring-[#D97757]/10">
          <Code2 size={22} />
        </div>
        <div>
          <h1 className="font-bold leading-none tracking-tight text-lg">Name-Code</h1>
          <p className="text-[10px] text-[#D97757] mt-1 uppercase font-black">AI Development Studio</p>
        </div>
      </div>

      {/* New Project Button */}
      <div className="px-4 mt-6">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-[#D97757] hover:bg-[#c6684b] transition-all py-3 rounded-2xl text-sm font-semibold text-white shadow-md active:scale-[0.98]"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 mt-6 space-y-8 pb-20 custom-scrollbar-light">
        
        {/* Chat History Section */}
        <div>
          <p className={`px-3 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ${
            isDark ? 'text-[#666]' : 'text-[#8e8e8e]'
          }`}>Chat History</p>
          <div className="space-y-1">
            {sessions.length === 0 && (
              <p className="px-3 text-[10px] italic text-gray-500">No projects yet...</p>
            )}
            {sessions.map((session) => (
              <div 
                key={session.id}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                  currentSessionId === session.id 
                    ? (isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-[#efefed] border border-[#E5E5E1]')
                    : (isDark ? 'text-gray-400 hover:bg-[#1a1a1a]' : 'text-[#4a4a4a] hover:bg-[#efefed]')
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-center gap-3 truncate">
                  <MessageSquare size={14} className={currentSessionId === session.id ? 'text-[#D97757]' : ''} />
                  <span className="font-medium truncate underline-offset-4 decoration-[#D97757]/30 group-hover:underline">
                    {session.title || 'Untitled Project'}
                  </span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* AI Models */}
        <div>
          <p className={`px-3 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ${
            isDark ? 'text-[#666]' : 'text-[#8e8e8e]'
          }`}>AI Models</p>
          <div className="space-y-1">
            {AI_MODELS.map((model) => {
              return (
                <button 
                  key={model.id}
                  onClick={() => onFeatureSelect(model.name)}
                  className={`w-full flex items-center justify-between group px-3 py-2.5 rounded-xl text-sm transition-all hover:translate-x-1 ${
                    isDark ? 'text-gray-300 hover:bg-[#1a1a1a]' : 'text-[#4a4a4a] hover:bg-[#efefed]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                      isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] group-hover:border-[#D97757]' : 'bg-white border-[#E5E5E1] group-hover:border-[#D97757]'
                    }`}>
                      <Sparkles size={14} className="text-[#D97757]" />
                    </div>
                    <span className="font-medium transition-colors">{model.name}</span>
                  </div>
                  <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDark ? 'text-[#444]' : 'text-[#8e8e8e]'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer User Info */}
      <div className={`p-4 border-t transition-colors ${
        isDark ? 'bg-[#0a0a0a] border-[#2a2a2a]' : 'bg-white border-[#E5E5E1]'
      }`}>
        <div className={`flex items-center gap-3 p-2 border rounded-2xl transition-colors ${
          isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-[#f9f9f8] border-[#E5E5E1]'
        }`}>
          <div className="w-10 h-10 bg-[#D97757] rounded-xl flex items-center justify-center text-white shadow-sm ring-4 ring-[#D97757]/10 shrink-0">
            <User size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">{userName}</p>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <p className={`text-[10px] font-semibold uppercase ${isDark ? 'text-[#666]' : 'text-[#8e8e8e]'}`}>Pro Dev</p>
              </div>
              <p className={`text-[10px] font-bold mt-0.5 ${credits > 5 ? 'text-green-500/70' : 'text-red-500/70'}`}>
                {credits}/12 TOKENS
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={onToggleTheme} className="hover:text-[#D97757] transition-colors p-1">
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button onClick={onOpenSettings} className="hover:text-[#D97757] transition-colors p-1">
              <Settings size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
