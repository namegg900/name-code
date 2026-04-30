import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import ArtifactView from './components/ArtifactView';
import Onboarding from './components/Onboarding';
import { Message, UserProfile, Artifact, Theme, AppSettings, ChatSession, FileEntry } from './types';
import { chatWithClaude } from './services/geminiService';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  searchEnabled: false,
  deepSeekEnabled: false,
  intelligentEnabled: true,
  thinkBeforeAct: false,
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('name-code-profile-v3');
    if (savedProfile) {
      const p: UserProfile = JSON.parse(savedProfile);
      saveProfile(p);
    }
  }, []);

  const saveProfile = (p: UserProfile | ((prev: UserProfile | null) => UserProfile | null)) => {
    setProfile((prev) => {
      const next = typeof p === 'function' ? p(prev) : p;
      if (next) {
        localStorage.setItem('name-code-profile-v3', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleOnboarding = (name: string) => {
    const newProfile: UserProfile = { 
      name, 
      settings: { ...DEFAULT_SETTINGS },
      sessions: [],
      currentSessionId: null
    };
    saveProfile(newProfile);
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    if (!profile) return;
    const updatedProfile = { 
      ...profile, 
      settings: { ...profile.settings, ...newSettings } 
    };
    saveProfile(updatedProfile);
  };

  const handleNewChat = () => {
    if (!profile) return;
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Project',
      messages: [],
      updatedAt: Date.now()
    };
    const updatedProfile = {
      ...profile,
      sessions: [newSession, ...profile.sessions],
      currentSessionId: newSession.id
    };
    saveProfile(updatedProfile);
    setCurrentArtifact(null);
  };

  const handleSelectSession = (id: string) => {
    if (!profile) return;
    saveProfile({ ...profile, currentSessionId: id });
    setCurrentArtifact(null);
  };

  const handleDeleteSession = (id: string) => {
    if (!profile) return;
    const updatedSessions = profile.sessions.filter(s => s.id !== id);
    const newCurrentId = profile.currentSessionId === id ? (updatedSessions[0]?.id || null) : profile.currentSessionId;
    saveProfile({ 
      ...profile, 
      sessions: updatedSessions, 
      currentSessionId: newCurrentId
    });
  };

  const currentSession = profile?.sessions.find(s => s.id === profile.currentSessionId);

  const extractArtifacts = (content: string): Artifact[] => {
    const codeBlocks: Artifact[] = [];
    // More robust regex for filename extraction
    const regex = /```(\w+)?(?:\s+FILENAME:\s*([^\s\n]+))?\n([\s\S]*?)```/gi;
    let match;
    
    const projectFiles: FileEntry[] = [];

    while ((match = regex.exec(content)) !== null) {
      const language = (match[1] || 'text').toLowerCase();
      const filename = match[2]?.trim();
      const code = match[3].trim();
      
      const isMC = ['java', 'json', 'mcfunction', 'mcmeta'].includes(language) || 
                   (content.toLowerCase().includes('minecraft') && (code.includes('public class') || code.includes('event')));
      
      const isWeb = ['html', 'css', 'javascript', 'typescript', 'jsx', 'tsx', 'react'].includes(language) || 
                    (filename && (filename.endsWith('.html') || filename.endsWith('.css') || filename.endsWith('.js')));

      if (filename) {
        projectFiles.push({ name: filename, language, content: code });
      }

      codeBlocks.push({
        id: uuidv4(),
        type: isMC ? 'minecraft' : (isWeb ? 'web' : 'code'),
        language,
        code,
        title: filename || (isMC ? `MC Module: ${language.toUpperCase()}` : `Snippet: ${language.toUpperCase()}`)
      });
    }

    // ALWAYS prefer a Project/Web artifact if files have names
    if (projectFiles.length > 0) {
      const isWebProject = projectFiles.some(f => 
        ['html', 'css', 'js', 'javascript', 'ts', 'typescript', 'jsx', 'tsx'].includes(f.language || '') ||
        f.name.endsWith('.html') || f.name.endsWith('.css') || f.name.endsWith('.js')
      );
      
      return [{
        id: uuidv4(),
        type: isWebProject ? 'web' : 'project',
        code: projectFiles[0].content, // Default to first file content
        files: projectFiles,
        language: projectFiles[0].language,
        title: projectFiles.length > 1 ? 'Project Workspace' : projectFiles[0].name
      }];
    }

    return codeBlocks;
  };

  const handleSendMessage = async (text: string, files?: { name: string, content: string }[], images?: string[]) => {
    if (!profile) return;
    
    let currentId = profile.currentSessionId;
    let sessions = [...profile.sessions];

    let userContent = text;
    if (files && files.length > 0) {
      const fileContext = files.map(f => `FILE: ${f.name}\nCONTENT:\n${f.content}`).join('\n\n');
      userContent = `${fileContext}\n\nUSER REQUEST: ${userContent || 'Analyze these files.'}`;
    }

    if (!currentId) {
      const newSession: ChatSession = {
        id: uuidv4(),
        title: text.slice(0, 30) || (files?.length ? 'File Analysis' : (images?.length ? 'Image Analysis' : 'New Chat')),
        messages: [],
        updatedAt: Date.now()
      };
      sessions = [newSession, ...sessions];
      currentId = newSession.id;
    }

    const userMsg: Message = { id: uuidv4(), role: 'user', content: userContent, timestamp: Date.now() };
    
    const intermediateSessions = sessions.map(s => {
      if (s.id === currentId) {
        return { ...s, messages: [...s.messages, userMsg], updatedAt: Date.now() };
      }
      return s;
    });

    saveProfile(prev => {
      if (!prev) return null;
      return { ...prev, sessions: intermediateSessions, currentSessionId: currentId };
    });
    setIsLoading(true);

    try {
      // Use the local credits value for the session context if needed
      const activeSession = intermediateSessions.find(s => s.id === currentId);
      const history = activeSession?.messages.slice(-5).map(m => ({ role: m.role, content: m.content })) || [];
      
      const aiResponse = await chatWithClaude(userContent, history, images);
      
      const assistantMsg: Message = { id: uuidv4(), role: 'assistant', content: aiResponse, timestamp: Date.now() };

      saveProfile(prev => {
        if (!prev) return null;
        const finalSessions = (prev.sessions || sessions).map(s => {
          if (s.id === currentId) {
            const newTitle = s.messages.length <= 2 ? text.slice(0, 40) : s.title;
            const updatedMessages = s.messages.some(m => m.id === assistantMsg.id) 
              ? s.messages 
              : [...s.messages, assistantMsg];
            return { ...s, title: newTitle, messages: updatedMessages, updatedAt: Date.now() };
          }
          return s;
        });
        return { ...prev, sessions: finalSessions, currentSessionId: currentId };
      });
      
      const artifacts = extractArtifacts(aiResponse);
      if (artifacts.length > 0) {
        setCurrentArtifact(artifacts[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return <Onboarding onComplete={handleOnboarding} />;
  }

  const isDark = profile.settings.theme === 'dark';

  return (
    <div className={`flex h-screen w-screen overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#121212] text-white' : 'bg-white text-[#1a1a1a]'}`}>
      {/* Sidebar Overlay */}
      <div className={`fixed inset-0 z-50 lg:relative lg:inset-auto ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        <Sidebar 
          userName={profile.name} 
          theme={profile.settings.theme}
          sessions={profile.sessions}
          currentSessionId={profile.currentSessionId}
          onNewChat={() => { handleNewChat(); setIsSidebarOpen(false); }} 
          onSelectSession={(id) => { handleSelectSession(id); setIsSidebarOpen(false); }}
          onDeleteSession={handleDeleteSession}
          onFeatureSelect={(name) => { handleSendMessage(`Module: ${name}`); setIsSidebarOpen(false); }} 
          onToggleTheme={() => handleUpdateSettings({ theme: isDark ? 'light' : 'dark' })}
          onOpenSettings={() => alert('NC-PRO v4.2 • Core Online')}
        />
      </div>
      
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {/* Mobile Header */}
        <div className={`lg:hidden flex items-center justify-between p-4 border-b shrink-0 ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-[#E5E5E1]'}`}>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-[#D97757] text-white rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D97757] rounded-lg" />
            <span className="font-black text-sm uppercase tracking-tighter">Name-Code</span>
          </div>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-hidden relative">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={currentArtifact ? 50 : 100} minSize={30}>
              <ChatInterface 
                messages={currentSession?.messages || []} 
                isLoading={isLoading} 
                onSendMessage={handleSendMessage}
                userName={profile.name}
                theme={profile.settings.theme}
                settings={profile.settings}
                onUpdateSettings={handleUpdateSettings}
              />
            </Panel>
            
            {currentArtifact && (
              <>
                <PanelResizeHandle className={`w-1 transition-all md:block hidden ${isDark ? 'bg-[#2a2a2a] hover:bg-[#D97757]' : 'bg-[#E5E5E1] hover:bg-[#D97757]'}`} />
                <Panel minSize={30} className="fixed inset-0 z-[60] md:relative md:inset-auto">
                  <ArtifactView 
                    artifact={currentArtifact} 
                    onClose={() => setCurrentArtifact(null)} 
                    theme={profile.settings.theme}
                  />
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
      </div>
    </div>
  );
}

